import { describe, expect, it } from 'vitest'
import { baseTipRef } from '@/web/woke/loot-filter/base-tip'

const prices = [{ name: 'Debeon', chaos: 1, thin: false }, { name: 'Kingmaker', chaos: 91, thin: true }, { name: 'Unpriced', chaos: null, thin: false }]

describe('the tooltip for a base in the filter editor', () => {
  it('lists the uniques on a base, best first, graded against the safety net', () => {
    const ref = baseTipRef(() => prices, 50, 'uniques', 'Despot Axe')
    expect(ref.name).toBe('Despot Axe')
    expect(ref.uniques?.().map(u => [u.name, u.grade, u.label])).toEqual([
      ['Kingmaker', 'high', 'worth it'],
      ['Debeon', 'trash', 'trash'],
      ['Unpriced', 'unknown', '']
    ])
  })

  it('leaves other groups as the plain item', () => {
    expect(baseTipRef(() => prices, 50, 'currency', 'Chaos Orb')).toEqual({ name: 'Chaos Orb' })
    expect(baseTipRef(() => prices, 50, 'not a group', 'Chaos Orb')).toEqual({ name: 'Chaos Orb' })
  })

  it('reads prices only when asked, on hover', () => {
    let reads = 0
    const ref = baseTipRef(() => { reads++; return prices }, 50, 'uniques', 'Despot Axe')
    expect(reads).toBe(0)
    ref.uniques?.()
    expect(reads).toBe(1)
  })
})
