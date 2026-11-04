// Map scan mode, worker side: finds the hovered item's tooltip in a game
// screenshot by its blue modifier text, and OCRs it when it changed.
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

export interface ScanResult {
  // Null when no tooltip-like blue text is near the cursor.
  sig: string | null
  lines?: string[]
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
    const roiHsv = hsv.roi(rect)
    const maskBlue = new cv.Mat()
    const maskGrey = new cv.Mat()
    elapsed += timeIt(() => {
      cv.inRange(roiHsv, blueMin, blueMax, maskBlue)
      cv.inRange(roiHsv, greyMin, greyMax, maskGrey)
      cv.bitwise_or(maskBlue, maskGrey, maskBlue)
      cv.bitwise_not(maskBlue, maskBlue)
    })
    Bindings.ocrSetImage(maskBlue.data, maskBlue.cols, maskBlue.rows, maskBlue.channels())
    maskBlue.delete(); maskGrey.delete(); roiHsv.delete()
    tessApi.SetVariable('tessedit_pageseg_mode', '6') // uniform block of text
    elapsed += timeIt(() => { tessApi.Recognize() })
    const text: string = tessApi.GetUTF8Text()
    result.lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2)
    result.elapsed = elapsed
  }

  hsv.delete(); blue.delete(); area.delete(); full.delete()
  return result
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
