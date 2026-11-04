// Woke modules: personal tools layered on top of Awakened PoE Trade.
//
// Upstream files only call into this file (widget registry, settings window,
// host shortcuts), so merging upstream changes stays a small, predictable diff.
// To add a module: create `woke/<module>/`, then register its widget, settings
// editor below, its hotkeys in `shortcuts.ts`, and its switch in `modules.ts`.

import './shared/perf'
import './ui'
import AppearanceSettings from './ui/AppearanceSettings.vue'
import ModulesSettings from './switchboard/ModulesSettings.vue'
import OverlayExtras from './app/OverlayExtras.vue'
import PerfSettings from './ui/PerfSettings.vue'
import HotkeysSettings from './switchboard/HotkeysSettings.vue'
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
import WidgetRunTimer from './campaign/WidgetRunTimer.vue'
import RunTimerEditor from './campaign/run-timer-editor.vue'
import { RUN_TIMER_TYPE } from './campaign/run-timer'
import WidgetAtlas from './atlas/WidgetAtlas.vue'
import AtlasEditor from './atlas/atlas-editor.vue'
import { ATLAS_TYPE } from './atlas/widget'
import WidgetLab from './lab/WidgetLab.vue'
import LabEditor from './lab/lab-editor.vue'
import { LAB_TYPE } from './lab/lab'
import WidgetFarming from './farming/WidgetFarming.vue'
import FarmingEditor from './farming/farming-editor.vue'
import { FARMING_TYPE } from './farming/farming'
import WidgetMechanics from './mechanics/WidgetMechanics.vue'
import MechanicsEditor from './mechanics/mechanics-editor.vue'
import { MECHANICS_TYPE } from './mechanics/widget'
import WidgetMapMods from './map-mods/WidgetMapMods.vue'
import WidgetMapCheck from './map-mods/WidgetMapCheck.vue'
import MapModsEditor from './map-mods/map-mods-editor.vue'
import { MAP_MODS_TYPE } from './map-mods/widget'
import WidgetMapScan from './map-mods/WidgetMapScan.vue'
import MapScanEditor from './map-mods/map-scan-editor.vue'
import { MAP_SCAN_TYPE } from './map-mods/scan'
import WidgetEssenceScan from './essence-scan/WidgetEssenceScan.vue'
import EssenceScanEditor from './essence-scan/essence-scan-editor.vue'
import { ESSENCE_SCAN_TYPE } from './essence-scan/widget'
import WidgetLabGems from './lab-gems/WidgetLabGems.vue'
import WidgetLeagueInvest from './league-invest/WidgetLeagueInvest.vue'
import WidgetBossRuns from './boss-runs/WidgetBossRuns.vue'
import WidgetLootFilter from './loot-filter/WidgetLootFilter.vue'
import LootFilterEditor from './loot-filter/loot-filter-editor.vue'
import { LOOT_FILTER_TYPE } from './loot-filter/widget'

type WidgetComponent = Component & { widget: WidgetSpec }

export const wokeWidgets: WidgetComponent[] = [
  WidgetRegexLibrary as unknown as WidgetComponent,
  WidgetTradeSearches as unknown as WidgetComponent,
  WidgetMarketTracker as unknown as WidgetComponent,
  WidgetPobBuilds as unknown as WidgetComponent,
  WidgetCampaign as unknown as WidgetComponent,
  WidgetRunTimer as unknown as WidgetComponent,
  WidgetAtlas as unknown as WidgetComponent,
  WidgetLab as unknown as WidgetComponent,
  WidgetFarming as unknown as WidgetComponent,
  WidgetMechanics as unknown as WidgetComponent,
  WidgetMapMods as unknown as WidgetComponent,
  WidgetMapCheck as unknown as WidgetComponent,
  WidgetMapScan as unknown as WidgetComponent,
  WidgetEssenceScan as unknown as WidgetComponent,
  WidgetLabGems as unknown as WidgetComponent,
  WidgetLeagueInvest as unknown as WidgetComponent,
  WidgetBossRuns as unknown as WidgetComponent,
  WidgetLootFilter as unknown as WidgetComponent
]

const editors: Record<string, Component> = {
  [REGEX_LIBRARY_TYPE]: RegexLibraryEditor,
  [TRADE_SEARCHES_TYPE]: TradeSearchesEditor,
  [POB_BUILDS_TYPE]: PobBuildsEditor,
  [CAMPAIGN_TYPE]: CampaignEditor,
  [RUN_TIMER_TYPE]: RunTimerEditor,
  [ATLAS_TYPE]: AtlasEditor,
  [LAB_TYPE]: LabEditor,
  [MAP_MODS_TYPE]: MapModsEditor,
  [MAP_SCAN_TYPE]: MapScanEditor,
  [ESSENCE_SCAN_TYPE]: EssenceScanEditor,
  [MECHANICS_TYPE]: MechanicsEditor,
  [LOOT_FILTER_TYPE]: LootFilterEditor,
  [FARMING_TYPE]: FarmingEditor
}

export function wokeSettingsFor (wmType: string | undefined): Component | undefined {
  return wmType ? editors[wmType] : undefined
}

export { wokeShortcutsFor } from './shortcuts'

// Extra pages for APT's main settings window (shown next to "General").
export const wokeGeneralSettings: Component[] = [AppearanceSettings, ModulesSettings, HotkeysSettings, PerfSettings]

// Mounted once inside APT's overlay window: module setup card, update and crash notices.
export const WokeOverlay = OverlayExtras
