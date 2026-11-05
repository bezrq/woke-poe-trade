// A 429 restricts for longer than the rate limit window: the client must wait
// out the penalty, not just the window, or Retry earns a second violation.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let nextResponse: () => Response
const proxyCalls: string[] = []
vi.mock('@/web/background/IPC', () => ({
  Host: { proxy: async (url: string) => { proxyCalls.push(url); return nextResponse() } }
}))
vi.mock('@/web/Config', () => ({
  AppConfig: () => ({ apiLatencySeconds: 2, accountName: '' }),
  poeWebApi: () => 'www.pathofexile.com'
}))

/* eslint-disable import/first */
import { RATE_LIMIT_RULES, adjustRateLimits, preventQueueCreation, restrictedMs } from '@/web/price-check/trade/common'
import { requestResults, requestTradeResultList } from '@/web/price-check/trade/pathofexile-trade'
import { searchBudget } from '@/web/woke/price-insight/drivers'
/* eslint-enable import/first */

const RESTRICTED = {
  'x-rate-limit-rules': 'Ip',
  'x-rate-limit-ip': '5:10:60,15:60:300,30:300:1800',
  'x-rate-limit-ip-state': '6:10:60,6:60:0,6:300:0',
  'retry-after': '60',
  'content-type': 'application/json'
}
const body = (n: number) => ({ query: { status: { option: 'securable' }, stats: [], filters: {} }, sort: { price: 'asc' }, n }) as never

function tooMany (headers: Record<string, string> = RESTRICTED) {
  return new Response(JSON.stringify({ error: { code: 3, message: 'Rate limit exceeded; You are restricted for 60 seconds.' } }), { status: 429, headers })
}

// The penalty is kept per policy for the life of the set, so each test gets
// time moved well past the last one's penalty.
let clock = Date.parse('2026-11-05T12:00:00Z')

describe('rate limit penalties', () => {
  beforeEach(() => {
    clock += 60 * 60 * 1000
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(clock)
    proxyCalls.length = 0
    RATE_LIMIT_RULES.SEARCH.clear()
    RATE_LIMIT_RULES.FETCH.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the penalty from the rule state, with no Retry-After', () => {
    const { 'retry-after': _, ...headers } = RESTRICTED
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, new Headers(headers))
    expect(restrictedMs(RATE_LIMIT_RULES.SEARCH)).toBe(60_000)
  })

  it('reads Retry-After when the rule state has no penalty', () => {
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, new Headers({ 'retry-after': '90' }))
    expect(restrictedMs(RATE_LIMIT_RULES.SEARCH)).toBe(90_000)
  })

  it('ignores a normal response', () => {
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, new Headers({
      'x-rate-limit-rules': 'Ip',
      'x-rate-limit-ip': '5:10:60',
      'x-rate-limit-ip-state': '1:10:0'
    }))
    expect(restrictedMs(RATE_LIMIT_RULES.SEARCH)).toBe(0)
  })

  it('never shortens a penalty already running', () => {
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, new Headers({ 'retry-after': '90' }))
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, new Headers({ 'retry-after': '5' }))
    expect(restrictedMs(RATE_LIMIT_RULES.SEARCH)).toBe(90_000)
  })

  it('turns a 429 into the wait, in the form Measure knows how to wait out', async () => {
    nextResponse = () => tooMany()
    await expect(requestTradeResultList(body(1), 'Mirage')).rejects.toThrow('Retry after 60 seconds')
  })

  it('assumes a minute when a 429 says nothing', async () => {
    nextResponse = () => tooMany({ 'content-type': 'application/json' })
    await expect(requestTradeResultList(body(2), 'Mirage')).rejects.toThrow('Retry after 60 seconds')
  })

  it('sends nothing until the penalty ends, then lets the search through', async () => {
    nextResponse = () => tooMany()
    await expect(requestTradeResultList(body(3), 'Mirage')).rejects.toThrow()
    expect(proxyCalls).toHaveLength(1)

    clock += 12_000 // what the limiter window alone would have waited
    vi.setSystemTime(clock)
    await expect(requestTradeResultList(body(3), 'Mirage')).rejects.toThrow('Retry after 48 seconds')
    expect(proxyCalls).toHaveLength(1)

    clock += 48_000
    vi.setSystemTime(clock)
    expect(restrictedMs(RATE_LIMIT_RULES.SEARCH)).toBe(0)
    RATE_LIMIT_RULES.SEARCH.clear()
    expect(() => preventQueueCreation([{ count: 1, limiters: RATE_LIMIT_RULES.SEARCH }])).not.toThrow()
  })

  it('holds listing fetches during a fetch penalty', async () => {
    adjustRateLimits(RATE_LIMIT_RULES.FETCH, new Headers({ 'retry-after': '30' }))
    await expect(requestResults('q', ['a'], { accountName: '' })).rejects.toThrow('Retry after 30 seconds')
    expect(proxyCalls).toHaveLength(0)
  })

  it('shows no free searches during a penalty', () => {
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, new Headers({ 'retry-after': '30' }))
    expect(searchBudget(1)).toMatchObject({ left: 0, waitMs: 30_000 })
  })
})
