// Woke modules: personal tools layered on top of Awakened PoE Trade.
//
// Upstream files only call into this file (widget registry, settings window,
// host shortcuts), so merging upstream changes stays a small, predictable diff.
// To add a module: create `woke/<module>/`, then register its widget, settings
// editor below, and its hotkeys in `shortcuts.ts`.

import type { Component } from 'vue'
import type { WidgetSpec } from '@/web/overlay/interfaces'

import WidgetRegexLibrary from './regex-library/WidgetRegexLibrary.vue'
import RegexLibraryEditor from './regex-library/regex-library-editor.vue'
import { REGEX_LIBRARY_TYPE } from './regex-library/widget'
import WidgetTradeSearches from './trade-searches/WidgetTradeSearches.vue'
import TradeSearchesEditor from './trade-searches/trade-searches-editor.vue'
import { TRADE_SEARCHES_TYPE } from './trade-searches/widget'
import WidgetMarketTracker from './market/WidgetMarketTracker.vue'
import WidgetLabGems from './lab-gems/WidgetLabGems.vue'
import WidgetLeagueInvest from './league-invest/WidgetLeagueInvest.vue'

type WidgetComponent = Component & { widget: WidgetSpec }

export const wokeWidgets: WidgetComponent[] = [
  WidgetRegexLibrary as unknown as WidgetComponent,
  WidgetTradeSearches as unknown as WidgetComponent,
  WidgetMarketTracker as unknown as WidgetComponent,
  WidgetLabGems as unknown as WidgetComponent,
  WidgetLeagueInvest as unknown as WidgetComponent
]

const editors: Record<string, Component> = {
  [REGEX_LIBRARY_TYPE]: RegexLibraryEditor,
  [TRADE_SEARCHES_TYPE]: TradeSearchesEditor
}

export function wokeSettingsFor (wmType: string | undefined): Component | undefined {
  return wmType ? editors[wmType] : undefined
}

export { wokeShortcutsFor } from './shortcuts'
