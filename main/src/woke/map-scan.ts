// Scan modes, main side: while one is on and the game is focused, it takes a
// screenshot a few times a second, asks the vision worker to read the text
// under the cursor, and sends new readings to the overlay. Text is re-read
// whenever it changes, so rerolling the same map gives a new reading.
// Used by map scan (map tooltips) and essence scan (essence monolith labels).
import { uIOhook } from 'uiohook-napi'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import type { GameWindow } from '../windowing/GameWindow'
import { OcrWorker } from '../vision/link-main'
import type { ScanOptions, ScanResult } from './map-scan-vision'
import { perfRecord } from './perf'

// Stop after this long without the game focused, so it can't run forever.
const IDLE_STOP_MS = 30 * 60 * 1000
// Only take a screenshot once the cursor has rested this long.
const REST_MS = 150

// Files the OCR worker loads (the same ones APT's heist gem reader uses).
// The worker swallows load errors, so they're checked up front instead.
export const OCR_DIR = () => path.join(app.getPath('userData'), 'apt-data/cv-ocr')
const OCR_FILES = ['tesseract-core-simd.js', 'opencv.js', 'eng.traineddata']

export interface OcrCheck {
  ok: boolean
  windows: boolean
  dir: string
  missing: string[]
  message: string | null
}

export function checkOcr (): OcrCheck {
  const windows = process.platform === 'win32'
  const dir = OCR_DIR()
  let missing: string[] = []
  try {
    const have = new Set(fs.readdirSync(dir))
    missing = OCR_FILES.filter(f => !have.has(f))
  } catch {
    missing = [...OCR_FILES]
  }
  let message: string | null = null
  if (!windows) {
    message = 'Scanning needs Windows (it uses the game screenshot API).'
  } else if (missing.length) {
    message = `OCR files missing: ${missing.join(', ')}. Download cv-ocr from the Awakened PoE Trade releases page and unzip it into ${dir}`
  }
  return { ok: !message, windows, dir, missing, message }
}

export interface MapScanReading {
  lines: string[]
  // Cursor position as a fraction of the game window, for placing the badge.
  at: { x: number, y: number }
  sig: string
  ocrMs: number
}

export interface ScannerKind {
  // Event topic for the overlay, e.g. 'map-scan'.
  topic: string
  // Shown in errors, e.g. 'Map scan mode'.
  name: string
  frameMs: number
  // Stop when nothing has been read for this long (e.g. the stash was closed).
  noReadingStopMs?: number
  // Only this much of the screen either side of the cursor is sent to the
  // vision worker, as a fraction of the window height.
  cropHalfWidth: number
  read: (worker: OcrWorker, image: { width: number, height: number, data: Uint8Array }, opts: ScanOptions) => Promise<ScanResult>
}

export const MAP_SCAN: ScannerKind = {
  topic: 'map-scan',
  name: 'Map scan mode',
  frameMs: 150,
  noReadingStopMs: 3 * 60 * 1000,
  cropHalfWidth: 0.6,
  read: async (worker, image, opts) => await worker.scanMapTooltip(image, opts)
}

export const ESSENCE_SCAN: ScannerKind = {
  topic: 'essence-scan',
  name: 'Essence scan mode',
  frameMs: 200,
  cropHalfWidth: 0.3,
  read: async (worker, image, opts) => await worker.scanEssenceLabel(image, opts)
}

// One OCR worker shared by all scan modes (each would load tesseract + opencv).
// It holds 100-200 MB, so it's shut down once no scan has run for a while.
const WORKER_IDLE_MS = 2 * 60 * 1000
let sharedWorker: Promise<OcrWorker> | null = null
let idleTimer: ReturnType<typeof setTimeout> | undefined
const runningScanners = new Set<ScreenScanner>()

async function getWorker (): Promise<OcrWorker> {
  clearTimeout(idleTimer)
  sharedWorker ??= OcrWorker.create().then(async (w) => {
    await w.updateOptions('en')
    return w
  })
  return await sharedWorker
}

