// Importing a shared build (main/src/woke/pob-builds.ts).
import { describe, it, expect } from 'vitest'
import zlib from 'zlib'
import { decodePobCode } from '../../main/src/woke/pob-builds'

const encode = (text: string) => zlib.deflateSync(Buffer.from(text)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')

describe('PoB codes', () => {
  it('reads a real code', () => {
    expect(decodePobCode(encode('<PathOfBuilding></PathOfBuilding>'))).toContain('<PathOfBuilding')
  })

  it('says plainly when pasted text is not a code', () => {
    expect(() => decodePobCode('hello there')).toThrow('not a Path of Building build')
    expect(() => decodePobCode(encode('<NotABuild/>'))).toThrow('not a Path of Building build')
  })
})
