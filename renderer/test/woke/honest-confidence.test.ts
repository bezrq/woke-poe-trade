// SOLID has to mean several sellers agree, and Sell fast has to follow the
// market rather than one odd listing.
import { describe, expect, it } from 'vitest'
import { buildInsight, notePrice, noteText } from '@/web/woke/price-insight/insight'
import type { InsightListing } from '@/web/woke/price-insight/insight'

const NOW = Date.parse('2026-11-05T12:00:00Z')
const OPTS = { divine: 180, now: NOW }

function row (id: string, chaos: number, over: Partial<InsightListing> = {}): InsightListing {
  return {
    id,
    priceAmount: chaos,
    priceCurrency: 'chaos',
    indexedAt: new Date(NOW - 30 * 3600e3).toISOString(),
    hasNote: true,
    hasFee: true,
    isMine: false,
    accountName: 's-' + id,
    accountStatus: 'online',
    listedTimes: 1,
    ...over
  }
}
const many = (prefix: string, chaos: number, n: number, over: Partial<InsightListing> = {}) =>
  Array.from({ length: n }, (_, i) => row(`${prefix}${i}`, chaos, over))
const fast = (ls: InsightListing[]) => noteText(notePrice(buildInsight(ls, OPTS).suggest!.fast, 180))

describe('confidence', () => {
  it('is not solid when one seller fills the rows', () => {
    const insight = buildInsight(many('m', 50, 10, { accountName: 'only' }), OPTS)
    expect(insight.confidence).toBe('low')
    expect(insight.signals.find(s => s.kind === 'thin')?.text).toContain('one seller')
  })

  it('is at most OK with two sellers', () => {
    const rows = [...many('a', 50, 5, { accountName: 'one' }), ...many('b', 50, 5, { accountName: 'two' })]
    expect(buildInsight(rows, OPTS).confidence).toBe('medium')
    expect(buildInsight(rows, OPTS).signals).toEqual([])
  })

  it('is solid when many sellers agree', () => {
    expect(buildInsight(many('a', 50, 8), OPTS).confidence).toBe('high')
  })

  it('does not let one seller outvote the market', () => {
    const rows = [...many('f', 40, 6, { accountName: 'flood' }), ...many('r', 100, 6)]
    expect(buildInsight(rows, OPTS).range?.fair).toBe(100)
  })
})

describe('thin market bait', () => {
  it('drops a far lower stash listing with only three listed', () => {
    const insight = buildInsight([row('b', 1, { hasFee: false }), row('x', 100, { hasFee: false }), row('y', 100, { hasFee: false })], OPTS)
    expect(Array.from(insight.dropped.values())).toEqual(['fixer'])
    expect(insight.range?.low).toBe(100)
  })

  it('keeps one merely under the rest', () => {
    const insight = buildInsight([row('b', 40, { hasFee: false }), row('x', 100, { hasFee: false }), row('y', 100, { hasFee: false })], OPTS)
    expect(insight.dropped.size).toBe(0)
  })
})

describe('Sell fast', () => {
  it('follows the market, not one cheap buyout, and points out the bargain', () => {
    const rows = [row('x', 5), ...many('r', 100, 5)]
    expect(fast(rows)).toBe('~b/o 97 chaos')
    const insight = buildInsight(rows, OPTS)
    expect(insight.signals.find(s => s.kind === 'snipe')?.text).toContain('5c')
    expect(insight.range?.low).toBe(5)
  })

  it('does not call an ordinary floor a bargain', () => {
    const rows = many('r', 100, 5)
    expect(buildInsight(rows, OPTS).signals.map(s => s.kind)).not.toContain('snipe')
    expect(fast(rows)).toBe('~b/o 97 chaos')
  })

  it('matches a cheap floor rather than cutting a third off it', () => {
    expect(fast(many('r', 3, 5))).toBe('~b/o 3 chaos')
    expect(fast(many('r', 9, 5))).toBe('~b/o 9 chaos')
    expect(fast(many('r', 25, 5))).toBe('~b/o 24 chaos')
  })
})
