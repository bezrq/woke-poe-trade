// poe.ninja holds one league's prices. Searching another league must not use
// them, and listings that can't be converted must be called out.
import { describe, expect, it, vi } from 'vitest'
import { ref, shallowRef } from 'vue'

const selectedId = shallowRef<string | undefined>('Mirage')
const xchgRate = shallowRef<number | undefined>(180)
vi.mock('@/web/background/Leagues', () => ({ useLeagues: () => ({ selectedId }) }))
vi.mock('@/web/background/Prices', () => ({
  usePoeninja: () => ({
    xchgRate,
    findPriceByQuery: ({ name }: { name: string }) => name === 'Exalted Orb' ? { chaos: 10 } : null
  })
}))
vi.mock('@/web/Config', () => ({
  AppConfig: () => ({ apiLatencySeconds: 2, accountName: '' }),
  poeWebApi: () => 'www.pathofexile.com'
}))

/* eslint-disable import/first */
import { useInsight } from '@/web/woke/price-insight/useInsight'
import { buildInsight } from '@/web/woke/price-insight/insight'
import type { InsightListing } from '@/web/woke/price-insight/insight'
import { isOwnAccount } from '@/web/price-check/trade/common'
/* eslint-enable import/first */

const NOW = Date.parse('2026-11-05T12:00:00Z')

function row (id: string, amount: number, currency = 'chaos', over: Partial<InsightListing> = {}): InsightListing {
  return {
    id,
    priceAmount: amount,
    priceCurrency: currency,
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

describe('searching a league', () => {
  it('uses the rates when it is the league poe.ninja holds', () => {
    const { divine, options } = useInsight(ref([]), ref('Mirage'))
    expect(divine.value).toBe(180)
    expect(options.value.otherRates).toEqual({ exalted: 10 })
  })

  it('uses no rates for any other league', () => {
    const { divine, options, insight } = useInsight(ref([row('a', 2, 'divine')]), ref('Standard'))
    expect(divine.value).toBeUndefined()
    expect(options.value.otherRates).toEqual({})
    expect(insight.value.range).toBeNull()
    expect(insight.value.signals.map(s => s.kind)).toContain('norate')
  })
})

describe('listings with no divine rate', () => {
  const opts = { divine: undefined, now: NOW }

  it('say how many were left out, and lower confidence', () => {
    const rows = [...['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(id => row(id, 40)), row('x', 1, 'divine'), row('y', 2, 'divine')]
    const insight = buildInsight(rows, opts)
    expect(insight.confidence).toBe('low')
    expect(insight.signals.find(s => s.kind === 'norate')?.text).toContain('2 listings')
  })

  it('stay quiet when there is a rate or nothing in divines', () => {
    expect(buildInsight([row('a', 1, 'divine')], { divine: 180, now: NOW }).signals.map(s => s.kind)).not.toContain('norate')
    expect(buildInsight([row('a', 40)], opts).signals.map(s => s.kind)).not.toContain('norate')
  })

  it('do not count your own listing', () => {
    expect(buildInsight([row('a', 1, 'divine', { isMine: true })], opts).signals.map(s => s.kind)).not.toContain('norate')
  })
})

describe('isOwnAccount', () => {
  it('matches with or without the number', () => {
    expect(isOwnAccount('Guy#1234', 'Guy#1234')).toBe(true)
    expect(isOwnAccount('Guy#1234', ' Guy ')).toBe(true)
  })

  it('does not match others or a blank setting', () => {
    expect(isOwnAccount('Guy#1234', 'Guy#9999')).toBe(false)
    expect(isOwnAccount('Guyver#1234', 'Guy')).toBe(false)
    expect(isOwnAccount('Guy#1234', '')).toBe(false)
  })
})
