// Map scan mode, worker side: finds the hovered item's tooltip in a game
// screenshot by its blue modifier text, and when it changed, cuts it into one
// enlarged image per text line. Main OCRs those lines across a pool of
// workers (ocrLine below), which is much faster and more accurate than
// reading the whole tooltip as one block.
// Runs in the vision worker (needs opencv + tesseract from ../vision).
import * as Bindings from '../vision/wasm-bindings'
import { cv, tessApi } from '../vision/wasm-bindings'
import { hsvToU8, timeIt } from '../vision/utils'
import type { ImageData } from '../vision/utils'

// Magic-blue modifier text (#8888FF), with room for anti-aliasing.
const BLUE_MIN = hsvToU8(222, 25, 55)
const BLUE_MAX = hsvToU8(258, 72, 100)
// Grey/white property text ("Item Quantity: ", "Map Tier: ").
const GREY_MIN = hsvToU8(0, 0, 42)
const GREY_MAX = hsvToU8(360, 14, 100)

export interface ScanOptions {
  cursor: { x: number, y: number }
  // Top-left of the image within the game window, when main sent a crop.
  originX?: number
  originY?: number
  // Game window height, when the image is a crop shorter than the window.
  refHeight?: number
  // Search the whole image, not a band around the cursor (locked rolling).
  whole?: boolean
  // OCR only when this frame's signature equals `stableSig` (unchanged for
  // two frames, so not mid-animation) and differs from `lastReadSig`.
  stableSig: string | null
  lastReadSig: string | null
}

// One text line, dark text on white, 1 byte per pixel.
export interface LineImage {
  width: number
  height: number
  data: Uint8Array
}

export interface ScanResult {
  // Null when no tooltip-like blue text is near the cursor.
  sig: string | null
  lines?: string[]
  // Map scan: the tooltip's text lines, for main to OCR in parallel.
  lineImages?: LineImage[]
  rect?: { x: number, y: number, width: number, height: number }
  elapsed: number
}

function scalarMat (values: number[]) {
  const m = new cv.Mat(3, 1, cv.CV_8U)
  m.data.set(values)
  return m
}

let blueMin: any, blueMax: any, greyMin: any, greyMax: any // eslint-disable-line @typescript-eslint/no-explicit-any

export function scanTooltip (img: ImageData, opts: ScanOptions): ScanResult {
  if (!blueMin) {
    blueMin = scalarMat(BLUE_MIN)
    blueMax = scalarMat(BLUE_MAX)
    greyMin = scalarMat(GREY_MIN)
    greyMax = scalarMat(GREY_MAX)
  }
  let elapsed = 0
  const H = img.height
  const W = img.width
  // Sizes scale with the game window, not with the crop we were sent.
  const refH = opts.refHeight ?? H
  // Tooltips open beside the hovered item, left or right of it.
  const halfW = Math.round(refH * 0.6)
  const x0 = opts.whole ? 0 : Math.max(0, Math.min(W - 1, opts.cursor.x - halfW))
  const x1 = opts.whole ? W : Math.max(x0 + 1, Math.min(W, opts.cursor.x + halfW))

  const full = Bindings.cvMatFromImage(img)
  const area = full.roi(new cv.Rect(x0, 0, x1 - x0, H))
  const hsv = new cv.Mat()
  const blue = new cv.Mat()
  elapsed += timeIt(() => {
    cv.cvtColor(area, hsv, cv.COLOR_BGR2HSV_FULL)
    cv.inRange(hsv, blueMin, blueMax, blue)
  })

  const minPixels = Math.round((refH / 1080) * (refH / 1080) * 400)
  const count = cv.countNonZero(blue)
  if (count < minPixels) {
    hsv.delete(); blue.delete(); area.delete(); full.delete()
    return { sig: null, elapsed }
  }

  const box = maskBounds(blue.data as Uint8Array, blue.cols, blue.rows)
  // Include the property lines above the mods (tier, quantity, pack size...).
  const lineH = Math.round(refH * 0.0185)
  const top = Math.max(0, box.y - lineH * 12)
  const left = Math.max(0, box.x - lineH)
  const right = Math.min(blue.cols, box.x + box.width + lineH)
  const rect = new cv.Rect(left, top, right - left, box.y + box.height + Math.round(lineH / 2) - top)
  rect.height = Math.min(rect.height, blue.rows - top)

  // Signature: coarse picture of the blue text, so a reroll (new mods)
  // changes it but cursor jitter doesn't.
  const small = new cv.Mat()
  const blueBox = blue.roi(box)
  cv.resize(blueBox, small, new cv.Size(48, 24), 0, 0, cv.INTER_AREA)
  blueBox.delete()
  let bits = ''
  for (let i = 0; i < small.data.length; i++) bits += small.data[i] > 40 ? '1' : '0'
  small.delete()
  const sig = `${Math.round(((opts.originX ?? 0) + x0 + box.x) / 8)},${Math.round(((opts.originY ?? 0) + box.y) / 8)}:${hashBits(bits)}`

  const result: ScanResult = {
    sig,
    elapsed,
    rect: { x: x0 + rect.x, y: rect.y, width: rect.width, height: rect.height }
  }

  if (sig === opts.stableSig && sig !== opts.lastReadSig) {
    elapsed += timeIt(() => {
      const roiHsv = hsv.roi(rect)
      const hsvData = roiHsv.clone()
      const maskBlue = new cv.Mat()
      const maskGrey = new cv.Mat()
      cv.inRange(roiHsv, blueMin, blueMax, maskBlue)
      cv.inRange(roiHsv, greyMin, greyMax, maskGrey)
      result.lineImages = cutLines(
        maskBlue.data as Uint8Array, maskGrey.data as Uint8Array, hsvData.data as Uint8Array,
        rect.width, rect.height, lineH)
      maskBlue.delete(); maskGrey.delete(); hsvData.delete(); roiHsv.delete()
    })
    result.elapsed = elapsed
  }

  hsv.delete(); blue.delete(); area.delete(); full.delete()
  return result
}

