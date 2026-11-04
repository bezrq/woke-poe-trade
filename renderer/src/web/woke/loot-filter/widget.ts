import type { Widget, Anchor } from '@/web/overlay/widgets'
import type { FilterEdit } from './edits'
import { DEFAULT_BUILD_RULES } from './build-rules'
import type { BuildRuleSwitches } from './build-rules'
import type { PriceMove, UniqueRule } from './economy'
import { DEFAULT_SAFETY_NET } from './safety'
import type { SafetyNet } from './safety'

export const LOOT_FILTER_TYPE = 'woke-loot-filter'
// copy-item target: sample the hovered item and open its rule card.
export const LOOT_FILTER_SAMPLE_TARGET = 'woke-loot-filter'

export type SaveMode = 'copy' | 'overwrite'

export interface PriceTiers {
  // Re-tier price groups from poe.ninja (reviewed before anything moves).
  on: boolean
  // Moves applied on top of NeverSink's tiers, kept until prices say otherwise.
  moves: PriceMove[]
  // The list before the last Apply, for Undo.
  prev: PriceMove[] | null
  // `${type}|${base}` keys you kept where they are.
  locks: string[]
  appliedAt: number | null
  // How a base with several uniques is priced.
  uniqueRule: UniqueRule
}

export interface SavePoint {
  ts: number
  label: string
  edits: FilterEdit[]
  moves: PriceMove[]
}

export const HISTORY_SIZE = 20

export interface LootFilterWidget extends Widget {
  anchor: Anchor
  // Hover an item and press: card with the rule that matched it.
  sampleHotkey: string | null
  // Opens the full editor.
  editorHotkey: string | null
  // Empty: Documents/My Games/Path of Exile.
  folder: string
  // The downloaded NeverSink file the edits are applied to.
  sourceName: string
  // The source is an online filter (OnlineFilters folder, read only):
  // sourceName is its id and sourceTitle its name. Saves always go to a copy.
  sourceOnline: boolean
  sourceTitle: string
  // 'copy' writes "<source> (woke).filter", 'overwrite' replaces the source
  // (keeping a .bak of the first original).
  saveMode: SaveMode
  // After saving, type `/itemfilter <name>` in chat to make the game reload it.
  reloadViaChat: boolean
  // Hold that chat command until you're in town or your hideout.
  reloadWhenSafe: boolean
  edits: FilterEdit[]
  // NeverSink version the edits were last saved against, to spot updates.
  lastVersion: string | null
  // Area level used for AreaLevel conditions when Client.txt hasn't shown one.
  fallbackAreaLevel: number
  // Rules made from the active PoB build (top of the saved filter).
  buildRules: BuildRuleSwitches
  // Fingerprint of the build rules at the last save, to flag unsaved changes.
  savedBuildSig?: string
  // Fingerprint of price moves + safety net at the last save.
  savedExtraSig?: string
  priceTiers: PriceTiers
  safetyNet: SafetyNet
  // Changes as they were at each of the last saves, newest first.
  history: SavePoint[]
}

export function defaultPriceTiers (): PriceTiers {
  return { on: true, moves: [], prev: null, locks: [], appliedAt: null, uniqueRule: 'max' }
}

export function initLootFilterWidget (w: LootFilterWidget) {
  w.wmTitle = 'Loot filter'
  w.wmFlags = ['invisible-on-blur']
  w.anchor = { pos: 'cc', x: 50, y: 45 }
  w.sampleHotkey = 'Alt + F'
  w.editorHotkey = 'Alt + Shift + F'
  w.folder = ''
  w.sourceName = ''
  w.sourceOnline = false
  w.sourceTitle = ''
  w.saveMode = 'copy'
  w.reloadViaChat = true
  w.reloadWhenSafe = true
  w.edits = []
  w.lastVersion = null
  w.fallbackAreaLevel = 83
  w.buildRules = { ...DEFAULT_BUILD_RULES }
  w.priceTiers = defaultPriceTiers()
  w.safetyNet = { ...DEFAULT_SAFETY_NET }
  w.history = []
}

export function normalizeLootFilterWidget (w: LootFilterWidget) {
  if (!w.anchor) w.anchor = { pos: 'cc', x: 50, y: 45 }
  if (w.sampleHotkey === undefined) w.sampleHotkey = null
  if (w.editorHotkey === undefined) w.editorHotkey = null
  if (typeof w.folder !== 'string') w.folder = ''
  if (typeof w.sourceName !== 'string') w.sourceName = ''
  if (w.saveMode !== 'overwrite') w.saveMode = 'copy'
  if (typeof w.reloadViaChat !== 'boolean') w.reloadViaChat = true
  if (typeof w.reloadWhenSafe !== 'boolean') w.reloadWhenSafe = true
  if (typeof w.sourceOnline !== 'boolean') w.sourceOnline = false
  if (typeof w.sourceTitle !== 'string') w.sourceTitle = ''
  if (!Array.isArray(w.edits)) w.edits = []
  if (w.lastVersion === undefined) w.lastVersion = null
  if (typeof w.fallbackAreaLevel !== 'number') w.fallbackAreaLevel = 83
  if (!w.buildRules || typeof w.buildRules !== 'object') w.buildRules = { ...DEFAULT_BUILD_RULES }
  for (const k of Object.keys(DEFAULT_BUILD_RULES) as Array<keyof BuildRuleSwitches>) {
    if (typeof w.buildRules[k] !== 'boolean') w.buildRules[k] = DEFAULT_BUILD_RULES[k]
  }
  const pt = w.priceTiers as Partial<PriceTiers> | undefined
  if (!pt || typeof pt !== 'object') {
    w.priceTiers = defaultPriceTiers()
  } else {
    const d = defaultPriceTiers()
    w.priceTiers = {
      on: typeof pt.on === 'boolean' ? pt.on : d.on,
      moves: Array.isArray(pt.moves) ? pt.moves : [],
      prev: Array.isArray(pt.prev) ? pt.prev : null,
      locks: Array.isArray(pt.locks) ? pt.locks.filter(x => typeof x === 'string') : [],
      appliedAt: typeof pt.appliedAt === 'number' ? pt.appliedAt : null,
      uniqueRule: pt.uniqueRule === 'min' ? 'min' : 'max'
    }
  }
  if (!w.safetyNet || typeof w.safetyNet !== 'object') w.safetyNet = { ...DEFAULT_SAFETY_NET }
  if (typeof w.safetyNet.on !== 'boolean') w.safetyNet.on = DEFAULT_SAFETY_NET.on
  if (typeof w.safetyNet.minChaos !== 'number' || !(w.safetyNet.minChaos > 0)) w.safetyNet.minChaos = DEFAULT_SAFETY_NET.minChaos
  if (!Array.isArray(w.history)) w.history = []
}

export function editorHotkeyTarget (wmId: number): string {
  return `woke-loot-filter:${wmId}`
}

export function parseEditorHotkeyTarget (target: string): number | null {
  const m = /^woke-loot-filter:(\d+)$/.exec(target)
  return m ? Number(m[1]) : null
}

export function outputName (w: Pick<LootFilterWidget, 'sourceName' | 'saveMode' | 'sourceOnline' | 'sourceTitle'>): string {
  if (w.sourceOnline) {
    const safe = (w.sourceTitle || w.sourceName).replace(/[<>:"/\\|?*]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    return `${safe || 'Online filter'} (woke).filter`
  }
  if (w.saveMode === 'overwrite') return w.sourceName
  return w.sourceName.replace(/\.filter$/i, '') + ' (woke).filter'
}
