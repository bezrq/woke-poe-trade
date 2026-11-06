---
id: WOKEPOET-20
title: Open dynamic popups in the empty left area by default
status: Released
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:55:02.074Z'
    comment: Created ticket.
    id: a-2026-11-05t03-55-02-074z
  - type: activity
    user: Agent
    date: '2026-11-05T03:55:21.545Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-20-open-dynamic-popups-in-the-empty-left-area-by-default
    event: worktree-created
    id: a-2026-11-05t03-55-21-545z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T03:55:21.578Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t03-55-21-578z
  - type: comment
    user: Agent
    comment: >-
      **Dynamic panels now open at one spot on the left (tl 10%, 12%), below the
      tab bar and clear of Guy's far-left icon row.** Panels still exactly on
      their old default follow on config load; moved and minimized panels stay.
      HUD-style widgets keep their spots (campaign, run timer, mechanics, map
      mods, map and essence scan, trade whispers, map check, price check, item
      search). Tab bar "Reset position" now goes to the same spot. Adversarial
      review done; its one real bug (reset position re-migrated for boss runs)
      is fixed. Validation: vitest 206 passed, vue-tsc and eslint clean. No docs
      needed: no documented positions.
    date: '2026-11-05T04:01:15.126Z'
    completionComment: true
    id: c-2026-11-05t04-01-15-126z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/93'
    date: '2026-11-05T04:01:23.115Z'
    id: a-2026-11-05t04-01-23-115z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T04:01:23.115Z'
  - type: comment
    user: Agent
    comment: >-
      Dynamic panels open at tl 10%, 12%. Unmoved panels follow on load; moved
      and minimized ones stay; HUD widgets unchanged. Reset position uses the
      same spot, and the scarab flip panel is included. Local checks on
      f063c90b: vue-tsc clean, lint 0 errors, vitest 231 passed, vite build ok.
      GitHub CI not awaited, per Guy's rule that local checks plus review are
      enough. No docs needed.
    completionComment: true
    date: '2026-11-05T04:05:18.718Z'
    id: c-2026-11-05t04-05-18-718z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T04:05:18.921Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:49.293Z'
branch: flux/WOKEPOET-20-open-dynamic-popups-in-the-empty-left-area-by-default
baselineCommit: 7896e164a82865073f89df1ab235131664e8c4a4
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/93'
swimlane: null
diffSummary:
  - file: renderer/src/web/Config.ts
    additions: 3
    deletions: 0
  - file: renderer/src/web/woke/analytics/WidgetSessionAnalytics.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/atlas/WidgetAtlas.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/boss-runs/WidgetBossRuns.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/campaign/CampaignBuild.vue
    additions: 7
    deletions: 7
  - file: renderer/src/web/woke/challenges/WidgetChallenges.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/farming/WidgetFarming.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/lab-gems/WidgetLabGems.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/lab/WidgetLab.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/league-invest/WidgetLeagueInvest.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/loot-filter/build-input.ts
    additions: 4
    deletions: 3
  - file: renderer/src/web/woke/loot-filter/widget.ts
    additions: 3
    deletions: 2
  - file: renderer/src/web/woke/market/WidgetMarketTracker.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/pob-builds/BuildDetail.vue
    additions: 58
    deletions: 19
  - file: renderer/src/web/woke/pob-builds/BuildFitChip.vue
    additions: 4
    deletions: 3
  - file: renderer/src/web/woke/pob-builds/WidgetPobBuilds.vue
    additions: 3
    deletions: 1
  - file: renderer/src/web/woke/pob-builds/active.ts
    additions: 3
    deletions: 0
  - file: renderer/src/web/woke/pob-builds/build-model.ts
    additions: 43
    deletions: 16
  - file: renderer/src/web/woke/pob-builds/widget.ts
    additions: 10
    deletions: 0
  - file: renderer/src/web/woke/regex-library/WidgetRegexLibrary.vue
    additions: 3
    deletions: 2
  - file: renderer/src/web/woke/regex-library/apt-import.ts
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/regex-library/save.ts
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/scarab-flip/WidgetScarabFlip.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/tab-bar/TabBar.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/trade-searches/WidgetTradeSearches.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/ui/window-anchor.ts
    additions: 38
    deletions: 0
  - file: renderer/test/woke/pob-builds.test.ts
    additions: 71
    deletions: 1
  - file: renderer/test/woke/popup-spot.test.ts
    additions: 51
    deletions: 0
  - file: testing/e2e/pob-builds.spec.ts
    additions: 89
    deletions: 0
  - file: testing/fixtures/pob/Loadouts.xml
    additions: 43
    deletions: 0
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** Panels opened from the dock or tab bar (PoB builds and friends) open at one spot on the left, below the top bar. Panels the user already moved stay put.

## Plan
- One shared default spot for dynamic panels, in `woke/ui/window-anchor.ts`.
- Each dynamic panel's first-open default uses it.
- On config load, panels still sitting exactly at their old default move to the new spot. Moved or minimized panels are untouched.
- HUD-style widgets keep their spots: campaign, run timer, mechanics, map mods, map/essence scan, trade whispers, map check, price check.
