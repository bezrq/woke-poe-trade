// Downloads the OCR files the app's vision worker loads (opencv.js,
// tesseract wasm, eng.traineddata) from Awakened PoE Trade's releases into
// testing/.cache/cv-ocr. The fake app copies them into its user data folder,
// the same place the real app reads them from (apt-data/cv-ocr).
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const URL = 'https://github.com/SnosMe/awakened-poe-trade/releases/download/v3.20.10007/cv-ocr.zip'
const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, '../.cache/cv-ocr')
const NEEDED = ['opencv.js', 'tesseract-core-simd.js', 'eng.traineddata']

fs.mkdirSync(out, { recursive: true })
// testing/ is an ES module package; these UMD files must load as CommonJS,
// as they do in the app's own data folder.
fs.writeFileSync(path.join(out, 'package.json'), '{ "type": "commonjs" }\n')

if (NEEDED.every(f => fs.existsSync(path.join(out, f)))) {
  console.log('OCR files already in', path.relative(process.cwd(), out))
  process.exit(0)
}

console.log('Downloading', URL)
const res = await fetch(URL)
if (!res.ok) throw new Error(`Download failed: ${res.status}`)
const zip = Buffer.from(await res.arrayBuffer())

// Minimal zip reader: central directory, stored or deflated entries.
const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
const count = zip.readUInt16LE(eocd + 10)
let p = zip.readUInt32LE(eocd + 16)
for (let i = 0; i < count; i++) {
  const method = zip.readUInt16LE(p + 10)
  const csize = zip.readUInt32LE(p + 20)
  const nameLen = zip.readUInt16LE(p + 28)
  const extraLen = zip.readUInt16LE(p + 30)
  const commentLen = zip.readUInt16LE(p + 32)
  const local = zip.readUInt32LE(p + 42)
  const name = zip.toString('utf8', p + 46, p + 46 + nameLen)
  p += 46 + nameLen + extraLen + commentLen
  if (name.endsWith('/')) continue
  const lNameLen = zip.readUInt16LE(local + 26)
  const lExtraLen = zip.readUInt16LE(local + 28)
  const start = local + 30 + lNameLen + lExtraLen
  const raw = zip.subarray(start, start + csize)
  const data = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null
  if (!data) throw new Error(`Unsupported zip method ${method} for ${name}`)
  fs.writeFileSync(path.join(out, path.basename(name)), data)
}
console.log('OCR files in', path.relative(process.cwd(), out), fs.readdirSync(out).join(', '))
