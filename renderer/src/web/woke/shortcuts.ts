// Kept free of Vue component imports: Config.ts imports this file,
// and components import Config.ts.
import type { ShortcutAction } from '@ipc/types'
import type { Widget } from '@/web/overlay/widgets'
import { REGEX_LIBRARY_TYPE, effectiveText } from './regex-library/widget'
import type { RegexLibraryWidget } from './regex-library/widget'
import { TRADE_SEARCHES_TYPE, hotkeyTarget } from './trade-searches/widget'
import type { TradeSearchesWidget } from './trade-searches/widget'
import { LAB_TYPE, hotkeyTarget as labHotkeyTarget } from './lab/lab'
import type { LabWidget } from './lab/lab'
import { MAP_MODS_TYPE, MAP_MODS_TARGET } from './map-mods/widget'
import type { MapModsWidget } from './map-mods/widget'
import { MAP_SCAN_TYPE, scanHotkeyTarget } from './map-mods/scan'
import type { MapScanWidget } from './map-mods/scan'
import { isWidgetTypeOn } from './modules'
import { ESSENCE_SCAN_TYPE, essenceHotkeyTarget, essenceOnceTarget } from './essence-scan/widget'
import type { EssenceScanWidget } from './essence-scan/widget'
import { LOOT_FILTER_TYPE, LOOT_FILTER_SAMPLE_TARGET, editorHotkeyTarget } from './loot-filter/widget'
import type { LootFilterWidget } from './loot-filter/widget'
import { FARMING_TYPE, FARMING_LOOT_TARGET } from './farming/farming'
import type { FarmingWidget } from './farming/farming'

export function wokeShortcutsFor (widget: Widget, config: { woke?: { setupDone: boolean, off: string[] }, widgets: Widget[] }): ShortcutAction[] {
  // Modules that are switched off register no hotkeys.
  if (!isWidgetTypeOn(config, widget.wmType)) return []
  if (widget.wmType === REGEX_LIBRARY_TYPE) {
    const lib = widget as RegexLibraryWidget
    if (!lib.enableHotkeys) return []
    return lib.entries
      .filter(entry => entry.hotkey && entry.text)
      .map(entry => ({
        shortcut: entry.hotkey!,
        action: { type: 'stash-search', text: effectiveText(entry) }
      }))
  }
  if (widget.wmType === TRADE_SEARCHES_TYPE) {
    const searches = widget as TradeSearchesWidget
    if (!searches.enableHotkeys) return []
    const actions: ShortcutAction[] = []
    for (const entry of searches.entries) {
      if (!entry.url) continue
      if (entry.hotkeyOverlay) {
        actions.push({
          shortcut: entry.hotkeyOverlay,
          keepModKeys: true,
          action: { type: 'trigger-event', target: hotkeyTarget(widget.wmId, entry.id, 'overlay') }
        })
      }
      if (entry.hotkeyExternal) {
        actions.push({
          shortcut: entry.hotkeyExternal,
          keepModKeys: true,
          action: { type: 'trigger-event', target: hotkeyTarget(widget.wmId, entry.id, 'external') }
        })
      }
    }
    return actions
  }
  if (widget.wmType === LAB_TYPE) {
    const lab = widget as LabWidget
    const actions: ShortcutAction[] = []
    if (lab.hotkeyOverlay) {
      actions.push({ shortcut: lab.hotkeyOverlay, keepModKeys: true, action: { type: 'trigger-event', target: labHotkeyTarget(widget.wmId, 'overlay') } })
    }
    if (lab.hotkeyExternal) {
      actions.push({ shortcut: lab.hotkeyExternal, keepModKeys: true, action: { type: 'trigger-event', target: labHotkeyTarget(widget.wmId, 'external') } })
    }
    return actions
  }
  if (widget.wmType === MAP_MODS_TYPE) {
    const mapMods = widget as MapModsWidget
    const actions: ShortcutAction[] = []
    if (mapMods.hotkey) {
      actions.push({ shortcut: mapMods.hotkey, action: { type: 'copy-item', target: MAP_MODS_TARGET, focusOverlay: true } })
    }
    if (mapMods.regexHotkey && mapMods.regexText) {
      actions.push({ shortcut: mapMods.regexHotkey, action: { type: 'stash-search', text: mapMods.regexText } })
    }
    return actions
  }
  if (widget.wmType === FARMING_TYPE) {
    const farming = widget as FarmingWidget
    if (!farming.lootHotkey) return []
    return [{ shortcut: farming.lootHotkey, action: { type: 'copy-item', target: FARMING_LOOT_TARGET } }]
  }
  if (widget.wmType === MAP_SCAN_TYPE) {
    const scan = widget as MapScanWidget
    if (!scan.hotkey) return []
    return [{ shortcut: scan.hotkey, keepModKeys: true, action: { type: 'trigger-event', target: scanHotkeyTarget(widget.wmId) } }]
  }
  if (widget.wmType === ESSENCE_SCAN_TYPE) {
    const scan = widget as EssenceScanWidget
    const out: ShortcutAction[] = []
    if (scan.hotkey) out.push({ shortcut: scan.hotkey, keepModKeys: true, action: { type: 'trigger-event', target: essenceHotkeyTarget(widget.wmId) } })
    if (scan.onceHotkey) out.push({ shortcut: scan.onceHotkey, keepModKeys: true, action: { type: 'trigger-event', target: essenceOnceTarget(widget.wmId) } })
    return out
  }
  if (widget.wmType === LOOT_FILTER_TYPE) {
    const lf = widget as LootFilterWidget
    const actions: ShortcutAction[] = []
    if (lf.sampleHotkey) {
      actions.push({ shortcut: lf.sampleHotkey, action: { type: 'copy-item', target: LOOT_FILTER_SAMPLE_TARGET, focusOverlay: true } })
    }
    if (lf.editorHotkey) {
      actions.push({ shortcut: lf.editorHotkey, keepModKeys: true, action: { type: 'trigger-event', target: editorHotkeyTarget(widget.wmId) } })
    }
    return actions
  }
  return []
}