// Line images are scaled so text is about this tall: Tesseract reads text
// much better at ~30 px than at the 10-15 px the game draws it.
const LINE_TARGET_H = 34
const MAX_LINES = 24

// Splits the tooltip into text lines by rows of text pixels. Lines with blue
// (mods, and property values like "+45%") are kept; grey-only lines only when
// they're line-sized (Map Tier), so background showing through the
// translucent tooltip isn't read.
export function cutLines (blue: Uint8Array, grey: Uint8Array, hsv: Uint8Array, cols: number, rows: number, lineH: number): LineImage[] {
  const rowBlue = new Int32Array(rows)
  const rowGrey = new Int32Array(rows)
  for (let y = 0; y < rows; y++) {
    let b = 0
    let g = 0
    const off = y * cols
    for (let x = 0; x < cols; x++) {
      if (blue[off + x]) b++
      else if (grey[off + x]) g++
    }
    rowBlue[y] = b
    rowGrey[y] = g
  }
  const runs: Array<{ y0: number, y1: number }> = []
  let start = -1
  let gap = 0
  for (let y = 0; y <= rows; y++) {
    const ink = y < rows && (rowBlue[y] > 0 || rowGrey[y] >= 2)
    if (ink) {
      if (start < 0) start = y
      gap = 0
    } else if (start >= 0 && (++gap > 1 || y === rows)) {
      runs.push({ y0: start, y1: y - gap })
      start = -1
      gap = 0
    }
  }

  const out: LineImage[] = []
  for (const run of runs) {
    // Text lines that touch (no blank row between) are split evenly.
    const h = run.y1 - run.y0 + 1
    const parts = Math.max(1, Math.round(h / (lineH * 1.05)))
    for (let p = 0; p < parts && out.length < MAX_LINES; p++) {
      const y0 = run.y0 + Math.floor((h * p) / parts)
      const y1 = run.y0 + Math.floor((h * (p + 1)) / parts) - 1
      const img = cutLine(blue, grey, hsv, cols, rows, y0, y1, lineH, rowBlue, rowGrey)
      if (img) out.push(img)
    }
  }
  return out
}

