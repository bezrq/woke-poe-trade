// Scan modes, main side: while one is on and the game is focused, it takes a
// screenshot a few times a second, asks the vision worker to read the text
// under the cursor, and sends new readings to the overlay. Text is re-read
// whenever it changes, so rerolling the same map gives a new reading.
// Used by map scan (map tooltips) and essence scan (essence monolith labels).
import { uIOhook } from 'uiohook-napi'
import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import type { GameWindow } from '../windowing/GameWindow'
import { OcrWorker } from '../vision/link-main'
import type { ScanOptions, ScanResult } from './map-scan-vision'

// Stop after this long without the game focused, so it can't run forever.
const IDLE_STOP_MS = 30 * 60 * 1000

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
  read: (worker: OcrWorker, image: { width: number, height: number, data: Uint8Array }, opts: ScanOptions) => Promise<ScanResult>
}

export const MAP_SCAN: ScannerKind = {
  topic: 'map-scan',
  name: 'Map scan mode',
  frameMs: 150,
  read: async (worker, image, opts) => await worker.scanMapTooltip(image, opts)
}

export const ESSENCE_SCAN: ScannerKind = {
  topic: 'essence-scan',
  name: 'Essence scan mode',
  frameMs: 200,
  read: async (worker, image, opts) => await worker.scanEssenceLabel(image, opts)
}

// One OCR worker shared by all scan modes (each would load tesseract + opencv).
let sharedWorker: Promise<OcrWorker> | null = null
async function getWorker (): Promise<OcrWorker> {
  sharedWorker ??= OcrWorker.create().then(async (w) => {
    await w.updateOptions('en')
    return w
  })
  return await sharedWorker
}

export class ScreenScanner {
  private worker: OcrWorker | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private running = false
  private mouse = { x: 0, y: 0 }
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
  ) {
    uIOhook.on('mousemove', (e) => {
      this.mouse = { x: e.x, y: e.y }
    })
  }

  get isRunning () { return this.running }

  async start (): Promise<{ running: boolean }> {
    if (process.platform !== 'win32') {
      throw new Error(`${this.kind.name} needs Windows (it uses the game screenshot API).`)
    }
    if (!this.worker) {
      try {
        this.worker = await getWorker()
      } catch (err) {
        sharedWorker = null
        throw err
      }
    }
    if (!this.running) {
      this.running = true
      this.prevSig = null
      this.lastReadSig = null
      this.lastActive = Date.now()
      this.failures = 0
      this.loopId++
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
      this.emitState(reason)
    }
    return { running: false }
  }

  // Forget the last reading, so the tooltip under the cursor is read again.
  reread (): { ok: true } {
    this.lastReadSig = null
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

    try {
      const data = this.poeWindow.screenshot()
      const res = await this.kind.read(this.worker!,
        { width: bounds.width, height: bounds.height, data },
        { cursor, stableSig: this.prevSig, lastReadSig: this.lastReadSig })
      this.failures = 0
      this.prevSig = res.sig
      if (res.sig == null) {
        // Tooltip gone: hovering the same map again later reads it again.
        if (this.lastReadSig != null) {
          this.lastReadSig = null
          this.send({ type: 'clear' })
        }
        return
      }
      if (res.lines) {
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
