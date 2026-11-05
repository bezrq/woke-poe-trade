import { describe, expect, it } from 'vitest'
import { buildInsight } from '@/web/woke/price-insight/insight'
import type { InsightListing } from '@/web/woke/price-insight/insight'
import { buildBlend, headlinePrice } from '@/web/woke/price-insight/sources'

const NOW = Date.parse('2026-11-05T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const OPTS = { divine: 180, now: NOW }

function listings (chaos: number, daysAgo: number[], over: Partial<InsightListing> = {}): InsightListing[] {
  return daysAgo.map((d, i) => ({
    id: `l${chaos}-${i}`,
    priceAmount: chaos,
    priceCurrency: 'chaos',
    indexedAt: new Date(NOW - d * DAY).toISOString(),
    hasNote: true,
    hasFee: true,
    isMine: false,
    accountName: `seller${chaos}-${i}`,
    accountStatus: 'online',
    listedTimes: 1,
    ...over
  }))
}

const OLD = Array.from({ length: 20 }, (_, i) => 19 + i * 4)
const STASH = { hasFee: false }

describe('a seller\'s pile of copies', () => {
  const others = listings(100, [1, 2, 3, 4, 5, 6])

  it('is a wall on one row', () => {
    const rows = [...listings(10, [1], { ...STASH, accountName: 'wall', listedTimes: 6 }), ...others]
    expect(Array.from(buildInsight(rows, OPTS).dropped.values())).toContain('wall')
  })

  it('is still a wall when different stats keep the copies on separate rows', () => {
    const rows = [...listings(10, [1, 1, 1, 1, 1, 1], { ...STASH, accountName: 'wall' }), ...others]
    const dropped = Array.from(buildInsight(rows, OPTS).dropped.values())
    expect(dropped.filter(reason => reason === 'wall')).toHaveLength(6)
  })

  it('needs one price: two prices from one seller aren\'t a pile', () => {
    const rows = [
      ...listings(10, [1, 1], { ...STASH, accountName: 'seller' }),
      ...listings(11, [1], { ...STASH, accountName: 'seller' }),
      ...others
    ]
    expect(Array.from(buildInsight(rows, OPTS).dropped.values())).not.toContain('wall')
  })
})

describe('listings nobody has bought', () => {
  it('rates old stash listings as thin, and says why', () => {
    const insight = buildInsight(listings(20, OLD, STASH), OPTS)
    expect(insight.confidence).toBe('low')
    expect(insight.signals.map(s => s.kind)).toContain('old')
  })

  it('still trusts them when a recent listing is among the cheapest', () => {
    const insight = buildInsight(listings(20, [1, ...OLD], STASH), OPTS)
    expect(insight.confidence).toBe('high')
    expect(insight.signals.map(s => s.kind)).not.toContain('old')
  })

  it('lets poe.ninja move the headline over old stash listings', () => {
    const insight = buildInsight(listings(20, OLD, STASH), OPTS)
    const blend = buildBlend({ insight, ninja: { chaos: 146, gaps: 0 }, now: NOW })
    const headline = headlinePrice(blend, insight)!
    expect(headline.from).toBe('blend')
    expect(headline.chaos).toBeGreaterThan(20)
    expect(headline.chaos).toBeLessThan(146)
  })

  it('does not call a listing with no time old', () => {
    const rows = listings(20, OLD, { ...STASH, indexedAt: undefined })
    expect(buildInsight(rows, OPTS).signals.map(s => s.kind)).not.toContain('old')
  })
})

describe('instant buyouts', () => {
  it('stay solid when old, and say nobody has bought them', () => {
    const insight = buildInsight(listings(20, OLD), OPTS)
    expect(insight.confidence).toBe('high')
    expect(insight.signals.find(s => s.kind === 'old')?.text).toContain('bought instantly')
  })

  it('hold the headline at their price, however high poe.ninja is', () => {
    const insight = buildInsight(listings(20, OLD), OPTS)
    const blend = buildBlend({ insight, ninja: { chaos: 146, gaps: 0 }, now: NOW })
    expect(headlinePrice(blend, insight)).toEqual({ chaos: 20, from: 'listings' })
  })

  it('cap a blend of few listings too', () => {
    const insight = buildInsight(listings(20, [1, 2]), OPTS)
    const blend = buildBlend({ insight, ninja: { chaos: 146, gaps: 0 }, now: NOW })
    expect(headlinePrice(blend, insight)?.chaos).toBe(20)
  })

  it('are never bait, even far under the rest', () => {
    const rows = [...listings(5, [1]), ...listings(100, [1, 2, 3, 4, 5])]
    const insight = buildInsight(rows, OPTS)
    expect(insight.dropped.size).toBe(0)
    expect(insight.range?.low).toBe(5)
    expect(insight.risk).toBe('none')
  })

  it('still count as bait when they are stash listings', () => {
    const rows = [...listings(5, [1], STASH), ...listings(100, [1, 2, 3, 4, 5], STASH)]
    expect(Array.from(buildInsight(rows, OPTS).dropped.values())).toContain('fixer')
  })

  it('are never a wall or a dump', () => {
    const wall = [...listings(10, [1], { accountName: 'wall', listedTimes: 6 }), ...listings(100, [1, 2, 3, 4])]
    expect(buildInsight(wall, OPTS).dropped.size).toBe(0)
    const dump = [...listings(10, [0.01, 0.02]), ...listings(100, [1, 2, 3, 4])]
    expect(buildInsight(dump, OPTS).dropped.size).toBe(0)
  })
})
