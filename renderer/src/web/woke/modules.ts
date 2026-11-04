// Module switchboard: which woke modules (and a few APT features) are on.
//
// A module that is off has its widgets kept in config but not mounted, its
// hotkeys left unregistered, and it is hidden from the widget menu. Shared
// services (Client.txt reader, poe.ninja polling) only run while an enabled
// module with a placed widget needs them.
//
// Kept free of Vue component and widget imports: Config.ts imports this file.
import type { ShortcutAction } from '@ipc/types'

export type ModuleGroup = 'economy' | 'mapping' | 'campaign' | 'builds' | 'apt'
// poll: keeps poe.ninja prices refreshing to build history (every 10 min).
// prices: reads the latest saved prices, no extra network.
// log: needs Client.txt lines.
// ocr: reads the screen with the OCR worker.
export type ModuleNeed = 'poll' | 'prices' | 'log' | 'ocr' | 'hotkeys' | 'network'

export interface ModuleDef {
  id: string
  name: string
  description: string
  group: ModuleGroup
  widgetTypes: string[]
  needs: ModuleNeed[]
}

export const MODULE_GROUPS: Array<{ id: ModuleGroup, label: string }> = [
  { id: 'economy', label: 'Economy' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'campaign', label: 'Campaign & lab' },
  { id: 'builds', label: 'Builds & trade' },
  { id: 'apt', label: 'Price check (Awakened PoE Trade)' }
]

export const MODULES: ModuleDef[] = [
  { id: 'market', name: 'Market tracker', description: 'Movers and watchlist from poe.ninja', group: 'economy', widgetTypes: ['woke-market-tracker'], needs: ['poll'] },
  { id: 'league-invest', name: 'Investments', description: 'League-start buys ranked from past leagues', group: 'economy', widgetTypes: ['woke-league-invest'], needs: ['poll', 'network'] },
  { id: 'lab-gems', name: 'Lab gems', description: 'Divine Font gem values by colour', group: 'economy', widgetTypes: ['woke-lab-gems'], needs: ['poll'] },
  { id: 'farming', name: 'Farming profit', description: 'Session profit per hour', group: 'economy', widgetTypes: ['woke-farming'], needs: ['log', 'prices'] },
  { id: 'boss-runs', name: 'Boss runs', description: 'Profit per boss kill', group: 'economy', widgetTypes: ['woke-boss-runs'], needs: ['prices'] },

  { id: 'map-mods', name: 'Map mods', description: 'Danger strip on price check and map regex', group: 'mapping', widgetTypes: ['woke-map-mods'], needs: ['hotkeys'] },
  { id: 'map-scan', name: 'Map scan', description: 'Reads map tooltips on screen', group: 'mapping', widgetTypes: ['woke-map-scan'], needs: ['ocr', 'hotkeys'] },
  { id: 'essence-scan', name: 'Essence scan', description: 'Reads essence monoliths and flags MEDS', group: 'mapping', widgetTypes: ['woke-essence-scan'], needs: ['ocr', 'hotkeys', 'prices'] },
  { id: 'loot-filter', name: 'Loot filter editor', description: 'Edit the NeverSink rule for a sampled item', group: 'mapping', widgetTypes: ['woke-loot-filter'], needs: ['log', 'hotkeys'] },
  { id: 'atlas', name: 'Atlas strategies', description: 'Tree, scarabs and regex per strategy', group: 'mapping', widgetTypes: ['woke-atlas-strategies'], needs: ['network'] },
  { id: 'mechanics', name: 'League mechanics', description: 'Picks and Betrayal board for the zone', group: 'mapping', widgetTypes: ['woke-mechanics'], needs: ['log', 'prices'] },

  { id: 'campaign', name: 'Campaign tracker', description: 'Next steps for the act you are in', group: 'campaign', widgetTypes: ['woke-campaign'], needs: ['log'] },
  { id: 'run-timer', name: 'Run timer', description: 'Act splits and personal bests', group: 'campaign', widgetTypes: ['woke-run-timer'], needs: ['log'] },
  { id: 'lab', name: 'Lab layouts', description: "Today's poelab layout and reset countdown", group: 'campaign', widgetTypes: ['woke-lab'], needs: ['hotkeys'] },

  { id: 'pob-builds', name: 'PoB builds', description: 'Your Path of Building folder', group: 'builds', widgetTypes: ['woke-pob-builds'], needs: [] },
  { id: 'trade-searches', name: 'Trade searches', description: 'Saved trade site searches', group: 'builds', widgetTypes: ['woke-trade-searches'], needs: ['hotkeys'] },
  { id: 'regex-library', name: 'Regex library', description: 'Saved stash search strings', group: 'builds', widgetTypes: ['woke-regex-library'], needs: ['hotkeys'] },

  // APT features: only their hotkeys can be switched off.
  { id: 'apt-price-check', name: 'Price check hotkeys', description: 'Check an item under the cursor', group: 'apt', widgetTypes: [], needs: ['hotkeys'] },
  { id: 'apt-item-info', name: 'Item info hotkeys', description: 'Item info, wiki, poedb, Craft of Exile, similar items', group: 'apt', widgetTypes: [], needs: ['hotkeys'] },
  { id: 'apt-heist-ocr', name: 'Heist gem OCR', description: 'Reads heist gem names; loads the OCR worker on first use', group: 'apt', widgetTypes: [], needs: ['ocr', 'hotkeys'] }
]

