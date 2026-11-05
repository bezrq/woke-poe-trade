// poe.ninja can't see rolls, corruption or Foulborn mods, so it mustn't drag a
// price below what such an item is listed for.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fixture, loadGameData, parseItem } from '../helpers/game-data'

vi.mock('@/web/background/IPC', () => ({ Host: { proxy: async () => new Response('{}') } }))
vi.mock('@/web/Config', () => ({
  AppConfig: () => ({ apiLatencySeconds: 2, accountName: '' }),
  poeWebApi: () => 'www.pathofexile.com'
}))

/* eslint-disable import/first */
import { createPresets } from '@/web/price-check/filters/create-presets'
import { buildInsight } from '@/web/woke/price-insight/insight'
import type { InsightListing } from '@/web/woke/price-insight/insight'
import { buildBlend, headlinePrice } from '@/web/woke/price-insight/sources'
import { ninjaFitsSearch } from '@/web/woke/price-insight/search-scope'
import type { ParsedItem } from '@/parser'
/* eslint-enable import/first */

const NOW = Date.parse('2026-11-05T12:00:00Z')
const OPTS = { divine: 180, now: NOW }

function rows (chaos: number, n: number, over: Partial<InsightListing> = {}): InsightListing[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `r${chaos}-${i}`,
    priceAmount: chaos,
    priceCurrency: 'chaos',
    indexedAt: new Date(NOW - 30 * 3600e3).toISOString(),
    hasNote: true,
    hasFee: true,
    isMine: false,
    accountName: `s${i}`,
    accountStatus: 'online' as const,
    listedTimes: 1,
    ...over
  }))
}

function headline (listings: InsightListing[], ninja: { chaos: number, gaps: number, fits?: boolean }) {
  const insight = buildInsight(listings, OPTS)
  return headlinePrice(buildBlend({ insight, ninja, now: NOW }), insight)
}

describe('headline', () => {
  it('never sits below the cheapest trusted listing', () => {
    expect(headline(rows(1000, 4), { chaos: 100, gaps: 0 })).toEqual({ chaos: 1000, from: 'listings' })
    expect(headline(rows(1000, 4, { hasFee: false }), { chaos: 100, gaps: 0 })).toEqual({ chaos: 1000, from: 'listings' })
  })

  it('leaves poe.ninja out of a search it does not cover', () => {
    const insight = buildInsight([...rows(100, 2), ...rows(300, 2)], OPTS)
    const blend = buildBlend({ insight, ninja: { chaos: 150, gaps: 0, fits: false }, now: NOW })
    expect(blend.points.find(p => p.key === 'ninja')?.weight).toBe(0)
    expect(headlinePrice(blend, insight)?.from).toBe('listings')
  })

  it('still uses poe.ninja when it fits', () => {
    const stash = { hasFee: false }
    const insight = buildInsight([...rows(100, 2, stash), ...rows(300, 2, stash)], OPTS)
    const blend = buildBlend({ insight, ninja: { chaos: 150, gaps: 0, fits: true }, now: NOW })
    expect(headlinePrice(blend, insight)?.from).toBe('blend')
  })

  it('falls back to poe.ninja when nothing is listed, even off target', () => {
    expect(headline([], { chaos: 150, gaps: 0, fits: false })).toEqual({ chaos: 150, from: 'blend' })
  })
})

describe('ninjaFitsSearch', () => {
  beforeAll(loadGameData)
  const OPT = { league: 'Mirage', merchantOnly: true, currency: null, collapseListings: 'api' as const, activateStockFilter: false, searchStatRange: 10, useEn: false }
  const stats = (item: ParsedItem) => {
    const { presets, active } = createPresets(item, OPT)
    return presets.find(p => p.id === active)!.stats
  }

  it('is true for rares and gems', () => {
    const ring = parseItem(fixture('items/rare-ring.txt'))
    expect(ninjaFitsSearch(ring, stats(ring))).toBe(true)
    const gem = parseItem(fixture('items/gem-enlighten.txt'))
    expect(ninjaFitsSearch(gem, stats(gem))).toBe(true)
  })

  it('is false for a unique searched on a good roll', () => {
    const kaom = parseItem(fixture('items/unique-kaoms-heart.txt'))
    expect(ninjaFitsSearch(kaom, stats(kaom))).toBe(false)
  })

  it('is true once that roll is unticked', () => {
    const kaom = parseItem(fixture('items/unique-kaoms-heart.txt'))
    const unticked = stats(kaom).map(s => ({ ...s, disabled: true })) as never
    expect(ninjaFitsSearch(kaom, unticked)).toBe(true)
  })

  it('is false for corrupted and Foulborn uniques', () => {
    const kaom = parseItem(fixture('items/unique-kaoms-heart.txt'))
    expect(ninjaFitsSearch({ ...kaom, isCorrupted: true } as ParsedItem, [])).toBe(false)
    expect(ninjaFitsSearch({ ...kaom, isFoulborn: true } as ParsedItem, [])).toBe(false)
  })
})
