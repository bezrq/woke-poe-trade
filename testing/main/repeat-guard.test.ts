// main/src/shortcuts/repeat-guard.ts: a held key doesn't repeat its action.
import { describe, it, expect } from 'vitest'
import { makeRepeatGuard } from '../../main/src/shortcuts/repeat-guard'

describe('makeRepeatGuard', () => {
  it('lets separate presses through', () => {
    let t = 0
    const isRepeat = makeRepeatGuard(() => t)
    expect(isRepeat('F1')).toBe(false)
    t = 200
    expect(isRepeat('F1')).toBe(false)
  })

  it('ignores a running key repeat, however long it lasts', () => {
    let t = 0
    const isRepeat = makeRepeatGuard(() => t)
    expect(isRepeat('F1')).toBe(false)
    for (let i = 0; i < 100; i++) {
      t += 33
      expect(isRepeat('F1')).toBe(true)
    }
    t += 200
    expect(isRepeat('F1')).toBe(false)
  })

  it('keeps each key apart', () => {
    let t = 0
    const isRepeat = makeRepeatGuard(() => t)
    expect(isRepeat('F1')).toBe(false)
    t = 10
    expect(isRepeat('F2')).toBe(false)
  })
})
