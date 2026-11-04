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
// Real, labelled screenshots of essence monsters (the OCR bench's set).
const REAL_ESSENCES = path.resolve(__dirname, '../../main/ocr-bench/samples/essences')
// The model the app reads scans with (trained on the game's font).
const SCAN_MODEL = path.resolve(__dirname, '../../renderer/public/data/ocr/poe.traineddata')
const OCR_DIR = process.env.WOKE_OCR_DIR ?? path.resolve(__dirname, '../.cache/cv-ocr')
const haveOcr = fs.existsSync(path.join(OCR_DIR, 'opencv.js'))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let V: any

interface Screen {
  file: string
  dir?: string
  cursor: { x: number, y: number }
  kind: 'map' | 'essence' | 'essence-all'
  synthetic?: boolean
  tier?: number
  props?: Record<string, number>
  mods?: string[]
  essences?: string[]
  labels?: string[][]
  screenHeight?: number
}

function screens (kind: Screen['kind']): Screen[] {
  return fs.readdirSync(SCREENS).filter(f => f.endsWith('.json')).map(f => ({
    file: f.replace(/\.json$/, '.png'),
    ...JSON.parse(fs.readFileSync(path.join(SCREENS, f), 'utf8'))
  })).filter((s: Screen) => s.kind === kind)
}

function realEssences (): Screen[] {
  if (!fs.existsSync(REAL_ESSENCES)) return []
  return fs.readdirSync(REAL_ESSENCES).filter(f => f.endsWith('.json')).sort().map(f => ({
    file: f.replace(/\.json$/, '.png'),
    ...JSON.parse(fs.readFileSync(path.join(REAL_ESSENCES, f), 'utf8'))
  }))
}

// A screenshot as the app gets it on Windows: BGRA.
function loadScreen (file: string, dir = SCREENS) {
  const img = V.decodePng(fs.readFileSync(path.join(dir, file)))
  const data = new Uint8Array(img.data.length)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = img.data[i + 2]; data[i + 1] = img.data[i + 1]; data[i + 2] = img.data[i]; data[i + 3] = 255
  }
  return { width: img.width, height: img.height, data }
}

// The real samples are crops (to keep the repo small): put one back on a
// dark screen of the game window's height, as the app would capture it.
function fullHeight (img: { width: number, height: number, data: Uint8Array }, screenHeight = img.height) {
  if (screenHeight <= img.height) return img
  const data = new Uint8Array(img.width * screenHeight * 4)
  for (let i = 3; i < data.length; i += 4) data[i] = 255
  data.set(img.data)
  return { width: img.width, height: screenHeight, data }
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
    V.Bindings.loadModelData(fs.readFileSync(SCAN_MODEL), 'poe')
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

  // Real screenshots, read the way the app reads them (the model is loaded
  // in beforeAll). The synthetic essence screenshots this used before drew
  // an older label layout that the tooltip finder no longer looks for.
  // Known misreads (the OCR bench's 2 of 10): a busy background drops a
  // line. Expected failures, so a better model shows up here as a pass to
  // take off this list.
  const MISREADS = new Set(['real-22.png', 'real-26.png'])
  for (const screen of realEssences()) {
    const test = MISREADS.has(screen.file) ? it.fails : it
    test(`essence scan reads ${screen.file}`, () => {
      const img = fullHeight(loadScreen(screen.file, REAL_ESSENCES), screen.screenHeight)
      const opts = { cursor: screen.cursor, stableSig: null, lastReadSig: null }
      const first = V.scanEssenceLabel({ ...img, data: img.data.slice() }, opts)
      expect(first.sig, 'label found near the cursor').toBeTruthy()
      const second = V.scanEssenceLabel(img, { ...opts, stableSig: first.sig })
      const lines = (second.lineImages ?? []).map((l: unknown) => V.ocrLine(l).trim()).filter(Boolean)
      const mono = parseMonolith(lines)
      expect(mono?.essences.map(e => e.name), `read:\n${lines.join('\n')}`).toEqual(screen.essences)
    })

    test(`whole-screen essence read finds the label in ${screen.file}`, () => {
      const { labels } = V.scanAllEssenceLabels(fullHeight(loadScreen(screen.file, REAL_ESSENCES), screen.screenHeight))
      const found = (labels as Array<{ lines: string[] }>)
        .map(l => parseMonolith(l.lines)?.essences.map(e => e.name) ?? [])
        .filter(names => names.length)
      expect(found).toEqual([screen.essences])
    })
  }
})
