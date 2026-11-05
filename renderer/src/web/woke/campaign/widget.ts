import type { Widget, Anchor } from '@/web/overlay/widgets'
import { actFromAreaId, isTown } from './log-parse'
import { DEFAULT_ROUTE_OPTIONS } from './route-parse'
import type { PinId } from './pins'
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
  // Build gems ticked as bought or taken for this character (PoB names).
  gemsGot?: string[]
  // Past the campaign: no icon, and the route stays where it is.
  asleep?: boolean
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
  // Values kept on screen in the icon (none by default).
  pins: PinId[]
  // How many route steps the card lists (current one included).
  cardSteps: number
  hotkeyCard: string | null
  hotkeyNext: string | null
  hotkeyPrev: string | null
}

export function emptyState (): CampaignState {
  return { zone: '', areaId: '', areaLevel: null, act: null, charName: '', className: '', level: null, updatedAt: 0, gemsGot: [] }
}

// Fills settings added after the widget was first placed.
export function migrateCampaign (w: CampaignWidget) {
  if (!w.route) w.route = { ...DEFAULT_ROUTE_OPTIONS }
  if (typeof w.step !== 'number') w.step = 0
  if (w.cardSteps === undefined) w.cardSteps = 3
  if (!Array.isArray(w.pins)) w.pins = []
  if (w.hotkeyCard === undefined) w.hotkeyCard = null
  if (w.hotkeyNext === undefined) w.hotkeyNext = null
  if (w.hotkeyPrev === undefined) w.hotkeyPrev = null
  if (w.state && !Array.isArray(w.state.gemsGot)) w.state.gemsGot = []
}

// The log doesn't say which character is playing, so where you go decides:
// a map means past the campaign, and a campaign zone that isn't a town (the
// Twilight Strand for a new character) means levelling again. Towns and
// hideouts say nothing, since anyone can walk through them.
export function routeAsleepAfter (asleep: boolean, areaId: string): boolean {
  if (/^Map/i.test(areaId)) return true
  if (actFromAreaId(areaId) != null && !isTown(areaId)) return false
  return asleep
}

export type CampaignHotkey = 'card' | 'next' | 'prev'

export function hotkeyTarget (wmId: number, action: CampaignHotkey): string {
  return `woke-campaign:${wmId}:${action}`
}

export function parseHotkeyTarget (target: string): { wmId: number, action: CampaignHotkey } | null {
  const m = /^woke-campaign:(\d+):(card|next|prev)$/.exec(target)
  return m ? { wmId: Number(m[1]), action: m[2] as CampaignHotkey } : null
}
