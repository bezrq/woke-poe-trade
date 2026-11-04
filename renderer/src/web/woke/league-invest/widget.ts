import type { Widget, Anchor } from '@/web/overlay/widgets'

export const LEAGUE_INVEST_TYPE = 'woke-league-invest'

export interface LeagueInvestWidget extends Widget {
  anchor: Anchor
  // Spare currency to invest, in divines.
  budgetDiv: number
  // How many different items to spread the budget over.
  slots: number
  // Days to hold.
  horizon: number
  bulkOnly: boolean
  minMultiple: number
  // Manual league start (YYYY-MM-DD); empty = from GGG's league list.
  leagueStart: string
  // Manual league day; null = computed from the start date.
  dayOverride: number | null
}
