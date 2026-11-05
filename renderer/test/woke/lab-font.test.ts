// Divine Font maths with thin-market gems left out.
import { describe, it, expect } from 'vitest'
import { colorRolls, evByState, gemPrices, pickProfit, specificPicks, thinGems, thinInPool, withoutThinGems } from '@/web/woke/lab-gems/font'
import type { PriceItem } from '@/web/woke/market/types'

const FAKE = 'Dominating Blow of Inspiring'
const REAL = 'Summon Stone Golem of Safeguarding'
const BASE = 'Dominating Blow'

function gem (name: string, chaos: number, gaps = 0, variant = '1'): PriceItem {
  return { name, chaos, gaps, variant, type: 'SkillGem' } as unknown as PriceItem
}

const items = [gem(FAKE, 1734, 3), gem(REAL, 394), gem(BASE, 20, 5)]
const prices = gemPrices(items, '1')
const thin = thinGems(items, '1')

describe('withoutThinGems', () => {
  it('drops thin transfigured gems but keeps the rest', () => {
    const out = withoutThinGems(prices, thin)
    expect(out.has(FAKE)).toBe(false)
    expect(out.get(REAL)).toBe(394)
  })

  it('keeps a thin base gem, so its cost still comes off the profit', () => {
    const out = withoutThinGems(prices, thin)
    expect(out.get(BASE)).toBe(20)
    const pick = specificPicks(out).find(p => p.baseName === BASE)!
    expect(pick.baseChaos).toBe(20)
    expect(pickProfit(pick, 'choose')).toBe(-20)
  })

  it('leaves the given prices untouched', () => {
    withoutThinGems(prices, thin)
    expect(prices.has(FAKE)).toBe(true)
  })
})

describe('colour rolls without thin gems', () => {
  const before = colorRolls(prices, 5).find(r => r.color === 'r')!
  const after = colorRolls(withoutThinGems(prices, thin), 5).find(r => r.color === 'r')!

  it('takes the thin gem out of the list and the priced count', () => {
    expect(before.top[0].name).toBe(FAKE)
    expect(after.top.map(g => g.name)).toEqual([REAL])
    expect(after.listed).toBe(before.listed - 1)
  })

  it('keeps the pool size, because the font can still offer the gem', () => {
    expect(after.poolSize).toBe(before.poolSize)
    expect(after.chanceEach).toBe(before.chanceEach)
  })

  it('lowers the EV to what the trusted gems give', () => {
    const n = before.poolSize
    const pBest = 1 - Math.pow((n - 1) / n, 3)
    expect(after.ev).toBeCloseTo(394 * pBest)
    expect(after.ev).toBeLessThan(before.ev)
  })

  it('counts the gems left out per colour', () => {
    expect(thinInPool(prices, thin, 'r')).toBe(1)
    expect(thinInPool(prices, thin, 'g')).toBe(0)
    expect(thinInPool(prices, new Set(), 'r')).toBe(0)
  })
})

describe('evByState', () => {
  it('skips thin gems only when asked', () => {
    const ev = (skip: boolean) => evByState(items, skip).find(row => row.state === '1')!.ev.r
    expect(ev(false)).toBeGreaterThan(ev(true))
    expect(evByState(items)).toEqual(evByState(items, false))
  })

  it('judges thinness per level and quality', () => {
    const mixed = [gem(FAKE, 1000, 3, '1'), gem(FAKE, 1000, 0, '20')]
    const rows = evByState(mixed, true)
    expect(rows.find(row => row.state === '1')!.ev.r).toBe(0)
    expect(rows.find(row => row.state === '20')!.ev.r).toBeGreaterThan(0)
  })
})
