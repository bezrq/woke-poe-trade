// Turns raw trade listings into a verdict: which listings to trust, a fair
// price range, and a suggested list price. Pure functions, no Vue or IO, so the
// rules can be checked in isolation.

export interface InsightListing {
  id: string
  priceAmount: number
  priceCurrency: string
  indexedAt?: string
  hasNote: boolean
  hasFee: boolean
  isMine: boolean
  accountName: string
  accountStatus: 'offline' | 'online' | 'afk'
  listedTimes: number
}

export type DropReason = 'currency' | 'mine' | 'stale' | 'fixer'

export const DROP_LABEL: Record<DropReason, string> = {
  currency: 'priced in a currency we can not convert',
  mine: 'your own listing',
  stale: 'seller offline and listing older than 3 days',
  fixer: 'far below the next listings, likely a price fixer'
}

export type Confidence = 'high' | 'medium' | 'low' | 'none'

export interface Insight {
  /** Listings used for the range, cheapest first, with their chaos value. */
  kept: Array<{ id: string, chaos: number, weight?: number }>
  dropped: Map<string, DropReason>
  /** Cheapest trusted listing, median of the cheapest few, and the top of that window. */
  range: { low: number, fair: number, high: number } | null
  /** Price to list at to sell fast (just under the floor) and when patient (the fair price). */
  suggest: { fast: number, patient: number } | null
  confidence: Confidence
}

export interface InsightOptions {
  /** Chaos per divine; without it divine listings can not be compared. */
  divine: number | undefined
  /** Chaos value of other currencies, keyed by trade API id. */
  otherRates?: Record<string, number>
  now?: number
}

const STALE_MS = 3 * 24 * 60 * 60 * 1000
const WINDOW = 6
const FIXER_RATIO = 0.5

export function toChaos (amount: number, currency: string, opts: InsightOptions): number | null {
  if (!(amount > 0)) return null
  if (currency === 'chaos') return amount
  if (currency === 'divine') return opts.divine ? amount * opts.divine : null
  const rate = opts.otherRates?.[currency]
  return rate ? amount * rate : null
}

function median (values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// How much a listing says about what the item really sells for: sellers who
// are online and listed recently are the ones actually trading.
const STATUS_WEIGHT: Record<InsightListing['accountStatus'], number> = { online: 1, afk: 0.7, offline: 0.4 }
const DAY_MS = 24 * 60 * 60 * 1000

export function listingWeight (l: Pick<InsightListing, 'accountStatus' | 'indexedAt'>, now: number): number {
  let w = STATUS_WEIGHT[l.accountStatus] ?? 0.5
  if (l.indexedAt) {
    const age = now - Date.parse(l.indexedAt)
    if (age > 7 * DAY_MS) w *= 0.6
    else if (age > DAY_MS) w *= 0.8
  }
  return w
}

// Median where each listing counts by its weight; rows sorted by price.
export function weightedMedian (rows: Array<{ chaos: number, weight: number }>): number {
  const total = rows.reduce((s, r) => s + r.weight, 0)
  if (!(total > 0)) return median(rows.map(r => r.chaos))
  let acc = 0
  for (const r of rows) {
    acc += r.weight
    if (acc >= total / 2) return r.chaos
  }
  return rows[rows.length - 1].chaos
}

export function buildInsight (listings: InsightListing[], opts: InsightOptions): Insight {
  const now = opts.now ?? Date.now()
  const dropped = new Map<string, DropReason>()
  let kept: Array<{ id: string, chaos: number, weight: number }> = []

  for (const l of listings) {
    if (l.isMine) { dropped.set(l.id, 'mine'); continue }
    const chaos = toChaos(l.priceAmount, l.priceCurrency, opts)
    if (chaos == null) { dropped.set(l.id, 'currency'); continue }
    if (l.accountStatus === 'offline' && !l.hasFee && l.indexedAt) {
      const age = now - Date.parse(l.indexedAt)
      if (age > STALE_MS) { dropped.set(l.id, 'stale'); continue }
    }
    kept.push({ id: l.id, chaos, weight: listingWeight(l, now) })
  }
  kept.sort((a, b) => a.chaos - b.chaos)

  // Peel off bait listings from the bottom: a listing that costs less than half
  // of what the next few ask is almost never real.
  while (kept.length >= 4) {
    const next = median(kept.slice(1, 1 + WINDOW).map(k => k.chaos))
    if (kept[0].chaos >= next * FIXER_RATIO) break
    dropped.set(kept[0].id, 'fixer')
    kept = kept.slice(1)
  }

  if (!kept.length) {
    return { kept, dropped, range: null, suggest: null, confidence: 'none' }
  }

  const windowRows = kept.slice(0, WINDOW)
  const window = windowRows.map(k => k.chaos)
  const range = { low: window[0], fair: weightedMedian(windowRows), high: window[window.length - 1] }
  const spread = range.high / range.low

  let confidence: Confidence
  if (kept.length >= 8 && spread <= 2) confidence = 'high'
  else if (kept.length >= 4 && spread <= 4) confidence = 'medium'
  else confidence = 'low'

  return {
    kept,
    dropped,
    range,
    suggest: {
      fast: Math.max(range.low * 0.97, 1),
      patient: Math.max(range.fair, range.low)
    },
    confidence
  }
}

export interface NotePrice { amount: number, currency: 'chaos' | 'divine' }

/** Rounds a chaos value to a price a player would type, in chaos or divines. */
export function notePrice (chaos: number, divine: number | undefined): NotePrice {
  if (divine && chaos >= divine) {
    const div = chaos / divine
    const amount = div >= 20 ? Math.floor(div) : Math.floor(div * 10) / 10
    return { amount: Math.max(amount, 1), currency: 'divine' }
  }
  let amount: number
  if (chaos >= 100) amount = Math.floor(chaos / 5) * 5
  else if (chaos >= 2) amount = Math.floor(chaos)
  else amount = 1
  return { amount, currency: 'chaos' }
}

export function noteText (p: NotePrice): string {
  return `~b/o ${p.amount} ${p.currency}`
}
