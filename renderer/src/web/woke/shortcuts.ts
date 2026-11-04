// Kept free of Vue component imports: Config.ts imports this file,
// and components import Config.ts.
import type { ShortcutAction } from '@ipc/types'
import type { Widget } from '@/web/overlay/widgets'
import { REGEX_LIBRARY_TYPE } from './regex-library/widget'
import type { RegexLibraryWidget } from './regex-library/widget'
import { TRADE_SEARCHES_TYPE, hotkeyTarget } from './trade-searches/widget'
import type { TradeSearchesWidget } from './trade-searches/widget'

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
  return []
}
