import { describe, expect, it } from 'vitest'
import { railMarks } from '@/web/woke/price-insight/rail'

describe('railMarks', () => {
  it('names listings, the headline and poe.ninja, in price order', () => {
    const marks = railMarks({ low: 20, likely: 85, high: 25, ninja: 146 })
    expect(marks.map(m => [m.label, m.kind, m.align])).toEqual([
      ['Cheapest', 'plain', 'start'],
      ['Likely', 'likely', 'center'],
      ['poe.ninja', 'ninja', 'end']
    ])
    expect(marks[1].x).toBeCloseTo(72.8, 0)
  })

  it('uses the top of the range when poe.ninja has no price', () => {
    expect(railMarks({ low: 38, likely: 42, high: 55 }).map(m => m.label)).toEqual(['Cheapest', 'Likely', 'Top of range'])
  })

  it('keeps ends on the ends when poe.ninja is the cheapest', () => {
    const marks = railMarks({ low: 100, likely: 90, high: 120, ninja: 40 })
    expect(marks[0].kind).toBe('ninja')
    expect(marks[0].x).toBe(0)
    expect(marks[marks.length - 1].x).toBe(100)
  })

  it('merges prices that would overlap, keeping the headline mark', () => {
    const marks = railMarks({ low: 20, likely: 20, high: 25 })
    expect(marks).toHaveLength(2)
    expect(marks[0].kind).toBe('likely')
    expect(marks[0].label).toBe('Cheapest, likely')
  })

  it('has nothing to draw when every price is the same', () => {
    expect(railMarks({ low: 20, likely: 20, high: 20 })).toEqual([])
  })

  it('keeps a middle label clear of the end labels', () => {
    const marks = railMarks({ low: 10, likely: 10.5, high: 500 })
    expect(marks[1].x).toBeGreaterThanOrEqual(22)
  })

  it('says when poe.ninja is not counted', () => {
    const marks = railMarks({ low: 20, likely: 21, high: 25, ninja: 900, ninjaSuspect: true })
    expect(marks[2].label).toBe('poe.ninja, not counted')
  })
})