function scannerStopped (scanner: ScreenScanner) {
  runningScanners.delete(scanner)
  releaseWorker()
}

// Shuts the worker down after a while unless a scan is using it.
function releaseWorker () {
  if (runningScanners.size || !sharedWorker) return
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (runningScanners.size || !sharedWorker) return
    const worker = sharedWorker
    sharedWorker = null
    worker.then(async w => { await w.terminate() }).catch(() => {})
  }, WORKER_IDLE_MS)
}

export class ScreenScanner {
  private worker: OcrWorker | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private running = false
  private mouse = { x: 0, y: 0 }
  private movedAt = 0
  // Cursor position of the last frame that found no tooltip; while the
  // cursor stays there, no screenshots are taken.
  private emptyAt: { x: number, y: number } | null = null
  private lastReadingAt = Date.now()
  private prevSig: string | null = null
  private lastReadSig: string | null = null
  private lastActive = Date.now()
  private failures = 0
  // Bumped on every start/stop so a frame still in flight from an earlier
  // run doesn't schedule a second loop.
  private loopId = 0

  constructor (
    private readonly server: ServerEvents,
    private readonly logger: Logger,
    private readonly poeWindow: GameWindow,
    private readonly kind: ScannerKind = MAP_SCAN
  ) {}

  // Only listened to while scanning: mouse events arrive at polling rate.
  private readonly onMouseMove = (e: { x: number, y: number }) => {
    this.mouse = { x: e.x, y: e.y }
    this.movedAt = Date.now()
  }

  get isRunning () { return this.running }

  async start (): Promise<{ running: boolean }> {
    const check = checkOcr()
    if (!check.ok) throw new Error(check.message!)
    try {
      // Every start: the shared worker may have been shut down while idle.
      this.worker = await getWorker()
    } catch (err) {
      sharedWorker = null
      throw err
    }
    if (!this.running) {
      this.running = true
      runningScanners.add(this)
      this.prevSig = null
      this.lastReadSig = null
      this.lastActive = Date.now()
      this.lastReadingAt = Date.now()
      this.emptyAt = null
      this.failures = 0
      this.loopId++
      uIOhook.on('mousemove', this.onMouseMove)
      this.schedule()
      this.emitState()
    }
    return { running: true }
  }

  stop (reason?: string): { running: boolean } {
    if (this.running) {
      this.running = false
      this.loopId++
      clearTimeout(this.timer)
      uIOhook.removeListener('mousemove', this.onMouseMove)
      scannerStopped(this)
      this.emitState(reason)
    }
    return { running: false }
  }

  // Forget the last reading, so the tooltip under the cursor is read again.
  reread (): { ok: true } {
    this.lastReadSig = null
    this.emptyAt = null
    return { ok: true }
  }

  private schedule () {
    const id = this.loopId
    this.timer = setTimeout(() => {
      this.frame().finally(() => { if (this.running && id === this.loopId) this.schedule() })
    }, this.kind.frameMs)
  }

