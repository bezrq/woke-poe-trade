// Essence scan mode, worker side. A hovered essence monster's label is a
// tooltip like a map's: a header, the monster's mods, then one centred blue
// line per essence. So it's found and cut into lines by the map scan code
// (centred stack of blue lines), and main OCRs the lines across its pool.
// Runs in the vision worker (needs opencv + tesseract from ../vision).
import { scanTooltip, scanAllTooltips, ocrLine } from './map-scan-vision'
import type { ScanOptions, ScanResult } from './map-scan-vision'
import type { ImageData } from '../vision/utils'

export function scanEssenceLabel (img: ImageData, opts: ScanOptions): ScanResult {
  return scanTooltip(img, opts, 'essence')
}

export interface LabelReading {
  lines: string[]
  // Centre of the label, in image pixels.
  at: { x: number, y: number }
}

// One-shot read of every label on screen. Non-essence tooltips are read too
// and dropped by the overlay.
export function scanAllEssenceLabels (img: ImageData): { labels: LabelReading[], elapsed: number } {
  return scanAllTooltips(img, ocrLine)
}
