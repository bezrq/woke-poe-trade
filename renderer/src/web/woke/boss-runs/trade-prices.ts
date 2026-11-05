// Prices from official trade for boss drops poe.ninja can't price: jewels whose
// value is unknown until identified, and drops with no poe.ninja row at all.
//
// Every lookup spends the same rate limit as price checks, so they run one at a
// time, well spaced, only while the Boss runs panel is on screen, and the
// results are kept for a while.
import { shallowRef } from 'vue'
import type { TradeQuote } from './calc'

// Refetched when older than this; still shown (over poe.ninja) until a day old.
const FRESH_MS = 60 * 60 * 1000
export const SHOW_MS = 24 * 60 * 60 * 1000
const RETRY_MS = 5 * 60 * 1000
// At most 6 searches a minute, against the site's limit of 15.
const GAP_MS = 10_000

export interface StoredQuote {
  // null = looked and found no listings.
  chaos: number | null
  listings: number
  ts: number
}
export type Stored = Record<string, Record<string, StoredQuote>>

export function quoteFromListings (
  listings: Array<{ priceAmount: number, priceCurrency: string }>,
  divine: number
): number | null {
  const chaos = listings
    .map(l => l.priceCurrency === 'chaos' ? l.priceAmount : l.priceCurrency === 'divine' ? l.priceAmount * divine : null)
    .filter((n): n is number => n != null && n > 0)
    .sort((a, b) => a - b)
  if (!chaos.length) return null
  // The middle of the cheapest few, so a bait listing doesn't set the price.
  const mid = Math.floor(chaos.length / 2)
  return chaos.length % 2 ? chaos[mid] : (chaos[mid - 1] + chaos[mid]) / 2
}

export interface TradePriceDeps {
  lookup: (league: string, name: string, divine: number) => Promise<{ chaos: number | null, listings: number }>
  read: () => Stored
  write: (data: Stored) => void
  now?: () => number
}

export function createTradePrices (deps: TradePriceDeps) {
  const now = deps.now ?? Date.now
  const stored = shallowRef<Stored>(deps.read())
  const inFlight = shallowRef<ReadonlySet<string>>(new Set())
  const failedAt = new Map<string, number>()
  let queue: string[] = []
  let league = ''
  let divine = 0
  let busy = false
  let timer: ReturnType<typeof setTimeout> | null = null

  function setPending () {
    inFlight.value = new Set(queue)
  }

  function get (forLeague: string, name: string): TradeQuote | null {
    const q = stored.value[forLeague]?.[name]
    if (!q || q.chaos == null || now() - q.ts > SHOW_MS) return null
    return { chaos: q.chaos, listings: q.listings }
  }

  function due (forLeague: string, name: string): boolean {
    const q = stored.value[forLeague]?.[name]
    if (q && now() - q.ts < FRESH_MS) return false
    const failed = failedAt.get(`${forLeague}|${name}`)
    return failed == null || now() - failed >= RETRY_MS
  }

  function save (forLeague: string, name: string, quote: { chaos: number | null, listings: number }) {
    const next: Stored = { ...stored.value }
    next[forLeague] = { ...next[forLeague], [name]: { ...quote, ts: now() } }
    stored.value = next
    deps.write(next)
  }

  async function step () {
    if (busy || timer != null || !queue.length) return
    busy = true
    const name = queue[0]
    const forLeague = league
    try {
      save(forLeague, name, await deps.lookup(forLeague, name, divine))
    } catch {
      failedAt.set(`${forLeague}|${name}`, now())
    }
    busy = false
    // A new request can have replaced the queue during the lookup.
    if (queue[0] === name) queue = queue.slice(1)
    setPending()
    if (queue.length) {
      timer = setTimeout(() => {
        timer = null
        step().catch(() => {})
      }, GAP_MS)
    }
  }

  // Replaces what's queued; the opened boss goes first each time it changes.
  function request (forLeague: string, forDivine: number, names: string[]) {
    league = forLeague
    divine = forDivine
    queue = names.filter(name => due(forLeague, name))
    setPending()
    step().catch(() => {})
  }

  function stop () {
    queue = []
    setPending()
    if (timer != null) clearTimeout(timer)
    timer = null
  }

  function pending (name: string): boolean {
    return inFlight.value.has(name)
  }

  return { get, pending, request, stop }
}
