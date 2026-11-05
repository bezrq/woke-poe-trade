import type { Widget, Anchor } from '@/web/overlay/widgets'

export const LEAGUE_INVEST_TYPE = 'woke-league-invest'

export interface LeagueInvestWidget extends Widget {
  anchor: Anchor
  // League whose dock icon you've finished with.
  doneLeague?: string
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
  // Items a patch changed this league, one per line (name, or part of a
  // name, e.g. "Scarab"). Past-league history says little about them.
  changedItems?: string
  hideChanged?: boolean
}

export function changedMatchers (text: string | undefined): string[] {
  return (text ?? '').split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#'))
}

export function isChanged (name: string, matchers: string[]): boolean {
  const n = name.toLowerCase()
  return matchers.some(m => n.includes(m))
}
