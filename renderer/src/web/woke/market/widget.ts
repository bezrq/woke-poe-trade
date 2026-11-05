import { shallowRef } from 'vue'
import type { Widget, Anchor } from '@/web/overlay/widgets'
import type { CorruptedFilter } from './types'

export const MARKET_TRACKER_TYPE = 'woke-market-tracker'

export type MoverPeriod = '6h' | '24h' | '7d'

export const PERIOD_MS: Record<MoverPeriod, number> = {
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000
}

export interface WatchedItem {
  type: string
  name: string
  variant: string
  // Alert when the price goes above / below these (chaos). null = off.
  above?: number | null
  below?: number | null
  // Which side of the thresholds the last snapshot was on, so an alert
  // fires once per crossing instead of on every snapshot.
  alertState?: 'above' | 'below' | null
}

// Which alert, if any, a new price triggers. Returns the new state and
// whether it is a fresh crossing worth telling the player about.
export function checkAlert (w: WatchedItem, price: number | null): { state: 'above' | 'below' | null, fire: boolean } {
  if (price == null) return { state: w.alertState ?? null, fire: false }
  let state: 'above' | 'below' | null = null
  if (w.above != null && w.above > 0 && price >= w.above) state = 'above'
  else if (w.below != null && w.below > 0 && price <= w.below) state = 'below'
  return { state, fire: state != null && state !== (w.alertState ?? null) }
}

export interface MarketTrackerWidget extends Widget {
  anchor: Anchor
  view: 'movers' | 'watchlist'
  period: MoverPeriod
  minChaos: number
  typeFilter: string
  watchlist: WatchedItem[]
  // Measure moves in chaos or in divines.
  unit?: 'chaos' | 'div'
  // Show items poe.ninja barely saw trade on.
  showThin?: boolean
  // Corrupted gems: all of them, only them, or none of them.
  corrupted?: CorruptedFilter
}

// Opens the tracker on a search, from the search palette.
export const marketSearchRequest = shallowRef<string | null>(null)
