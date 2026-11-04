import type { Widget, Anchor } from '@/web/overlay/widgets'
import type { FilterEdit } from './edits'
import { DEFAULT_BUILD_RULES } from './build-rules'
import type { BuildRuleSwitches } from './build-rules'

export const LOOT_FILTER_TYPE = 'woke-loot-filter'
// copy-item target: sample the hovered item and open its rule card.
export const LOOT_FILTER_SAMPLE_TARGET = 'woke-loot-filter'

export type SaveMode = 'copy' | 'overwrite'

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
