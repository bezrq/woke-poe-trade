import type { Widget, Anchor } from '@/web/overlay/widgets'

export const CAMPAIGN_TYPE = 'woke-campaign'

export interface CampaignState {
  zone: string
  areaId: string
  areaLevel: number | null
  act: number | null
  charName: string
  className: string
  level: number | null
  updatedAt: number
}

export interface ZoneNote {
  id: number
  zone: string
  text: string
}

export interface CampaignWidget extends Widget {
  anchor: Anchor
  // Only track level-ups for this character ('' = any character seen).
  charName: string
  // Notes per act ("1".."10", "11" = epilogue).
  actNotes: Record<string, string>
  // Notes shown when entering a zone with this exact name.
  zoneNotes: ZoneNote[]
  showBuild: boolean
  state: CampaignState
}

export function emptyState (): CampaignState {
  return { zone: '', areaId: '', areaLevel: null, act: null, charName: '', className: '', level: null, updatedAt: 0 }
}

// Rough XP penalty-free range used in PoE: area level within 3 + level/16
// of the character level.
export function safeLevelRange (charLevel: number): number {
  return 3 + Math.floor(charLevel / 16)
}
