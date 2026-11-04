// Woke modules: personal tools layered on top of Awakened PoE Trade.
//
// Upstream files only call into this file (widget registry, settings window,
// host shortcuts), so merging upstream changes stays a small, predictable diff.
// To add a module: create `woke/<module>/`, then register its widget, settings
// editor below, and its hotkeys in `shortcuts.ts`.

import './ui'
import AppearanceSettings from './ui/AppearanceSettings.vue'
import type { Component } from 'vue'
import type { WidgetSpec } from '@/web/overlay/interfaces'

import WidgetRegexLibrary from './regex-library/WidgetRegexLibrary.vue'
import RegexLibraryEditor from './regex-library/regex-library-editor.vue'
import { REGEX_LIBRARY_TYPE } from './regex-library/widget'
import WidgetTradeSearches from './trade-searches/WidgetTradeSearches.vue'
import TradeSearchesEditor from './trade-searches/trade-searches-editor.vue'
import { TRADE_SEARCHES_TYPE } from './trade-searches/widget'
import WidgetMarketTracker from './market/WidgetMarketTracker.vue'
import WidgetPobBuilds from './pob-builds/WidgetPobBuilds.vue'
import PobBuildsEditor from './pob-builds/pob-builds-editor.vue'
import { POB_BUILDS_TYPE } from './pob-builds/widget'
import WidgetCampaign from './campaign/WidgetCampaign.vue'
import CampaignEditor from './campaign/campaign-editor.vue'
import { CAMPAIGN_TYPE } from './campaign/widget'
import WidgetAtlas from './atlas/WidgetAtlas.vue'
import AtlasEditor from './atlas/atlas-editor.vue'
import { ATLAS_TYPE } from './atlas/widget'
import WidgetLab from './lab/WidgetLab.vue'
import LabEditor from './lab/lab-editor.vue'
import { LAB_TYPE } from './lab/lab'
import WidgetFarming from './farming/WidgetFarming.vue'

type WidgetComponent = Component & { widget: WidgetSpec }

export const wokeWidgets: WidgetComponent[] = [
  WidgetRegexLibrary as unknown as WidgetComponent,
  WidgetTradeSearches as unknown as WidgetComponent,
  WidgetMarketTracker as unknown as WidgetComponent,
  WidgetPobBuilds as unknown as WidgetComponent,
  WidgetCampaign as unknown as WidgetComponent,
  WidgetAtlas as unknown as WidgetComponent,
  WidgetLab as unknown as WidgetComponent,
  WidgetFarming as unknown as WidgetComponent
]

const editors: Record<string, Component> = {
  [REGEX_LIBRARY_TYPE]: RegexLibraryEditor,
  [TRADE_SEARCHES_TYPE]: TradeSearchesEditor,
  [POB_BUILDS_TYPE]: PobBuildsEditor,
  [CAMPAIGN_TYPE]: CampaignEditor,
  [ATLAS_TYPE]: AtlasEditor,
  [LAB_TYPE]: LabEditor
}

export function wokeSettingsFor (wmType: string | undefined): Component | undefined {
  return wmType ? editors[wmType] : undefined
}

export { wokeShortcutsFor } from './shortcuts'

// Extra pages for APT's main settings window (shown next to "General").
export const wokeGeneralSettings: Component[] = [AppearanceSettings]
