// OCR bench: runs the map scan pipeline (the same vision + OCR code the app
// runs, on the same tesseract/opencv wasm) over labelled screenshots and
// reports how often it reads them right.
//
//   npm run ocr-bench -- --ocr <cv-ocr dir> --samples <dir> [--out <dir>] [--model <name>]
//
// A sample is <id>.png (a full game screenshot) + <id>.json:
//   { "kind": "map", "cursor": { "x", "y" },          cursor in image pixels
//     "lines": [...],                                 every tooltip line (optional)
//     "modLines": ["Monsters deal 102% extra ..."],   map mod lines as shown
//     "props": { "tier": 16, "quantity": 87, ... } }
// --out writes each misread line's image and text, to see why.
import fs from 'fs'
import path from 'path'
import * as Bindings from '../src/vision/wasm-bindings'
import { scanTooltip, ocrLine } from '../src/woke/map-scan-vision'
import type { ScanOptions } from '../src/woke/map-scan-vision'
import { TooltipMatcher, similarity } from '../../renderer/src/web/woke/map-mods/tooltip-parse'
import type { ScannedMap } from '../../renderer/src/web/woke/map-mods/tooltip-parse'
import { parseMonolith } from '../../renderer/src/web/woke/essence-scan/essences'
import { readPng, writeGreyPng } from './png'
import type { Bgra } from './png'

interface EssenceLabel {
  kind: 'essence'
  cursor: { x: number, y: number }
  screenHeight?: number
  essences: string[]
  corrupted: boolean
}

interface MapLabel {
  kind: 'map'
  cursor: { x: number, y: number }
  lines?: string[]
  modLines: string[]
  props: ScannedMap['props'] & { tier?: number }
  // Game window height, when the image is a crop of the screen.
  screenHeight?: number
  // Tooltip box in image pixels, for --oracle.
  box?: { x: number, y: number, width: number, height: number }
}

function arg (name: string, def?: string): string {
  const i = process.argv.indexOf(`--${name}`)
  if (i < 0) {
    if (def === undefined) throw new Error(`missing --${name}`)
    return def
  }
  return process.argv[i + 1]
}

// The map mod list the app matches against (data.ts allAreaMods).
function areaMods (statsFile: string): string[] {
  const out = new Set<string>()
  for (const line of fs.readFileSync(statsFile, 'utf8').split('\n')) {
    if (!line.includes('fromAreaMods')) continue
    const d = JSON.parse(line)
    for (const s of (d.stats ?? [d])) {
      if (!s.fromAreaMods || s.fromAreaMods === 'heist_exclusive') continue
      for (const m of s.matchers) out.add(m.string)
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b))
}

// Same crop the app sends the worker (MAP_SCAN.cropHalfWidth).
function cropStrip (img: Bgra, cx: number, refH: number, halfFrac = 0.6) {
  const half = Math.round(refH * halfFrac)
  const x0 = Math.max(0, cx - half)
  const x1 = Math.min(img.width, cx + half)
  const w = x1 - x0
  const data = new Uint8Array(w * img.height * 4)
  for (let y = 0; y < img.height; y++) {
    const from = (y * img.width + x0) * 4
    data.set(img.data.subarray(from, from + w * 4), y * w * 4)
  }
  return { image: { width: w, height: img.height, data }, x0 }
}

function cropBox (img: Bgra, r: { x: number, y: number, width: number, height: number }) {
  const x0 = Math.max(0, r.x - 4)
  const y0 = Math.max(0, r.y - 4)
  const w = Math.min(img.width, r.x + r.width + 4) - x0
  const h = Math.min(img.height, r.y + r.height + 4) - y0
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    const from = ((y0 + y) * img.width + x0) * 4
    data.set(img.data.subarray(from, from + w * 4), y * w * 4)
  }
  return { image: { width: w, height: h, data }, x0, y0 }
}

const PROP_KEYS = ['tier', 'quantity', 'rarity', 'packSize', 'quality'] as const

