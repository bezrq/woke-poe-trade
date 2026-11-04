// Minimal PNG reader for the OCR bench: 8-bit RGB / RGBA / grey, not
// interlaced (what the game, Snipping Tool and the synth script write).
// Returns BGRA, the layout the game screenshots in the app have.
import zlib from 'zlib'
import fs from 'fs'

export interface Bgra { width: number, height: number, data: Uint8Array }

export function readPng (file: string): Bgra {
  const buf = fs.readFileSync(file)
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idat: Buffer[] = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('latin1', pos + 4, pos + 8)
    const body = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      const depth = body[8]
      colorType = body[9]
      if (depth !== 8 || body[12] !== 0) throw new Error(`${file}: only 8-bit non-interlaced PNG`)
    } else if (type === 'IDAT') {
      idat.push(body)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }
  const bpp = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType]
  if (!bpp) throw new Error(`${file}: unsupported PNG colour type ${colorType}`)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const px = new Uint8Array(height * stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const out = y * stride
    const prev = y ? out - stride : -1
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[out + x - bpp] : 0
      const b = prev >= 0 ? px[prev + x] : 0
      const c = prev >= 0 && x >= bpp ? px[prev + x - bpp] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += (pa <= pb && pa <= pc) ? a : pb <= pc ? b : c
      }
      px[out + x] = v & 255
    }
  }
  const data = new Uint8Array(width * height * 4)
  for (let i = 0, j = 0; i < width * height; i++, j += bpp) {
    const grey = bpp <= 2
    const r = px[j]
    const g = grey ? r : px[j + 1]
    const b = grey ? r : px[j + 2]
    data[i * 4] = b
    data[i * 4 + 1] = g
    data[i * 4 + 2] = r
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}

// Writes a 1-byte-per-pixel grey image (line images, for looking at misreads).
export function writeGreyPng (file: string, width: number, height: number, grey: Uint8Array) {
  const raw = Buffer.alloc((width + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0
    raw.set(grey.subarray(y * width, (y + 1) * width), y * (width + 1) + 1)
  }
  const chunk = (type: string, body: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length)
    const tb = Buffer.concat([Buffer.from(type, 'latin1'), body])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tb))
    return Buffer.concat([len, tb, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 0
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]))
}

let crcTable: Uint32Array | null = null
function crc32 (b: Buffer): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
