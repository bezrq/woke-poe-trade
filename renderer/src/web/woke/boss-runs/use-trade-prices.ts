// The live trade lookups behind trade-prices.ts: the search, the fetch, and the
// local copy that survives a restart.
import { createGlobalState } from '@vueuse/core'
import { requestResults, requestTradeResultList } from '@/web/price-check/trade/pathofexile-trade'
import type { TradeRequest } from '@/web/price-check/trade/pathofexile-trade'
import { VARIABLE_ITEMS } from './bosses'
import { tradeQuery } from './calc'
import { createTradePrices, quoteFromListings, SHOW_MS } from './trade-prices'
import type { Stored } from './trade-prices'

const STORAGE_KEY = 'woke-boss-trade-prices'
const SAMPLE = 10
// An unidentified price replaces poe.ninja's, so it needs a few real listings.
const MIN_UNIDENTIFIED = 3

async function lookup (league: string, name: string, divine: number) {
  const unidentified = VARIABLE_ITEMS.has(name)
  const body = tradeQuery(name, unidentified) as unknown as TradeRequest
  const search = await requestTradeResultList(body, league)
  if (!search.result.length) return { chaos: null, listings: 0 }
  const listings = await requestResults(search.id, search.result.slice(0, SAMPLE), { accountName: '' })
  return { chaos: quoteFromListings(listings, divine, unidentified ? MIN_UNIDENTIFIED : 1), listings: search.total }
}

function pruned (data: Stored): Stored {
  const out: Stored = {}
  for (const [league, quotes] of Object.entries(data)) {
    const kept = Object.entries(quotes).filter(([, q]) => Date.now() - q.ts <= SHOW_MS)
    if (kept.length) out[league] = Object.fromEntries(kept)
  }
  return out
}

export const useTradePrices = createGlobalState(() => createTradePrices({
  lookup,
  read () {
    try {
      return pruned(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Stored)
    } catch {
      return {}
    }
  },
  write (data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
  }
}))