async function main () {
  const ocrDir = path.resolve(arg('ocr'))
  const samplesDir = path.resolve(arg('samples'))
  const outDir = process.argv.includes('--out') ? path.resolve(arg('out')) : null
  const model = arg('model', 'eng')
  const stats = path.resolve(__dirname, '../../renderer/public/data/en/stats.ndjson')
  const limit = Number(arg('limit', '100000'))

  await Bindings.init(ocrDir, true)
  // changeLanguage only knows en/ru; load any traineddata by file name.
  await loadModel(ocrDir, model)
  const matcher = new TooltipMatcher(areaMods(stats))
  if (outDir) fs.mkdirSync(outDir, { recursive: true })

  const ids = fs.readdirSync(samplesDir).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort().slice(0, limit)
  const tot = { samples: 0, found: 0, perfect: 0, modTP: 0, modFP: 0, modFN: 0, rollOk: 0, rollN: 0, propOk: 0, propN: 0, lineSim: 0, lineN: 0, weak: 0, visionMs: 0, ocrMs: 0, ocrLines: 0 }
  const fails: string[] = []
  const ess = { samples: 0, perfect: 0, tp: 0, fp: 0, fn: 0, corruptOk: 0, ms: 0 }

  for (const id of ids) {
    const anyLabel = JSON.parse(fs.readFileSync(path.join(samplesDir, id + '.json'), 'utf8')) as MapLabel | EssenceLabel
    if (anyLabel.kind === 'essence') {
      benchEssence(id, anyLabel, readPng(path.join(samplesDir, id + '.png')), ess, fails)
      continue
    }
    const label = anyLabel
    tot.samples++
    const img = readPng(path.join(samplesDir, id + '.png'))
    // --oracle: read only the labelled tooltip box, to tell finding the
    // tooltip apart from reading it.
    const oracle = process.argv.includes('--oracle') && label.box
    const { image, x0, y0 } = oracle ? cropBox(img, label.box!) : { ...cropStrip(img, label.cursor.x, label.screenHeight ?? img.height), y0: 0 }
    const opts: ScanOptions = {
      cursor: { x: label.cursor.x - x0, y: label.cursor.y - y0 },
      originX: x0,
      originY: y0,
      refHeight: label.screenHeight ?? img.height,
      whole: Boolean(oracle),
      stableSig: null,
      lastReadSig: null
    }
    let t = performance.now()
    const first = scanTooltip(image, opts)
    const res = first.sig ? scanTooltip(image, { ...opts, stableSig: first.sig }) : first
    tot.visionMs += performance.now() - t
    // A white map without quality has no blue text to find it by, and no
    // mods to read: not finding it is right.
    const expectNone = !label.modLines.length && !label.props.quality && !label.props.quantity
    if (!res.lineImages) {
      if (expectNone) { tot.found++; tot.perfect++; continue }
      fails.push(`${id}: no tooltip found`)
      continue
    }
    tot.found++
    t = performance.now()
    const read = res.lineImages.map(l => ocrLine(l))
    tot.ocrMs += performance.now() - t
    tot.ocrLines += read.length
    const lines = read.filter(l => l.length > 2)

    const truth = matcher.parse(label.modLines) ?? { mods: [], props: {}, weak: [] }
    const got = matcher.parse(lines) ?? { mods: [], props: {}, weak: [], tier: undefined }
    const want = new Map(truth.mods.map(m => [m.matcher, m.roll]))
    const have = new Map(got.mods.map(m => [m.matcher, m.roll]))
    let ok = true
    const notes: string[] = []
    for (const [m, roll] of want) {
      if (!have.has(m)) { tot.modFN++; ok = false; notes.push(`missed: ${m}`); continue }
      tot.modTP++
      if (roll !== undefined) {
        tot.rollN++
        if (have.get(m) === roll) tot.rollOk++
        else { ok = false; notes.push(`roll ${have.get(m)} != ${roll}: ${m}`) }
      }
    }
    for (const m of have.keys()) if (!want.has(m)) { tot.modFP++; ok = false; notes.push(`extra: ${m}`) }
    const gotProps: Record<string, number | undefined> = { ...got.props, tier: got.tier }
    for (const k of PROP_KEYS) {
      const v = label.props[k]
      if (v === undefined) continue
      tot.propN++
      if (gotProps[k] === v) tot.propOk++
      else { ok = false; notes.push(`${k} ${gotProps[k]} != ${v}`) }
    }
    tot.weak += got.weak.length
    if (ok) tot.perfect++
    else fails.push(`${id}: ${notes.join('; ')}`)

    // Character-level: each true line against its closest read line.
    for (const want of label.lines ?? label.modLines) {
      let best = 0
      let bestI = -1
      read.forEach((l, i) => { const s = similarity(l.toLowerCase(), want.toLowerCase()); if (s > best) { best = s; bestI = i } })
      tot.lineSim += best
      tot.lineN++
      if (outDir && best < 1 && bestI >= 0) {
        const li = res.lineImages[bestI]
        const name = `${id}-L${bestI}`
        writeGreyPng(path.join(outDir, name + '.png'), li.width, li.height, li.data)
        fs.appendFileSync(path.join(outDir, 'misreads.tsv'), `${name}\t${want}\t${read[bestI]}\n`)
      }
    }
  }

  const pct = (a: number, b: number) => b ? `${(100 * a / b).toFixed(1)}%` : '-'
  const report = {
    model,
    samples: tot.samples,
    tooltipFound: pct(tot.found, tot.samples),
    perfectTooltips: pct(tot.perfect, tot.samples),
    modRecall: pct(tot.modTP, tot.modTP + tot.modFN),
    modPrecision: pct(tot.modTP, tot.modTP + tot.modFP),
    rollsRight: pct(tot.rollOk, tot.rollN),
    propsRight: pct(tot.propOk, tot.propN),
    charAccuracy: pct(tot.lineSim, tot.lineN),
    weakLinesPerTooltip: (tot.weak / Math.max(1, tot.found)).toFixed(2),
    visionMsPerTooltip: Math.round(tot.visionMs / Math.max(1, tot.samples)),
    ocrMsPerLine: Math.round(tot.ocrMs / Math.max(1, tot.ocrLines))
  }
  if (tot.samples) console.log(JSON.stringify(report, null, 1))
  if (ess.samples) {
    console.log(JSON.stringify({
      model,
      essenceLabels: ess.samples,
      perfectLabels: pct(ess.perfect, ess.samples),
      essenceRecall: pct(ess.tp, ess.tp + ess.fn),
      essencePrecision: pct(ess.tp, ess.tp + ess.fp),
      corruptedRight: pct(ess.corruptOk, ess.samples),
      msPerLabel: Math.round(ess.ms / ess.samples)
    }, null, 1))
  }
  if (process.argv.includes('--fails')) for (const f of fails) console.log(f)
}

