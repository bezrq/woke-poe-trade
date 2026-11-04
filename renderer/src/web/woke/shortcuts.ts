// Kept free of Vue component imports: Config.ts imports this file,
// and components import Config.ts.
import type { ShortcutAction } from '@ipc/types'
import type { Widget } from '@/web/overlay/widgets'
import { REGEX_LIBRARY_TYPE } from './regex-library/widget'
import type { RegexLibraryWidget } from './regex-library/widget'
import { TRADE_SEARCHES_TYPE, hotkeyTarget } from './trade-searches/widget'
import type { TradeSearchesWidget } from './trade-searches/widget'
import { LAB_TYPE, hotkeyTarget as labHotkeyTarget } from './lab/lab'
import type { LabWidget } from './lab/lab'
import { MAP_MODS_TYPE, MAP_MODS_TARGET } from './map-mods/widget'
import type { MapModsWidget } from './map-mods/widget'
import { MAP_SCAN_TYPE, scanHotkeyTarget } from './map-mods/scan'
import type { MapScanWidget } from './map-mods/scan'
import { ESSENCE_SCAN_TYPE, essenceHotkeyTarget } from './essence-scan/widget'
import type { EssenceScanWidget } from './essence-scan/widget'

export function wokeShortcutsFor (widget: Widget): ShortcutAction[] {
  if (widget.wmType === REGEX_LIBRARY_TYPE) {
    const lib = widget as RegexLibraryWidget
    if (!lib.enableHotkeys) return []
    return lib.entries
      .filter(entry => entry.hotkey && entry.text)
      .map(entry => ({
        shortcut: entry.hotkey!,
        action: { type: 'stash-search', text: entry.text }
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
  if (widget.wmType === MAP_SCAN_TYPE) {
    const scan = widget as MapScanWidget
    if (!scan.hotkey) return []
    return [{ shortcut: scan.hotkey, keepModKeys: true, action: { type: 'trigger-event', target: scanHotkeyTarget(widget.wmId) } }]
  }
  if (widget.wmType === ESSENCE_SCAN_TYPE) {
    const scan = widget as EssenceScanWidget
    if (!scan.hotkey) return []
    return [{ shortcut: scan.hotkey, keepModKeys: true, action: { type: 'trigger-event', target: essenceHotkeyTarget(widget.wmId) } }]
  }
  return []
}
