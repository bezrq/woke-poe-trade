// Essence scan mode, worker side: finds the label of a hovered essence
// monolith near the cursor (a short stack of light text lines on a dark
// box: monster name, then one line per essence) and OCRs it when it changed.
// Runs in the vision worker (needs opencv + tesseract from ../vision).
//
// The thresholds below are first guesses from 1080p screenshots and need
// tuning in game, like map scan's did.
import * as Bindings from '../vision/wasm-bindings'
import { cv, tessApi } from '../vision/wasm-bindings'
import { timeIt } from '../vision/utils'
import type { ImageData } from '../vision/utils'
import type { ScanOptions, ScanResult } from './map-scan-vision'

// Label text is light grey/white; anything brighter than this counts as text.
const TEXT_GRAY_MIN = 150
// Search box around the cursor, in units of window height. The label sits
// above the monolith, and you may be hovering either.
const AREA_HALF_W = 0.3
const AREA_ABOVE = 0.4
const AREA_BELOW = 0.08

interface Band { y0: number, y1: number, x0: number, x1: number }

export function scanEssenceLabel (img: ImageData, opts: ScanOptions): ScanResult {
  let elapsed = 0
  const H = img.height
  const W = img.width
  const lineH = Math.max(8, Math.round(H * 0.0185))

  const ax0 = clamp(Math.round(opts.cursor.x - H * AREA_HALF_W), 0, W - 1)
  const ax1 = clamp(Math.round(opts.cursor.x + H * AREA_HALF_W), ax0 + 1, W)
  const ay0 = clamp(Math.round(opts.cursor.y - H * AREA_ABOVE), 0, H - 1)
  const ay1 = clamp(Math.round(opts.cursor.y + H * AREA_BELOW), ay0 + 1, H)

  const full = Bindings.cvMatFromImage(img)
  const area = full.roi(new cv.Rect(ax0, ay0, ax1 - ax0, ay1 - ay0))
  const gray = new cv.Mat()
  const mask = new cv.Mat()
  elapsed += timeIt(() => {
    cv.cvtColor(area, gray, cv.COLOR_BGR2GRAY)
    cv.threshold(gray, mask, TEXT_GRAY_MIN, 255, cv.THRESH_BINARY)
  })

  let bands: Band[] = []
  elapsed += timeIt(() => {
    bands = findTextBands(mask.data as Uint8Array, mask.cols, mask.rows, lineH)
  })
  const cursorY = opts.cursor.y - ay0
  const block = pickLabelBlock(bands, lineH, cursorY)
  if (!block) {
    gray.delete(); mask.delete(); area.delete(); full.delete()
    return { sig: null, elapsed }
  }

  const pad = Math.round(lineH / 2)
  const rx0 = Math.max(0, block.x0 - pad)
  const ry0 = Math.max(0, block.y0 - pad)
  const rx1 = Math.min(mask.cols, block.x1 + pad)
  const ry1 = Math.min(mask.rows, block.y1 + pad)
  const rect = new cv.Rect(rx0, ry0, rx1 - rx0, ry1 - ry0)

  // Signature: coarse picture of the text, so a different monolith (or the
  // same one after corrupting) changes it but small camera moves don't.
  const blockMask = mask.roi(rect)
  const small = new cv.Mat()
  cv.resize(blockMask, small, new cv.Size(48, 16), 0, 0, cv.INTER_AREA)
  let bits = ''
  for (let i = 0; i < small.data.length; i++) bits += small.data[i] > 60 ? '1' : '0'
  small.delete()
  const sig = `e${block.lines}:${hashBits(bits)}`

  const result: ScanResult = {
    sig,
    elapsed,
    rect: { x: ax0 + rx0, y: ay0 + ry0, width: rect.width, height: rect.height }
  }

  if (sig === opts.stableSig && sig !== opts.lastReadSig) {
    const ocrImg = new cv.Mat()
    elapsed += timeIt(() => {
      // Black text on white, scaled up a little: tesseract reads small
      // game fonts better that way.
      cv.bitwise_not(blockMask, ocrImg)
      cv.resize(ocrImg, ocrImg, new cv.Size(0, 0), 1.5, 1.5, cv.INTER_LINEAR)
    })
    Bindings.ocrSetImage(ocrImg.data, ocrImg.cols, ocrImg.rows, ocrImg.channels())
    ocrImg.delete()
    tessApi.SetVariable('tessedit_pageseg_mode', '6') // uniform block of text
    elapsed += timeIt(() => { tessApi.Recognize() })
    const text: string = tessApi.GetUTF8Text()
    result.lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2)
    result.elapsed = elapsed
  }

  blockMask.delete(); gray.delete(); mask.delete(); area.delete(); full.delete()
  return result
}

// Rows with text pixels, grouped into line-height bands with their x extent.
// Exported for tests.
export function findTextBands (data: Uint8Array, cols: number, rows: number, lineH: number): Band[] {
  const minRowPixels = Math.max(3, Math.round(lineH * 0.25))
  const bands: Band[] = []
  let cur: Band | null = null
  for (let y = 0; y < rows; y++) {
    let count = 0
    let x0 = cols
    let x1 = -1
    const off = y * cols
    for (let x = 0; x < cols; x++) {
      if (data[off + x]) {
        count++
        if (x < x0) x0 = x
        x1 = x
      }
    }
    if (count >= minRowPixels) {
      if (cur && y - cur.y1 <= 1) {
        cur.y1 = y
        cur.x0 = Math.min(cur.x0, x0)
        cur.x1 = Math.max(cur.x1, x1)
      } else {
        if (cur) bands.push(cur)
        cur = { y0: y, y1: y, x0, x1 }
      }
    }
  }
  if (cur) bands.push(cur)
  // A text line is about one line tall and several characters wide.
  return bands.filter(b => {
    const h = b.y1 - b.y0 + 1
    const w = b.x1 - b.x0 + 1
    return h >= lineH * 0.35 && h <= lineH * 1.6 && w >= lineH * 3
  })
}

// Groups bands that are stacked closely and roughly centred on each other
// (labels are centred), and returns the group nearest the cursor that has
// at least two lines: the monster name plus at least one essence.
// Exported for tests.
export function pickLabelBlock (bands: Band[], lineH: number, cursorY: number):
  { x0: number, x1: number, y0: number, y1: number, lines: number } | null {
  const groups: Band[][] = []
  for (const b of bands) {
    const g = groups[groups.length - 1]
    const last = g?.[g.length - 1]
    const centred = last && Math.abs((b.x0 + b.x1) / 2 - (last.x0 + last.x1) / 2) < lineH * 3
    if (last && b.y0 - last.y1 <= lineH * 0.9 && centred) g.push(b)
    else groups.push([b])
  }
  let best: Band[] | null = null
  let bestDist = Infinity
  for (const g of groups) {
    if (g.length < 2 || g.length > 8) continue
    const y0 = g[0].y0
    const y1 = g[g.length - 1].y1
    const dist = cursorY < y0 ? y0 - cursorY : cursorY > y1 ? cursorY - y1 : 0
    if (dist < bestDist) { best = g; bestDist = dist }
  }
  if (!best) return null
  return {
    x0: Math.min(...best.map(b => b.x0)),
    x1: Math.max(...best.map(b => b.x1)),
    y0: best[0].y0,
    y1: best[best.length - 1].y1,
    lines: best.length
  }
}

function clamp (v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function hashBits (s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}
