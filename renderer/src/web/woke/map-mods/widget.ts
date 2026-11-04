import type { Widget, Anchor } from '@/web/overlay/widgets'
import { AppConfig } from '@/web/Config'
import type { MapCheckConfig } from '@/web/map-check/common'
import { importAptMapRatings } from './apt-import'
import { DEFAULT_JUICE_WEIGHTS, defaultProfile } from './rules'
import type { JuiceWeights, MapModProfile } from './rules'

export const MAP_MODS_TYPE = 'woke-map-mods'
// copy-item target for the checker's own hotkey.
export const MAP_MODS_TARGET = 'woke-map-mods'

export interface MapModsWidget extends Widget {
  anchor: Anchor
  hotkey: string | null
  // Pastes the active profile's regex into the stash search.
  regexHotkey: string | null
  // Last generated regex, kept here so the hotkey can paste it.
  regexText: string
  // Show the slim verdict strip on APT's price check and item info windows.
  stripOnPriceCheck: boolean
  activeProfile: number
  profiles: MapModProfile[]
  weights: JuiceWeights
  // APT's map check ratings were brought over (once).
  aptImported?: boolean
}

export function initMapModsWidget (w: MapModsWidget) {
  w.wmTitle = 'Map mod checker'
  w.wmFlags = ['invisible-on-blur']
  w.anchor = { pos: 'tc', x: 50, y: 10 }
  w.hotkey = 'Alt + M'
  w.regexHotkey = null
  w.regexText = ''
  w.stripOnPriceCheck = true
  w.activeProfile = 1
  w.profiles = [defaultProfile()]
  w.weights = { ...DEFAULT_JUICE_WEIGHTS }
  importAptOnce(w)
}

// APT's item info map check is replaced by this module: bring its ratings over.
function importAptOnce (w: MapModsWidget) {
  if (w.aptImported) return
  w.aptImported = true
  try {
    const itemCheck = AppConfig().widgets.find(_ => _.wmType === 'item-check') as { maps?: MapCheckConfig } | undefined
    importAptMapRatings(w.profiles, itemCheck?.maps)
  } catch {}
}

// Fills fields missing from configs saved by older versions.
export function normalizeMapModsWidget (w: MapModsWidget) {
  if (!w.anchor) w.anchor = { pos: 'tc', x: 50, y: 10 }
  if (!Array.isArray(w.profiles) || !w.profiles.length) w.profiles = [defaultProfile()]
  if (!w.profiles.some(p => p.id === w.activeProfile)) w.activeProfile = w.profiles[0].id
  w.weights = { ...DEFAULT_JUICE_WEIGHTS, ...(w.weights ?? {}) }
  if (typeof w.stripOnPriceCheck !== 'boolean') w.stripOnPriceCheck = true
  if (w.hotkey === undefined) w.hotkey = null
  if (w.regexHotkey === undefined) w.regexHotkey = null
  if (typeof w.regexText !== 'string') w.regexText = ''
  for (const p of w.profiles) {
    if (!p.mins || typeof p.mins !== 'object') p.mins = {}
    if (p.highlight !== 'bad') p.highlight = 'good'
    if (!p.ratings || typeof p.ratings !== 'object') p.ratings = {}
  }
  importAptOnce(w)
}

export function activeProfile (w: MapModsWidget): MapModProfile {
  return w.profiles.find(p => p.id === w.activeProfile) ?? w.profiles[0]
}
