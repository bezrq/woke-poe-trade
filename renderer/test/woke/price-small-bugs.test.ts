// Small price check bugs from the veteran critique.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fixture, loadGameData, parseItem } from '../helpers/game-data'

const proxyCalls: string[] = []
vi.mock('@/web/background/IPC', () => ({
  Host: {
    proxy: async (url: string) => {
      proxyCalls.push(url)
      return new Response(JSON.stringify({ id: 'q', result: [], total: 0 }))
    }
  }
}))
vi.mock('@/web/Config', () => ({
  AppConfig: () => ({ apiLatencySeconds: 2, accountName: '' }),
  poeWebApi: () => 'www.pathofexile.com'
}))

/* eslint-disable import/first */
import { createPresets } from '@/web/price-check/filters/create-presets'
import { clearTradeCache, requestTradeResultList } from '@/web/price-check/trade/pathofexile-trade'
import { RATE_LIMIT_RULES } from '@/web/price-check/trade/common'
import { Cache } from '@/web/price-check/trade/Cache'
import { DEFAULT_SEED, pickCandidates } from '@/web/woke/price-insight/drivers'
import type { StatFilter } from '@/web/price-check/filters/interfaces'
/* eslint-enable import/first */

const OPTS = { league: 'Mirage', merchantOnly: true, currency: null, collapseListings: 'api' as const, activateStockFilter: false, searchStatRange: 10, useEn: false }

describe('price check filters', () => {
  beforeAll(loadGameData)

  const statsFor = (file: string) => {
    const { presets, active } = createPresets(parseItem(fixture(file)), OPTS)
    return presets.find(p => p.id === active)!.stats
  }

  it('rank total life as a valuable mod in What drives the price', () => {
    const candidates = pickCandidates(statsFor('items/rare-ring.txt'), DEFAULT_SEED)
    const life = candidates.find(c => c.statRef === '+# total maximum Life')
    expect(life?.score).toBeGreaterThan(10)
  })

  it('leave a perfect armour base unticked on a unique', () => {
    const base = (statsFor('items/unique-kaoms-heart.txt') as StatFilter[]).find(f => f.statRef === 'Base Percentile: #%')
    expect(base?.disabled).toBe(true)
  })
})

describe('the trade cache', () => {
  it('keeps a value set after a clear past the old timer', () => {
    vi.useFakeTimers()
    const cache = new Cache()
    cache.set('k', 1, 10)
    vi.advanceTimersByTime(8000)
    cache.clear()
    cache.set('k', 2, 10)
    vi.advanceTimersByTime(4000)
    expect(cache.get('k')).toBe(2)
    vi.advanceTimersByTime(7000)
    expect(cache.get('k')).toBeUndefined()
    vi.useRealTimers()
  })
})

describe('refreshing a search', () => {
  it('asks the trade site again once the cache is cleared', async () => {
    const body = { query: { status: { option: 'securable' }, stats: [], filters: {} }, sort: { price: 'asc' } } as never
    RATE_LIMIT_RULES.SEARCH.clear()
    await requestTradeResultList(body, 'Mirage')
    await requestTradeResultList(body, 'Mirage')
    expect(proxyCalls).toHaveLength(1)

    clearTradeCache()
    await requestTradeResultList(body, 'Mirage')
    expect(proxyCalls).toHaveLength(2)
  })
})
