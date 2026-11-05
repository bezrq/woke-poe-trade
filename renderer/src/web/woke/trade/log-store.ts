// The sales log, shared by the trade assistant (writes) and Session analytics
// (reads). Files live in the main process (main/src/woke/trade-log.ts).
import { shallowRef } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { hostRequest } from '../shared/host'
import type { Offer, TradeRecord } from './book'

export const useTradeLog = createGlobalState(() => {
  const trades = shallowRef<TradeRecord[]>([])
  const loaded = shallowRef(false)
  const error = shallowRef('')
  let loading: Promise<void> | null = null

  function load (force = false): Promise<void> {
    if (loading && !force) return loading
    loading = hostRequest<TradeRecord[]>('trades-list', {})
      .then(list => {
        trades.value = list.sort((a, b) => b.at - a.at)
        loaded.value = true
        error.value = ''
      })
      .catch((err: Error) => {
        error.value = err.message
        loading = null
      })
    return loading
  }

  async function add (t: TradeRecord): Promise<void> {
    const plain = JSON.parse(JSON.stringify(t)) as TradeRecord
    trades.value = [plain, ...trades.value.filter(x => x.id !== plain.id)].sort((a, b) => b.at - a.at)
    await hostRequest('trades-add', { trade: plain })
  }

  async function remove (t: TradeRecord): Promise<void> {
    trades.value = trades.value.filter(x => x.id !== t.id)
    await hostRequest('trades-delete', { id: t.id, league: t.league })
  }

  return { trades, loaded, error, load, add, remove }
})

// Offers closed without a trade (dismissed, sold elsewhere, ran out), kept for
// good so a wrong click is never final. Newest first.
export const useOfferHistory = createGlobalState(() => {
  const offers = shallowRef<Offer[]>([])
  const byClosed = (a: Offer, b: Offer) => (b.closedAt ?? 0) - (a.closedAt ?? 0)

  async function load (): Promise<void> {
    const list = await hostRequest<Offer[]>('offer-history-list', {})
    // Anything added while this was on its way wins.
    const mine = new Set(offers.value.map(o => o.id))
    offers.value = [...offers.value, ...list.filter(o => !mine.has(o.id))].sort(byClosed)
  }

  function has (id: string): boolean {
    return offers.value.some(o => o.id === id)
  }

  async function add (o: Offer): Promise<void> {
    const plain = JSON.parse(JSON.stringify(o)) as Offer
    offers.value = [plain, ...offers.value.filter(x => x.id !== plain.id)].sort(byClosed)
    await hostRequest('offer-history-add', { offer: plain })
  }

  async function remove (id: string): Promise<void> {
    offers.value = offers.value.filter(x => x.id !== id)
    await hostRequest('offer-history-delete', { id })
  }

  return { offers, load, has, add, remove }
})

const DAY_MS = 24 * 3_600_000

export interface TradeTotals {
  // Chaos in from sales, out on purchases.
  sold: number
  spent: number
  sales: number
  buys: number
  // Trades without a price on poe.ninja (left out of the sums).
  unpriced: number
}

export function tradeTotals (list: TradeRecord[]): TradeTotals {
  const t: TradeTotals = { sold: 0, spent: 0, sales: 0, buys: 0, unpriced: 0 }
  for (const r of list) {
    if (r.chaos == null) t.unpriced++
    if (r.dir === 'sell') { t.sales++; t.sold += r.chaos ?? 0 } else { t.buys++; t.spent += r.chaos ?? 0 }
  }
  return t
}

export function tradesInRange (list: TradeRecord[], range: '7d' | 'league' | 'all' | 'today', league: string, now: number): TradeRecord[] {
  if (range === 'all') return list
  if (range === 'league') return list.filter(t => t.league === league)
  if (range === '7d') return list.filter(t => now - t.at < 7 * DAY_MS)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return list.filter(t => t.at >= start.getTime())
}
