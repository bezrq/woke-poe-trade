import type { Widget, Anchor } from '@/web/overlay/widgets'
import { DEFAULT_ROUTE_OPTIONS } from './route-parse'
import type { RouteOptions } from './route-parse'

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
  // Optional personal notes per act ("1".."10", "11" = epilogue).
  actNotes: Record<string, string>
  // Optional notes shown when entering a zone with this exact name.
  zoneNotes: ZoneNote[]
  showBuild: boolean
  state: CampaignState
  // Built-in route (exile-leveling) options and progress.
  route: RouteOptions
  step: number
  // Show the guide card under the strip.
  cardOpen: boolean
  // How many route steps the card lists (current one included).
  cardSteps: number
  // Hide in maps and hideouts once the campaign is done.
  hideAfterCampaign: boolean
  hotkeyCard: string | null
  hotkeyNext: string | null
  hotkeyPrev: string | null
}

export function emptyState (): CampaignState {
  return { zone: '', areaId: '', areaLevel: null, act: null, charName: '', className: '', level: null, updatedAt: 0 }
}

// Fills settings added after the widget was first placed.
export function migrateCampaign (w: CampaignWidget) {
  if (!w.route) w.route = { ...DEFAULT_ROUTE_OPTIONS }
  if (typeof w.step !== 'number') w.step = 0
  if (w.cardOpen === undefined) w.cardOpen = true
  if (w.cardSteps === undefined) w.cardSteps = 3
  if (w.hideAfterCampaign === undefined) w.hideAfterCampaign = true
  if (w.hotkeyCard === undefined) w.hotkeyCard = null
  if (w.hotkeyNext === undefined) w.hotkeyNext = null
  if (w.hotkeyPrev === undefined) w.hotkeyPrev = null
}

export type CampaignHotkey = 'card' | 'next' | 'prev'

export function hotkeyTarget (wmId: number, action: CampaignHotkey): string {
  return `woke-campaign:${wmId}:${action}`
}

export function parseHotkeyTarget (target: string): { wmId: number, action: CampaignHotkey } | null {
  const m = /^woke-campaign:(\d+):(card|next|prev)$/.exec(target)
  return m ? { wmId: Number(m[1]), action: m[2] as CampaignHotkey } : null
}
