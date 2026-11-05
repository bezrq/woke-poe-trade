import { describe, expect, it } from 'vitest'
import { buildInsight } from '@/web/woke/price-insight/insight'
import type { InsightListing } from '@/web/woke/price-insight/insight'
import { buildBlend, headlinePrice } from '@/web/woke/price-insight/sources'

const NOW = Date.parse('2026-11-05T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

function listings (chaos: number, daysAgo: number[]): InsightListing[] {
  return daysAgo.map((d, i) => ({
    id: `l${i}`,
    priceAmount: chaos,
    priceCurrency: 'chaos',
    indexedAt: new Date(NOW - d * DAY).toISOString(),
    hasNote: true,
    hasFee: true,
    isMine: false,
    accountName: `seller${i}`,
    accountStatus: 'online',
    listedTimes: 1
  }))
}

const OLD = Array.from({ length: 20 }, (_, i) => 19 + i * 4)

describe('listings nobody has bought', () => {
  it('rates matching listings that are all old as thin, and says why', () => {
    const insight = buildInsight(listings(20, OLD), { divine: 180, now: NOW })
    expect(insight.confidence).toBe('low')
    expect(insight.signals.map(s => s.kind)).toContain('old')
  })

  it('still trusts them when a recent listing is among the cheapest', () => {
    const insight = buildInsight(listings(20, [1, ...OLD]), { divine: 180, now: NOW })
    expect(insight.confidence).toBe('high')
    expect(insight.signals.map(s => s.kind)).not.toContain('old')
  })

  it('lets poe.ninja move the headline, which solid listings would not', () => {
    const insight = buildInsight(listings(20, OLD), { divine: 180, now: NOW })
    const blend = buildBlend({ insight, ninja: { chaos: 146, gaps: 0 }, now: NOW })
    const headline = headlinePrice(blend, insight)!
    expect(headline.from).toBe('blend')
    expect(headline.chaos).toBeGreaterThan(20)
    expect(headline.chaos).toBeLessThan(146)
  })

  it('does not call a listing with no time old', () => {
    const rows = listings(20, OLD).map(l => ({ ...l, indexedAt: undefined }))
    const insight = buildInsight(rows, { divine: 180, now: NOW })
    expect(insight.signals.map(s => s.kind)).not.toContain('old')
  })
})
