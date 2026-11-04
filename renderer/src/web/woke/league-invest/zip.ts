// Minimal zip reader for poe.ninja dump zips (stored or deflated entries),
// using the browser's DecompressionStream. No zip64 support (not needed).

export interface ZipEntry {
  name: string
  text: () => Promise<string>
}

export function readZip (buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer)
  // End of central directory: signature 0x06054b50, within the last 64 KiB.
  let eocd = -1
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd === -1) throw new Error('Not a zip file')
  const count = view.getUint16(eocd + 10, true)
  let pos = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder()
  const entries: ZipEntry[] = []

  for (let n = 0; n < count; n++) {
    if (view.getUint32(pos, true) !== 0x02014b50) throw new Error('Corrupt zip directory')
    const method = view.getUint16(pos + 10, true)
    const compSize = view.getUint32(pos + 20, true)
    const nameLen = view.getUint16(pos + 28, true)
    const extraLen = view.getUint16(pos + 30, true)
    const commentLen = view.getUint16(pos + 32, true)
    const localOffset = view.getUint32(pos + 42, true)
    const name = decoder.decode(new Uint8Array(buffer, pos + 46, nameLen))
    pos += 46 + nameLen + extraLen + commentLen

    const localNameLen = view.getUint16(localOffset + 26, true)
    const localExtraLen = view.getUint16(localOffset + 28, true)
    const dataStart = localOffset + 30 + localNameLen + localExtraLen
    const data = new Uint8Array(buffer, dataStart, compSize)

    entries.push({
      name,
      text: async () => {
        if (method === 0) return decoder.decode(data)
        if (method !== 8) throw new Error(`${name}: unsupported zip compression`)
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
        return await new Response(stream).text()
      }
    })
  }
  return entries
}
