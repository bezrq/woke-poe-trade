import { describe, it, expect } from 'vitest'
import { sameSlot } from '../../renderer/src/web/woke/map-mods/scan'

// 2560x1440: a normal stash cell is about 70 px, a quad tab cell about 35 px.
const W = 2560
const H = 1440
const at = (x: number, y: number) => ({ x: x / W, y: y / H })

describe('map scan slots', () => {
  it('counts a small cursor jitter as the same slot', () => {
    expect(sameSlot(at(600, 800), at(608, 806), W / H)).toBe(true)
  })

  it('keeps neighbouring quad tab cells apart, in both directions', () => {
    expect(sameSlot(at(600, 800), at(635, 800), W / H)).toBe(false)
    expect(sameSlot(at(600, 800), at(600, 835), W / H)).toBe(false)
  })
})
