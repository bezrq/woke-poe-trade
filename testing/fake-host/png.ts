// PNG decode/encode without native modules (pngjs is pure JS).
import { PNG } from 'pngjs'

export function decodePng (buf: Buffer): { width: number, height: number, data: Uint8Array } {
  const png = PNG.sync.read(buf)
  return { width: png.width, height: png.height, data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength) }
}

export function encodePng (img: { width: number, height: number, data: Uint8Array }): Buffer {
  const png = new PNG({ width: img.width, height: img.height })
  png.data = Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength)
  return PNG.sync.write(png)
}
