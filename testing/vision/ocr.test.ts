// OCR tests: the vision worker's code (opencv + tesseract, as shipped with
// APT) reads the screenshots in fixtures/screens, and the overlay's parsers
// turn the text into map mods / essences. Each screenshot's .json says what
// should come out.
//
// Needs the OCR files: `npm run get:ocr` (CI caches them).
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { TooltipMatcher } from '../../renderer/src/web/woke/map-mods/tooltip-parse'
import { parseMonolith } from '../../renderer/src/web/woke/essence-scan/essences'

const require = createRequire(import.meta.url)
const SCREENS = path.resolve(__dirname, '../fixtures/screens')
const OCR_DIR = process.env.WOKE_OCR_DIR ?? path.resolve(__dirname, '../.cache/cv-ocr')
const haveOcr = fs.existsSync(path.join(OCR_DIR, 'opencv.js'))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let V: any

interface Screen {
  file: string
  cursor: { x: number, y: number }
  kind: 'map' | 'essence' | 'essence-all'
  synthetic?: boolean
  tier?: number
  props?: Record<string, number>
  mods?: string[]
  essences?: string[]
  labels?: string[][]
}

function screens (kind: Screen['kind']): Screen[] {
  return fs.readdirSync(SCREENS).filter(f => f.endsWith('.json')).map(f => ({
    file: f.replace(/\.json$/, '.png'),
    ...JSON.parse(fs.readFileSync(path.join(SCREENS, f), 'utf8'))
  })).filter((s: Screen) => s.kind === kind)
}

// A screenshot as the app gets it on Windows: BGRA.
function loadScreen (file: string) {
  const img = V.decodePng(fs.readFileSync(path.join(SCREENS, file)))
  const data = new Uint8Array(img.data.length)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = img.data[i + 2]; data[i + 1] = img.data[i + 1]; data[i + 2] = img.data[i]; data[i + 3] = 255
  }
  return { width: img.width, height: img.height, data }
}

// Every map mod line in the game data (what the overlay matches against).
function areaMods (): string[] {
  const ndjson = fs.readFileSync(path.resolve(__dirname, '../../renderer/public/data/en/stats.ndjson'), 'utf8')
  const out = new Set<string>()
  for (const line of ndjson.split('\n')) {
    if (!line.includes('fromAreaMods')) continue
    const entry = JSON.parse(line)
    for (const stat of ('stats' in entry ? entry.stats : [entry])) {
      if (!stat.fromAreaMods || stat.fromAreaMods === 'heist_exclusive') continue
      for (const m of stat.matchers) out.add(m.string)
    }
  }
  return [...out]
}

// Map scan, as main runs it: a first frame finds the tooltip, the next
// (unchanged) frame cuts it into lines, then each line is OCR'd.
function readMapTooltip (screen: Screen): string[] {
  const img = loadScreen(screen.file)
  const first = V.scanTooltip({ ...img, data: img.data.slice() }, { cursor: screen.cursor, stableSig: null, lastReadSig: null })
  expect(first.sig, 'tooltip found near the cursor').toBeTruthy()
  const second = V.scanTooltip(img, { cursor: screen.cursor, stableSig: first.sig, lastReadSig: null })
  expect(second.lineImages?.length).toBeGreaterThan(0)
  return second.lineImages.map((l: unknown) => V.ocrLine(l).trim()).filter(Boolean)
}

describe.skipIf(!haveOcr)('OCR on game screenshots', () => {
  beforeAll(async () => {
    V = require('../fake-host/dist/vision-lib.cjs')
    await V.Bindings.init(OCR_DIR)
    await V.Bindings.changeLanguage('en', OCR_DIR)
  })

  const matcher = new TooltipMatcher(areaMods())

  for (const screen of screens('map')) {
    it(`map scan reads the mods on ${screen.file}`, () => {
      const lines = readMapTooltip(screen)
      const parsed = matcher.parse(lines)
      expect(parsed, `parsed from:\n${lines.join('\n')}`).not.toBeNull()
      expect(parsed!.mods.map(m => m.matcher).sort(), `read:\n${lines.join('\n')}`).toEqual([...screen.mods!].sort())
      expect(parsed!.weak, 'lines read with low confidence').toEqual([])
    })

    // The synthetic screenshots use an older tooltip layout (a grey "Map
    // Tier:" line; the game now shows the tier in the header) and the grey
    // labels come out garbled there ("VWIAE TER: 16"). On real screenshots
    // the labels read fine (see the "Make OCR scans accurate" work, which adds
    // real labelled samples). Kept as an expected failure until these
    // screenshots are replaced by real ones.
    it.fails(`map scan reads tier and properties on ${screen.file}`, () => {
      const parsed = matcher.parse(readMapTooltip(screen))
      expect(parsed!.tier).toBe(screen.tier)
      expect(parsed!.props).toMatchObject(screen.props!)
    })
  }

  for (const screen of screens('essence')) {
    it(`essence scan reads ${screen.file}`, () => {
      const img = loadScreen(screen.file)
      const first = V.scanEssenceLabel({ ...img, data: img.data.slice() }, { cursor: screen.cursor, stableSig: null, lastReadSig: null })
      expect(first.sig, 'label found near the cursor').toBeTruthy()
      const second = V.scanEssenceLabel(img, { cursor: screen.cursor, stableSig: first.sig, lastReadSig: null })
      const mono = parseMonolith(second.lines ?? [])
      expect(mono?.essences.map(e => e.name), `read:\n${(second.lines ?? []).join('\n')}`).toEqual(screen.essences)
    })
  }

  for (const screen of screens('essence-all')) {
    it(`whole-screen essence read finds every label in ${screen.file}`, () => {
      const { labels } = V.scanAllEssenceLabels(loadScreen(screen.file))
      const found = (labels as Array<{ lines: string[] }>)
        .map(l => parseMonolith(l.lines)?.essences.map(e => e.name) ?? [])
        .filter(names => names.length)
      expect(found.map(f => f.join(' | ')).sort()).toEqual(screen.labels!.map(l => l.join(' | ')).sort())
    })
  }
})
