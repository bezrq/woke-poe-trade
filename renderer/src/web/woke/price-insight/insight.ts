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

export type DropReason = 'currency' | 'mine' | 'stale' | 'fixer' | 'wall' | 'dump'

export const DROP_LABEL: Record<DropReason, string> = {
  currency: 'priced in a currency we can not convert',
  mine: 'your own listing',
  stale: 'seller offline and listing older than 3 days',
  fixer: 'far below the next listings, likely bait from a price fixer',
  wall: 'one seller listing many copies far under everyone else, a classic price-fixing wall',
  dump: 'one of several cheap listings that all appeared in the last hour, likely a price-fixing dump'
}

/** Short tag shown on a listing row for the reasons that point at price fixing. */
export const FIX_TAG: Partial<Record<DropReason, string>> = {
  fixer: 'bait',
  wall: 'wall',
  dump: 'dump',
  stale: 'ghost'
}

/** Drop reasons that mean someone may be faking the price. */
export const FIXING_REASONS = new Set<DropReason>(['fixer', 'wall', 'dump'])

export type FixRisk = 'none' | 'low' | 'medium' | 'high'

export interface FixSignal {
  kind: 'bait' | 'wall' | 'dump' | 'thin' | 'old'
  text: string
}

export type Confidence = 'high' | 'medium' | 'low' | 'none'

export interface Insight {
  /** Listings used for the range, cheapest first, with their chaos value. */
  kept: Array<{ id: string, chaos: number, weight?: number }>
  dropped: Map<string, DropReason>
  /** Chaos value of every listing that could be converted, kept or not. */
  prices: Map<string, number>
  /** Cheapest trusted listing, median of the cheapest few, and the top of that window. */
  range: { low: number, fair: number, high: number } | null
  /** Price to list at to sell fast (just under the floor) and when patient (the fair price). */
  suggest: { fast: number, patient: number } | null
  confidence: Confidence
  /** How likely it is that the cheap end of the listings is fake, and why. */
  risk: FixRisk
  signals: FixSignal[]
}

export interface InsightOptions {
  /** Chaos per divine; without it divine listings can not be compared. */
  divine: number | undefined
  /** Chaos value of other currencies, keyed by trade API id. */
  otherRates?: Record<string, number>
  now?: number
}

const STALE_MS = 3 * 24 * 60 * 60 * 1000
// Listings still up after this long are not selling at their price.
const OLD_MS = 7 * 24 * 60 * 60 * 1000
const WINDOW = 6
const FIXER_RATIO = 0.5
// A seller's pile of copies counts as a wall when it asks less than this share
// of what other sellers ask.
const WALL_RATIO = 0.7
const WALL_COPIES = 3
// Listings this fresh and this far under the rest are a dump when there are
// at least DUMP_MIN of them.
const DUMP_AGE_MS = 60 * 60 * 1000
const DUMP_RATIO = 0.5
const DUMP_MIN = 2

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

type KeptRow = { id: string, chaos: number, weight: number, account: string, copies: number, age: number | null }

export function buildInsight (listings: InsightListing[], opts: InsightOptions): Insight {
  const now = opts.now ?? Date.now()
  const dropped = new Map<string, DropReason>()
  const prices = new Map<string, number>()
  let kept: KeptRow[] = []

  for (const l of listings) {
    if (l.isMine) { dropped.set(l.id, 'mine'); continue }
    const chaos = toChaos(l.priceAmount, l.priceCurrency, opts)
    if (chaos == null) { dropped.set(l.id, 'currency'); continue }
    prices.set(l.id, chaos)
    const age = l.indexedAt ? now - Date.parse(l.indexedAt) : null
    if (l.accountStatus === 'offline' && !l.hasFee && age != null && age > STALE_MS) {
      dropped.set(l.id, 'stale'); continue
    }
    kept.push({
      id: l.id,
      chaos,
      weight: listingWeight(l, now),
      account: l.accountName,
      copies: l.listedTimes ?? 1,
      age: age != null && Number.isFinite(age) ? age : null
    })
  }
  kept.sort((a, b) => a.chaos - b.chaos)

  kept = dropWalls(kept, dropped)
  kept = dropDumps(kept, dropped)

  // Peel off bait listings from the bottom: a listing that costs less than half
  // of what the next few ask is almost never real.
  while (kept.length >= 4) {
    const next = median(kept.slice(1, 1 + WINDOW).map(k => k.chaos))
    if (kept[0].chaos >= next * FIXER_RATIO) break
    dropped.set(kept[0].id, 'fixer')
    kept = kept.slice(1)
  }

  const { risk, signals } = fixRisk(kept, dropped, listings)

  if (!kept.length) {
    return { kept: [], dropped, prices, range: null, suggest: null, confidence: 'none', risk, signals }
  }

  const windowRows = kept.slice(0, WINDOW)
  const window = windowRows.map(k => k.chaos)
  const range = { low: window[0], fair: weightedMedian(windowRows), high: window[window.length - 1] }
  const spread = range.high / range.low

  let confidence: Confidence
  if (kept.length >= 8 && spread <= 2) confidence = 'high'
  else if (kept.length >= 4 && spread <= 4) confidence = 'medium'
  else confidence = 'low'

  // Agreeing listings prove nothing when none of them has sold in a week.
  const oldOnly = windowRows.every(k => k.age != null && k.age > OLD_MS)
  if (oldOnly) {
    confidence = 'low'
    signals.push({ kind: 'old', text: 'The cheapest listings are all over a week old, so this may not be what it really sells for' })
  }

  return {
    kept: kept.map(k => ({ id: k.id, chaos: k.chaos, weight: k.weight })),
    dropped,
    prices,
    range,
    suggest: {
      // At least 1c, except for items whose cheapest listing is under 1c.
      fast: range.low >= 1 ? Math.max(range.low * 0.97, 1) : range.low,
      patient: Math.max(range.fair, range.low)
    },
    confidence,
    risk,
    signals
  }
}

