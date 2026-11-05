---
id: WOKEPOET-71
title: >-
  Boss runs icon in league boss arenas (Settlers, Infinite Hunger, Black Star,
  Saresh, King in the Mists)
status: Done
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:23:47.790Z'
    comment: Created ticket.
    id: a-2026-11-05t08-23-47-790z
  - type: activity
    user: Agent
    date: '2026-11-05T08:23:54.643Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-71-boss-runs-icon-in-league-boss-arenas-settlers-infinite-hunge
    event: worktree-created
    id: a-2026-11-05t08-23-54-643z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T08:23:54.678Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t08-23-54-678z
  - type: status_change
    from: Todo
    to: In Progress
    user: claude-code@guy-pc
    date: '2026-11-05T08:23:54.679Z'
  - type: comment
    user: Agent
    comment: >-
      **The Boss runs icon now appears in league boss arenas.** Added Infinite
      Hunger, Black Star, Saresh, King in the Mists, Sasan, Lazeth and Black
      Knight. Lazeth has no known drops. Checked: typecheck, lint, unit tests,
      build; reviewed in-session, data-only change. No docs needed.
    date: '2026-11-05T08:28:02.290Z'
    completionComment: true
    id: c-2026-11-05t08-28-02-290z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/130'
    date: '2026-11-05T08:28:10.119Z'
    id: a-2026-11-05t08-28-10-119z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T08:28:10.119Z'
  - type: comment
    user: Agent
    comment: >-
      Boss runs icon shows in league boss arenas. Checks pass locally. No docs
      needed.
    completionComment: true
    date: '2026-11-05T08:28:33.155Z'
    id: c-2026-11-05t08-28-33-155z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T08:28:33.397Z'
  - type: activity
    user: Agent
    date: '2026-11-05T08:28:41.029Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-28-41-029z