function cutLine (
  blue: Uint8Array, grey: Uint8Array, hsv: Uint8Array, cols: number, rows: number,
  y0: number, y1: number, lineH: number, rowBlue: Int32Array, rowGrey: Int32Array
): LineImage | null {
  const h = y1 - y0 + 1
  let nBlue = 0
  let nGrey = 0
  for (let y = y0; y <= y1; y++) { nBlue += rowBlue[y]; nGrey += rowGrey[y] }
  const hasBlue = nBlue >= 4
  if (hasBlue ? h < lineH * 0.3 : (h < lineH * 0.4 || h > lineH * 1.2 || nGrey < lineH * 2)) return null

  // Horizontal extent of the text: grow from the blue (or densest) column
  // across word gaps, stopping at a wide gap, so stray background pixels
  // further along the row aren't included.
  const colInk = new Int32Array(cols)
  const colBlue = new Int32Array(cols)
  for (let y = y0; y <= y1; y++) {
    const off = y * cols
    for (let x = 0; x < cols; x++) {
      if (blue[off + x]) { colBlue[x]++; colInk[x]++ } else if (grey[off + x]) colInk[x]++
    }
  }
  let seed = 0
  for (let x = 1; x < cols; x++) {
    if ((hasBlue ? colBlue[x] - colBlue[seed] : colInk[x] - colInk[seed]) > 0) seed = x
  }
  const maxGap = Math.round(lineH * 0.9)
  let x0 = seed
  for (let x = seed, gap = 0; x >= 0 && gap <= maxGap; x--) {
    if (colInk[x]) { x0 = x; gap = 0 } else gap++
  }
  let x1 = seed
  for (let x = seed, gap = 0; x < cols && gap <= maxGap; x++) {
    if (colInk[x]) { x1 = x; gap = 0 } else gap++
  }
  if (x1 - x0 < lineH) return null

  // Dark text on white, keeping the glyphs' brightness for smooth edges.
  const pad = Math.max(2, Math.round(lineH / 4))
  const ox = Math.max(0, x0 - pad)
  const oy = Math.max(0, y0 - 2)
  const w = Math.min(cols, x1 + pad + 1) - ox
  const hh = Math.min(rows, y1 + 3) - oy
  const src = new cv.Mat(hh, w, cv.CV_8U)
  const d = src.data as Uint8Array
  for (let y = 0; y < hh; y++) {
    const off = (oy + y) * cols + ox
    for (let x = 0; x < w; x++) {
      const i = off + x
      d[y * w + x] = (blue[i] || grey[i]) ? 255 - hsv[i * 3 + 2] : 255
    }
  }
  const scale = Math.min(4, Math.max(1, LINE_TARGET_H / Math.max(h, 1)))
  const big = new cv.Mat()
  cv.resize(src, big, new cv.Size(Math.round(w * scale), Math.round(hh * scale)), 0, 0, cv.INTER_LINEAR)
  src.delete()
  const img = { width: big.cols as number, height: big.rows as number, data: new Uint8Array(big.data as Uint8Array) }
  big.delete()
  return img
}

// Reads one line image (see LineImage). Runs in any vision worker.
const LINE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%+-.,:\'() '
export function ocrLine (img: LineImage): string {
  Bindings.ocrSetImage(img.data, img.width, img.height, 1)
  tessApi.SetVariable('tessedit_pageseg_mode', '7') // single line
  tessApi.SetVariable('tessedit_char_whitelist', LINE_CHARS)
  tessApi.Recognize()
  const text: string = tessApi.GetUTF8Text()
  // The worker's tesseract is shared with other readers.
  tessApi.SetVariable('tessedit_char_whitelist', '')
  return text.replace(/\s+/g, ' ').trim()
}

// Smallest rect holding every set pixel. APT's OCR files ship a reduced opencv
// without cv.boundingRect. The mask must have at least one set pixel.
function maskBounds (data: Uint8Array, cols: number, rows: number) {
  let x0 = cols
  let x1 = -1
  let y0 = rows
  let y1 = -1
  for (let y = 0; y < rows; y++) {
    const off = y * cols
    for (let x = 0; x < cols; x++) {
      if (data[off + x]) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        y1 = y
      }
    }
  }
  return new cv.Rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1)
}

function hashBits (s: string): string {
  // FNV-1a, 32 bit.
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}