// One seller with a pile of copies at the bottom, far under what other
// sellers ask: the pile is there to drag the price down, not to sell.
function dropWalls (kept: KeptRow[], dropped: Map<string, DropReason>): KeptRow[] {
  const bottom = kept.slice(0, WINDOW)
  const walls = new Set<string>()
  for (const row of bottom) {
    if (row.copies < WALL_COPIES) continue
    const others = kept.filter(k => k.account !== row.account).slice(0, WINDOW).map(k => k.chaos)
    if (others.length < 3) continue
    if (row.chaos < median(others) * WALL_RATIO) walls.add(row.account)
  }
  if (!walls.size) return kept
  return kept.filter(k => {
    // Every listing of that seller under the line goes, not only the pile.
    if (!walls.has(k.account)) return true
    const others = kept.filter(o => !walls.has(o.account)).slice(0, WINDOW).map(o => o.chaos)
    if (k.chaos >= median(others) * WALL_RATIO) return true
    dropped.set(k.id, 'wall')
    return false
  })
}

// Several listings that all appeared within the last hour, far under the
// listings that were already there.
function dropDumps (kept: KeptRow[], dropped: Map<string, DropReason>): KeptRow[] {
  const older = kept.filter(k => k.age == null || k.age > DUMP_AGE_MS).slice(0, WINDOW).map(k => k.chaos)
  if (older.length < 3) return kept
  const line = median(older) * DUMP_RATIO
  const dump = kept.filter(k => k.age != null && k.age <= DUMP_AGE_MS && k.chaos < line)
  if (dump.length < DUMP_MIN) return kept
  const ids = new Set(dump.map(d => d.id))
  for (const id of ids) dropped.set(id, 'dump')
  return kept.filter(k => !ids.has(k.id))
}

function fixRisk (kept: KeptRow[], dropped: Map<string, DropReason>, listings: InsightListing[]): { risk: FixRisk, signals: FixSignal[] } {
  const signals: FixSignal[] = []
  const count = (r: DropReason) => {
    let n = 0
    for (const [id, reason] of dropped) {
      if (reason !== r) continue
      n += listings.find(l => l.id === id)?.listedTimes ?? 1
    }
    return n
  }
  const walls = count('wall')
  const dumps = count('dump')
  const bait = count('fixer')
  if (walls) {
    const ids = Array.from(dropped).filter(([, r]) => r === 'wall').map(([id]) => id)
    const sellers = new Set(listings.filter(l => ids.includes(l.id)).map(l => l.accountName))
    signals.push({ kind: 'wall', text: sellers.size === 1 ? `One seller listed ${walls} copies far under everyone else` : `${sellers.size} sellers listed ${walls} copies far under everyone else` })
  }
  if (dumps) signals.push({ kind: 'dump', text: `${dumps} cheap listings all appeared in the last hour` })
  if (bait) signals.push({ kind: 'bait', text: bait === 1 ? 'One bait listing far under the rest' : `${bait} bait listings far under the rest` })
  const sellers = new Set(kept.map(k => k.account)).size
  if (kept.length > 0 && kept.length < 4 && sellers <= 2) {
    signals.push({ kind: 'thin', text: 'Few listings from one or two sellers: easy to fake, check by hand' })
  }

  const LEVELS: FixRisk[] = ['none', 'low', 'medium', 'high']
  let level = 0
  if (walls || dumps) level = 3
  else if (bait >= 2) level = 2
  else if (bait === 1) level = 1
  if (signals.some(s => s.kind === 'thin')) level = Math.min(level + 1, 3)
  const risk = LEVELS[level]
  return { risk, signals }
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