  private async frame () {
    if (!this.poeWindow.isActive) {
      if (Date.now() - this.lastActive > IDLE_STOP_MS) this.stop('Stopped after 30 minutes away from the game.')
      return
    }
    this.lastActive = Date.now()
    const bounds = this.poeWindow.bounds
    if (!bounds.width || !bounds.height) return
    const cursor = { x: this.mouse.x - bounds.x, y: this.mouse.y - bounds.y }
    if (cursor.x < 0 || cursor.y < 0 || cursor.x >= bounds.width || cursor.y >= bounds.height) return
    if (this.kind.noReadingStopMs && Date.now() - this.lastReadingAt > this.kind.noReadingStopMs) {
      this.stop(`Stopped: nothing to read for ${Math.round(this.kind.noReadingStopMs / 60000)} minutes.`)
      return
    }
    // Wait for the cursor to rest, and skip frames while it sits where
    // there was nothing to read.
    if (Date.now() - this.movedAt < REST_MS) return
    if (this.emptyAt && this.emptyAt.x === this.mouse.x && this.emptyAt.y === this.mouse.y) return

    try {
      const t0 = performance.now()
      const shot = this.poeWindow.screenshot()
      // Send only a vertical strip around the cursor: less to copy into the
      // worker and to colour-convert there.
      const half = Math.round(bounds.height * this.kind.cropHalfWidth)
      const x0 = Math.max(0, cursor.x - half)
      const x1 = Math.min(bounds.width, cursor.x + half)
      const data = cropColumns(shot, bounds.width, bounds.height, x0, x1)
      const res = await this.kind.read(this.worker!,
        { width: x1 - x0, height: bounds.height, data },
        { cursor: { x: cursor.x - x0, y: cursor.y }, originX: x0, stableSig: this.prevSig, lastReadSig: this.lastReadSig })
      perfRecord(`${this.kind.name}: frame`, performance.now() - t0)
      this.failures = 0
      this.prevSig = res.sig
      this.emptyAt = res.sig == null ? { ...this.mouse } : null
      if (res.sig != null) this.lastReadingAt = Date.now()
      if (res.sig == null) {
        // Tooltip gone: hovering the same map again later reads it again.
        if (this.lastReadSig != null) {
          this.lastReadSig = null
          this.send({ type: 'clear' })
        }
        return
      }
      if (res.lines) {
        perfRecord(`${this.kind.name}: read text`, res.elapsed)
        this.lastReadSig = res.sig
        const reading: MapScanReading = {
          lines: res.lines,
          at: { x: cursor.x / bounds.width, y: cursor.y / bounds.height },
          sig: res.sig,
          ocrMs: Math.round(res.elapsed)
        }
        this.send({ type: 'reading', reading })
      }
    } catch (err) {
      this.failures++
      if (this.failures === 1) this.logger.write(`error [${this.kind.topic}] ${String(err)}`)
      if (this.failures >= 5) {
        this.stop('OCR isn\'t working. Check that the OCR files are installed (the same ones APT\'s heist gem OCR uses).')
      }
    }
  }

  private emitState (message?: string) {
    this.send({ type: 'state', running: this.running, message })
  }

  private send (data: unknown) {
    this.server.sendEventTo('broadcast', {
      name: 'MAIN->CLIENT::woke-event',
      payload: { topic: this.kind.topic, data }
    })
  }
}

// Essence scan's one-shot: reads every label on screen once. Positions are
// fractions of the game window.
export async function readAllEssenceLabels (poeWindow: GameWindow):
Promise<{ labels: Array<{ lines: string[], at: { x: number, y: number } }> }> {
  const check = checkOcr()
  if (!check.ok) throw new Error(check.message!)
  const bounds = poeWindow.bounds
  if (!bounds.width || !bounds.height) throw new Error('Game window not found.')
  let worker: OcrWorker
  try {
    worker = await getWorker()
  } catch (err) {
    sharedWorker = null
    throw err
  }
  try {
    const t0 = performance.now()
    const shot = poeWindow.screenshot()
    const res = await worker.scanAllEssenceLabels({ width: bounds.width, height: bounds.height, data: shot })
    perfRecord('Essence scan: whole screen', performance.now() - t0)
    return {
      labels: res.labels.map(l => ({ lines: l.lines, at: { x: l.at.x / bounds.width, y: l.at.y / bounds.height } }))
    }
  } finally {
    releaseWorker()
  }
}

// Copies columns x0..x1 of a 4-byte-per-pixel image.
function cropColumns (data: Uint8Array, width: number, height: number, x0: number, x1: number): Uint8Array {
  if (x0 === 0 && x1 === width) return data
  const rowBytes = (x1 - x0) * 4
  const out = new Uint8Array(rowBytes * height)
  for (let y = 0; y < height; y++) {
    const from = (y * width + x0) * 4
    out.set(data.subarray(from, from + rowBytes), y * rowBytes)
  }
  return out
}
