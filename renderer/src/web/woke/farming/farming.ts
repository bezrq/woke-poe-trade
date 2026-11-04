import type { Widget, Anchor } from '@/web/overlay/widgets'

export const FARMING_TYPE = 'woke-farming'

export interface PricedRef {
  type: string
  name: string
  variant: string
}

export interface CostLine extends PricedRef {
  // Quantity spent per map.
  qty: number
}

export interface LootLine extends PricedRef {
  qty: number
}

export interface FarmingSession {
  strategy: string
  startedAt: number
  // Time counted before the current running stretch.
  elapsedMs: number
  // When the timer was last started; null while paused.
  runningSince: number | null
  maps: number
  loot: LootLine[]
  // Chaos value not tied to a priced item (e.g. sold items, raw currency).
  extraChaos: number
}

export interface FarmingResult {
  strategy: string
  endedAt: number
  durationMs: number
  maps: number
  costChaos: number
  lootChaos: number
  divine: number | null
}

export interface FarmingWidget extends Widget {
  anchor: Anchor
  strategy: string
  costs: CostLine[]
  autoCountMaps: boolean
  session: FarmingSession | null
  history: FarmingResult[]
}

export function newSession (strategy: string, now: number): FarmingSession {
  return { strategy, startedAt: now, elapsedMs: 0, runningSince: now, maps: 0, loot: [], extraChaos: 0 }
}

export function elapsed (s: FarmingSession, now: number): number {
  return s.elapsedMs + (s.runningSince != null ? now - s.runningSince : 0)
}

export function lineValue (lines: Array<PricedRef & { qty: number }>, price: (r: PricedRef) => number | null): { total: number, missing: number } {
  let total = 0
  let missing = 0
  for (const line of lines) {
    const p = price(line)
    if (p == null) missing++
    else total += p * line.qty
  }
  return { total, missing }
}

export interface Totals {
  costPerMap: number
  cost: number
  loot: number
  profit: number
  perHour: number | null
  perMap: number | null
  missingPrices: number
}

export function totals (
  session: FarmingSession,
  costs: CostLine[],
  price: (r: PricedRef) => number | null,
  now: number
): Totals {
  const c = lineValue(costs, price)
  const l = lineValue(session.loot, price)
  const cost = c.total * session.maps
  const loot = l.total + session.extraChaos
  const profit = loot - cost
  const hours = elapsed(session, now) / 3_600_000
  return {
    costPerMap: c.total,
    cost,
    loot,
    profit,
    perHour: hours > 1 / 60 ? profit / hours : null,
    perMap: session.maps ? profit / session.maps : null,
    missingPrices: c.missing + l.missing
  }
}

// Endgame maps are generated with an area id starting with "Map"
// (e.g. "MapWorldsStrand"); hideouts, towns and campaign areas are not.
export function isMapArea (areaId: string): boolean {
  return /^Map/i.test(areaId) && !/hideout/i.test(areaId)
}

export function strategyStats (history: FarmingResult[]): Array<{ strategy: string, sessions: number, maps: number, hours: number, perHour: number, perMap: number }> {
  const groups = new Map<string, FarmingResult[]>()
  for (const r of history) {
    const key = r.strategy || 'Unnamed'
    const list = groups.get(key)
    if (list) list.push(r)
    else groups.set(key, [r])
  }
  return Array.from(groups, ([strategy, list]) => {
    const maps = list.reduce((n, r) => n + r.maps, 0)
    const hours = list.reduce((n, r) => n + r.durationMs, 0) / 3_600_000
    const profit = list.reduce((n, r) => n + r.lootChaos - r.costChaos, 0)
    return { strategy, sessions: list.length, maps, hours, perHour: hours ? profit / hours : 0, perMap: maps ? profit / maps : 0 }
  }).sort((a, b) => b.perHour - a.perHour)
}

export function formatHms (ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