branch: flux/WOKEPOET-71-boss-runs-icon-in-league-boss-arenas-settlers-infinite-hunge
baselineCommit: eda80ec72b532f1879d64506c752d70b8d143fc8
needsAction: null
reviewState: approved
lastReviewedCommit: ca35654356205917de940c9e866f33c3003c19ff
lastReviewVerdict: approved
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/130'
swimlane: null
diffSummary:
  - file: ipc/types.ts
    additions: 8
    deletions: 0
  - file: main/src/windowing/OverlayWindow.ts
    additions: 19
    deletions: 1
  - file: main/src/woke/hover.ts
    additions: 4
    deletions: 0
  - file: main/src/woke/neversink.ts
    additions: 22
    deletions: 6
  - file: renderer/public/data/en/app_i18n.json
    additions: 1
    deletions: 0
  - file: renderer/src/web/Config.ts
    additions: 16
    deletions: 3
  - file: renderer/src/web/item-check/WidgetItemCheck.vue
    additions: 45
    deletions: 2
  - file: renderer/src/web/item-check/hotkeyable-actions.ts
    additions: 35
    deletions: 20
  - file: renderer/src/web/item-check/settings-item-check.vue
    additions: 4
    deletions: 0
  - file: renderer/src/web/item-check/widget.ts
    additions: 3
    deletions: 0
  - file: renderer/src/web/overlay/WidgetMenu.vue
    additions: 5
    deletions: 8
  - file: renderer/src/web/price-check/CheckedItem.vue
    additions: 18
    deletions: 6
  - file: renderer/src/web/price-check/filters/FilterModifier.vue
    additions: 15
    deletions: 5
  - file: renderer/src/web/price-check/filters/FilterName.vue
    additions: 53
    deletions: 19
  - file: renderer/src/web/price-check/filters/FiltersBlock.vue
    additions: 1
    deletions: 0
  - file: renderer/src/web/price-check/related-items/RelatedItems.vue
    additions: 69
    deletions: 38
  - file: renderer/src/web/price-check/trade/TradeBulk.vue
    additions: 4
    deletions: 5
  - file: renderer/src/web/price-check/trade/TradeListing.vue
    additions: 28
    deletions: 24
  - file: renderer/src/web/price-check/trends/PriceTrend.vue
    additions: 57
    deletions: 39
  - file: renderer/src/web/ui/StatRollSlider.vue
    additions: 66
    deletions: 42
  - file: renderer/src/web/woke/boss-runs/bosses.ts
    additions: 75
    deletions: 0
  - file: renderer/src/web/woke/campaign/WidgetCampaign.vue
    additions: 118
    deletions: 161
  - file: renderer/src/web/woke/campaign/WidgetRunTimer.vue
    additions: 10
    deletions: 6
  - file: renderer/src/web/woke/campaign/campaign-editor.vue
    additions: 16
    deletions: 5
  - file: renderer/src/web/woke/campaign/pins.ts
    additions: 87
    deletions: 0
  - file: renderer/src/web/woke/campaign/route-parse.ts
    additions: 8
    deletions: 0
  - file: renderer/src/web/woke/campaign/widget.ts
    additions: 17
    deletions: 6
  - file: renderer/src/web/woke/dock/Dock.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/dock/DockIcon.vue
    additions: 35
    deletions: 7
  - file: renderer/src/web/woke/dock/DockItem.vue
    additions: 22
    deletions: 4
  - file: renderer/src/web/woke/dock/dock.ts
    additions: 15
    deletions: 3
  - file: renderer/src/web/woke/item-lookup/ItemLookup.vue
    additions: 217
    deletions: 0
  - file: renderer/src/web/woke/item-lookup/lookup.ts
    additions: 128
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/AddItemField.vue
    additions: 102
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/FilterEditor.vue
    additions: 208
    deletions: 27
  - file: renderer/src/web/woke/loot-filter/FilterVerdictChip.vue
    additions: 2
    deletions: 2
  - file: renderer/src/web/woke/loot-filter/LabelPreview.vue
    additions: 1
    deletions: 2
  - file: renderer/src/web/woke/loot-filter/NeverSinkTab.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/loot-filter/PreviewTab.vue
    additions: 2
    deletions: 2
  - file: renderer/src/web/woke/loot-filter/PricesTab.vue
    additions: 248
    deletions: 49
  - file: renderer/src/web/woke/loot-filter/RuleBuilder.vue
    additions: 10
    deletions: 1
  - file: renderer/src/web/woke/loot-filter/SampleCard.vue
    additions: 7
    deletions: 6
  - file: renderer/src/web/woke/loot-filter/StyleEditor.vue
    additions: 107
    deletions: 15
  - file: renderer/src/web/woke/loot-filter/WidgetLootFilter.vue
    additions: 80
    deletions: 16
  - file: renderer/src/web/woke/loot-filter/economy.ts
    additions: 107
    deletions: 27
  - file: renderer/src/web/woke/loot-filter/edits.ts
    additions: 23
    deletions: 6
  - file: renderer/src/web/woke/loot-filter/groups.ts
    additions: 60
    deletions: 2
  - file: renderer/src/web/woke/loot-filter/health.ts
    additions: 71
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/label-style.ts
    additions: 21
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/match.ts
    additions: 26
    deletions: 3
  - file: renderer/src/web/woke/loot-filter/names.ts
    additions: 110
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/notices.ts
    additions: 49
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/parse.ts
    additions: 5
    deletions: 3
  - file: renderer/src/web/woke/loot-filter/presets.ts
    additions: 19
    deletions: 14
  - file: renderer/src/web/woke/loot-filter/prices.ts
    additions: 13
    deletions: 2
  - file: renderer/src/web/woke/loot-filter/safety.ts
    additions: 189
    deletions: 35
  - file: renderer/src/web/woke/loot-filter/store.ts
    additions: 269
    deletions: 33
  - file: renderer/src/web/woke/loot-filter/timeline.ts
    additions: 194
    deletions: 0
  - file: renderer/src/web/woke/loot-filter/widget.ts
    additions: 27
    deletions: 0
  - file: renderer/src/web/woke/modules.ts
    additions: 3
    deletions: 1
  - file: renderer/src/web/woke/price-insight/PriceDrivers.vue
    additions: 4
    deletions: 5
  - file: renderer/src/web/woke/price-insight/PriceHistoryChart.vue
    additions: 4
    deletions: 0
  - file: renderer/src/web/woke/price-insight/PriceRail.vue
    additions: 42
    deletions: 0
  - file: renderer/src/web/woke/price-insight/PriceStrip.vue
    additions: 0
    deletions: 140
  - file: renderer/src/web/woke/price-insight/PriceVerdict.vue
    additions: 164
    deletions: 125
  - file: renderer/src/web/woke/price-insight/RollPick.vue
    additions: 40
    deletions: 0
  - file: renderer/src/web/woke/price-insight/RollPresets.vue
    additions: 7
    deletions: 11
  - file: renderer/src/web/woke/price-insight/insight.ts
    additions: 29
    deletions: 8
  - file: renderer/src/web/woke/price-insight/listing-rows.ts
    additions: 5
    deletions: 1
  - file: renderer/src/web/woke/price-insight/price-table.css
    additions: 21
    deletions: 0
  - file: renderer/src/web/woke/price-insight/rail.ts
    additions: 67
    deletions: 0
  - file: renderer/src/web/woke/price-insight/roll-presets.ts
    additions: 45
    deletions: 12
  - file: renderer/src/web/woke/price-insight/sources.ts
    additions: 2
    deletions: 22
  - file: renderer/src/web/woke/settings/hotkey-fields.ts
    additions: 1
    deletions: 1
  - file: renderer/src/web/woke/shared/boss-areas.ts
    additions: 8
    deletions: 5
  - file: renderer/src/web/woke/switchboard/hotkey-health.ts
    additions: 1
    deletions: 1
  - file: renderer/src/web/woke/tab-bar/TabBar.vue
    additions: 367
    deletions: 198
  - file: renderer/src/web/woke/tab-bar/ToolIcon.vue
    additions: 19
    deletions: 0
  - file: renderer/src/web/woke/tab-bar/tools.ts
    additions: 70
    deletions: 2
  - file: renderer/src/web/woke/ui/OverlayLayer.vue
    additions: 5
    deletions: 1
  - file: renderer/src/web/woke/ui/WTabs.vue
    additions: 1
    deletions: 1
  - file: renderer/src/web/woke/ui/layer.ts
    additions: 10
    deletions: 0
  - file: renderer/src/web/woke/ui/theme.css
    additions: 26
    deletions: 0
  - file: renderer/src/web/woke/ui/window-anchor.ts
    additions: 2
    deletions: 2
  - file: renderer/test/woke/boss-runs-card.test.ts
    additions: 2
    deletions: 2
  - file: renderer/test/woke/campaign-pins.test.ts
    additions: 72
    deletions: 0
  - file: renderer/test/woke/economy.test.ts
    additions: 2
    deletions: 1
  - file: renderer/test/woke/filter-flows.test.ts
    additions: 111
    deletions: 3
  - file: renderer/test/woke/filter-health.test.ts
    additions: 169
    deletions: 0
  - file: renderer/test/woke/filter-names.test.ts
    additions: 166
    deletions: 0
  - file: renderer/test/woke/filter-net.test.ts
    additions: 198
    deletions: 0
  - file: renderer/test/woke/filter-preview.test.ts
    additions: 4
    deletions: 4
  - file: renderer/test/woke/filter-price-flows.test.ts
    additions: 504
    deletions: 0
  - file: renderer/test/woke/filter-timeline.test.ts
    additions: 221
    deletions: 0
  - file: renderer/test/woke/game-log.test.ts
    additions: 44
    deletions: 3
  - file: renderer/test/woke/insight-old-listings.test.ts
    additions: 95
    deletions: 0
  - file: renderer/test/woke/item-lookup.test.ts
    additions: 122
    deletions: 0
  - file: renderer/test/woke/listing-rows.test.ts
    additions: 2
    deletions: 2
  - file: renderer/test/woke/price-rail.test.ts
    additions: 48
    deletions: 0
  - file: renderer/test/woke/tab-rail.test.ts
    additions: 99
    deletions: 0
  - file: testing/e2e/campaign.spec.ts
    additions: 65
    deletions: 9
  - file: testing/e2e/loot-filter.spec.ts
    additions: 130
    deletions: 5
  - file: testing/e2e/pob-builds.spec.ts
    additions: 2
    deletions: 1
  - file: testing/e2e/price-check.spec.ts
    additions: 4
    deletions: 3
  - file: testing/e2e/tab-rail.spec.ts
    additions: 217
    deletions: 0
  - file: testing/e2e/toolkit.spec.ts
    additions: 3
    deletions: 2
  - file: >-
      testing/fixtures/http/poe.ninja/poe1/api/economy/current/dense/overviews.json
    additions: 1
    deletions: 1
  - file: testing/main/neversink-release.test.ts
    additions: 36
    deletions: 0
---
> **TL;DR:** Guy got no boss drops icon in a Settlers arena (Lazeth, Sailor's Folly, `SettlersBossPirateCove`). Add league boss arenas seen in his Client.txt to the Boss runs list, with drops from poedb.