export interface Preset {
  id: string
  label: string
  // Woke modules switched on; APT features are left as they are.
  on: string[] | 'all'
}

export const PRESETS: Preset[] = [
  { id: 'everything', label: 'Everything', on: 'all' },
  { id: 'mapper', label: 'Mapper', on: ['market', 'farming', 'boss-runs', 'map-mods', 'map-scan', 'essence-scan', 'loot-filter', 'atlas', 'mechanics', 'trade-searches', 'regex-library'] },
  { id: 'leveling', label: 'Leveling', on: ['campaign', 'run-timer', 'lab', 'pob-builds', 'regex-library'] },
  { id: 'trader', label: 'Trader', on: ['market', 'league-invest', 'lab-gems', 'trade-searches', 'regex-library'] },
  { id: 'price-check-only', label: 'Price check only', on: [] }
]

// Stored in config.json as `woke`.
export interface WokeModulesConfig {
  setupDone: boolean
  off: string[]
}

interface ConfigLike {
  woke?: WokeModulesConfig
  widgets: Array<{ wmType: string }>
}

const moduleByWidget = new Map<string, ModuleDef>()
for (const m of MODULES) for (const t of m.widgetTypes) moduleByWidget.set(t, m)

export function isModuleOn (config: ConfigLike, id: string): boolean {
  return !config.woke?.off.includes(id)
}

// Core APT widgets (no module) are always on.
export function isWidgetTypeOn (config: ConfigLike, wmType: string): boolean {
  const m = moduleByWidget.get(wmType)
  return !m || isModuleOn(config, m.id)
}

export function widgetCount (config: ConfigLike, m: ModuleDef): number {
  return config.widgets.filter(w => m.widgetTypes.includes(w.wmType)).length
}

// A module "runs" when it is on and at least one of its widgets is placed.
export function isModuleRunning (config: ConfigLike, m: ModuleDef): boolean {
  if (!isModuleOn(config, m.id)) return false
  return m.group === 'apt' || widgetCount(config, m) > 0
}

export function modulesNeeding (config: ConfigLike, need: ModuleNeed): ModuleDef[] {
  return MODULES.filter(m => m.needs.includes(need) && isModuleRunning(config, m))
}

export function applyPreset (config: ConfigLike & { woke: WokeModulesConfig }, preset: Preset) {
  const aptOff = config.woke.off.filter(id => id.startsWith('apt-'))
  const wokeOff = preset.on === 'all'
    ? []
    : MODULES.filter(m => m.group !== 'apt' && !(preset.on as string[]).includes(m.id)).map(m => m.id)
  config.woke.off = [...aptOff, ...wokeOff]
}

export function setModuleOn (config: ConfigLike & { woke: WokeModulesConfig }, id: string, on: boolean) {
  const off = config.woke.off.filter(x => x !== id)
  if (!on) off.push(id)
  config.woke.off = off
}

export function ensureWokeConfig<T extends ConfigLike> (config: T): T & { woke: WokeModulesConfig } {
  config.woke ??= { setupDone: false, off: [] }
  return config as T & { woke: WokeModulesConfig }
}

// Drops hotkeys of APT features that are switched off.
export function filterAptShortcuts (config: ConfigLike, actions: ShortcutAction[]): ShortcutAction[] {
  const priceCheck = isModuleOn(config, 'apt-price-check')
  const itemInfo = isModuleOn(config, 'apt-item-info')
  const heistOcr = isModuleOn(config, 'apt-heist-ocr')
  const ITEM_INFO_TARGETS = ['item-check', 'open-wiki', 'open-craft-of-exile', 'open-poedb', 'search-similar']
  return actions.filter(({ action }) => {
    if (action.type === 'copy-item' && action.target === 'price-check') return priceCheck
    if (action.type === 'copy-item' && ITEM_INFO_TARGETS.includes(action.target)) return itemInfo
    if (action.type === 'ocr-text' && action.target === 'heist-gems') return heistOcr
    return true
  })
}

// Whether main should tail Client.txt. Before setup is done every module counts as on.
export function needsGameLog (config: ConfigLike): boolean {
  return modulesNeeding(config, 'log').length > 0
}