// Essence label near the cursor: same crop and code as the app's essence scan.
function benchEssence (id: string, label: EssenceLabel, img: Bgra,
  ess: { samples: number, perfect: number, tp: number, fp: number, fn: number, corruptOk: number, ms: number }, fails: string[]) {
  ess.samples++
  const refH = label.screenHeight ?? img.height
  const { image, x0 } = cropStrip(img, label.cursor.x, refH, 0.3)
  const opts: ScanOptions = { cursor: { x: label.cursor.x - x0, y: label.cursor.y }, originX: x0, originY: 0, refHeight: refH, stableSig: null, lastReadSig: null }
  const t = performance.now()
  const first = scanTooltip(image, opts, 'essence')
  const res = first.sig ? scanTooltip(image, { ...opts, stableSig: first.sig }, 'essence') : first
  const lines = (res.lineImages ?? []).map(l => ocrLine(l)).filter(l => l.length > 2)
  ess.ms += performance.now() - t
  const got = parseMonolith(lines)
  const have = (got?.essences ?? []).map(e => e.name)
  const notes: string[] = []
  for (const e of label.essences) {
    const i = have.indexOf(e)
    if (i >= 0) { ess.tp++; have.splice(i, 1) } else { ess.fn++; notes.push(`missed: ${e}`) }
  }
  for (const e of have) { ess.fp++; notes.push(`extra: ${e}`) }
  if ((got?.corrupted ?? false) === label.corrupted) ess.corruptOk++
  else notes.push(`corrupted ${String(got?.corrupted)} != ${String(label.corrupted)}`)
  if (!notes.length) ess.perfect++
  else fails.push(`${id}: ${notes.join('; ')} [read: ${lines.join(' | ')}]`)
}

async function loadModel (dir: string, name: string) {
  if (name === 'eng') return await Bindings.changeLanguage('en', dir)
  const file = fs.existsSync(name) ? name : path.join(dir, `${name}.traineddata`)
  Bindings.loadModelData(fs.readFileSync(file), path.basename(name, '.traineddata'))
}

main().catch(err => { console.error(err); process.exit(1) })
