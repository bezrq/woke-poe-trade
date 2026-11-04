import type { Widget, Anchor } from '@/web/overlay/widgets'

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
}

export interface MarketTrackerWidget extends Widget {
  anchor: Anchor
  view: 'movers' | 'watchlist'
  period: MoverPeriod
  minChaos: number
  typeFilter: string
  watchlist: WatchedItem[]
}
