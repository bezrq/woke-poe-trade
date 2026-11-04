// Cuts training lines for the OCR model out of synthetic tooltips (synth.py):
// the line images are made by the app's own map scan code, so the model is
// trained on exactly what it will be shown, and each is paired with the text
// synth.py drew there.
//
//   npm run ocr-train-lines -- --samples <synth dir> --out <dir>
// writes <out>/<id>-<n>.png + <id>-<n>.gt.txt (tesstrain's layout).
import fs from 'fs'
import path from 'path'
import * as Bindings from '../src/vision/wasm-bindings'
import { scanTooltip } from '../src/woke/map-scan-vision'
import { readPng, writeGreyPng } from './png'

function arg (name: string): string {
  const i = process.argv.indexOf(`--${name}`)
  if (i < 0) throw new Error(`missing --${name}`)
  return process.argv[i + 1]
}

interface LineBox { text: string, x: number, y: number, width: number, height: number }

async function main () {
  const ocrDir = path.resolve(arg('ocr'))
  const samples = path.resolve(arg('samples'))
  const out = path.resolve(arg('out'))
  fs.mkdirSync(out, { recursive: true })
  await Bindings.init(ocrDir, true)
  let written = 0
  let skipped = 0
  for (const f of fs.readdirSync(samples).filter(f => f.endsWith('.json')).sort()) {
    const id = f.slice(0, -5)
    const label = JSON.parse(fs.readFileSync(path.join(samples, f), 'utf8')) as { cursor: { x: number, y: number }, lineBoxes: LineBox[] }
    const img = readPng(path.join(samples, id + '.png'))
    const opts = { cursor: label.cursor, refHeight: img.height, stableSig: null, lastReadSig: null }
    const first = scanTooltip(img, opts)
    if (!first.sig) continue
    const res = scanTooltip(img, { ...opts, stableSig: first.sig })
    res.lineImages?.forEach((li, n) => {
      const r = res.lineRects![n]
      const cy = r.y + r.height / 2
      // The drawn line this image was cut from: its centre falls inside it,
      // and they overlap sideways (so it's not stray background).
      const box = label.lineBoxes.find(b => cy >= b.y && cy < b.y + b.height &&
        Math.min(r.x + r.width, b.x + b.width) - Math.max(r.x, b.x) > b.width * 0.8)
      if (!box || Math.abs(r.width - box.width) > r.height * 1.5) { skipped++; return }
      writeGreyPng(path.join(out, `${id}-${n}.png`), li.width, li.height, li.data)
      fs.writeFileSync(path.join(out, `${id}-${n}.gt.txt`), box.text + '\n')
      written++
    })
  }
  console.log(`wrote ${written} lines, skipped ${skipped}`)
}

main().catch(err => { console.error(err); process.exit(1) })
