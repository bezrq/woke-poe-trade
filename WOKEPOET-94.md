---
id: WOKEPOET-94
title: 'Lab: layout window collapses to a hover bubble when interact mode ends'
status: Done
priority: Medium
effort: None
assignee: unassigned
tags:
  - ui
  - mocks
  - woke
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T11:07:37.474Z'
    comment: Created ticket.
    id: a-2026-11-05t11-07-37-474z
  - type: activity
    user: Agent
    date: '2026-11-05T11:10:35.748Z'
    comment: Updated description.
    id: a-2026-11-05t11-10-35-748z
  - type: comment
    user: Agent
    comment: >-
      Which bubble: A letter icon (recommended), B named pill, or C map
      thumbnail? Mocks: https://claude.ai/artifact/7fPodiRCXymABQDG8tk7H1
    date: '2026-11-05T11:10:35.787Z'
    id: c-2026-11-05t11-10-35-787z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T11:10:35.787Z'
    comment: >-
      Which bubble: A letter icon (recommended), B named pill, or C map
      thumbnail? Mocks: https://claude.ai/artifact/7fPodiRCXymABQDG8tk7H1
  - type: comment
    user: Agent
    comment: 'Guy picked A, the letter icon in the dock row.'
    date: '2026-11-05T11:12:16.269Z'
    id: c-2026-11-05t11-12-16-269z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T11:12:16.269Z'
    comment: 'Guy picked A, the letter icon in the dock row.'
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T11:13:13.160Z'
  - type: activity
    user: Agent
    date: '2026-11-05T11:32:23.773Z'
    comment: Updated implementation link.
    id: a-2026-11-05t11-32-23-773z
  - type: comment
    user: Agent
    comment: >-
      **Option A built in PR #165** from clone E:\Git\woke-lab-bubble. The
      layout window leaves with the overlay, and a dock icon shows a 45rem map
      on hover. Five review findings fixed; typecheck, lint, 2,086 unit tests,
      build and e2e pass. Not yet run against real poelab in Electron. Next:
      merge, then update the dev build. No docs needed: the README line stays
      accurate.
    date: '2026-11-05T11:32:25.899Z'
    completionComment: true
    id: c-2026-11-05t11-32-25-899z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T11:32:25.899Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 1dedcef3 and live on the dev copy at 0aaae7a3. The layout window
      leaves with the overlay, and a dock icon shows a 45rem map on hover. Not
      yet exercised against real poelab in Electron. No docs needed.
    completionComment: true
    date: '2026-11-05T11:58:18.071Z'
    id: c-2026-11-05t11-58-18-071z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T11:58:18.401Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/165'
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
diffSummary:
  - file: docs/.vitepress/theme/landing/Landing.vue
    additions: 363
    deletions: 131
  - file: docs/.vitepress/theme/landing/content.js
    additions: 65
    deletions: 23
  - file: docs/public/shots/hero.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/readme-banner.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-essence.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-loot.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-maps.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-price.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-boss-runs.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-boss.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-campaign-chip.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-campaign.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-filter-prices.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-filter-rules.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-map-mods.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-market.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-pob.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-regex.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-trade.webp
    additions: 0
    deletions: 0
  - file: testing/e2e/landing-shots.spec.ts
    additions: 211
    deletions: 4
---
> **TL;DR** The poelab layout window stays on screen after you leave Shift+Space. It should go away with interact mode and leave a small bubble that shows a mid-size map on hover.

## Cause
`WidgetLab.vue` turns off `invisible-on-blur` while a layout is open (`watch(openDiff, ...)`), so an opened layout outlives the overlay. The dock icon only shows in the lab zone (`:show="inLab"`) and its card only reads the plaza layout (`peekImg`), never the one you opened.

## Plan (no code until Guy picks)
Mocks: https://claude.ai/artifact/7fPodiRCXymABQDG8tk7H1 (A letter icon, recommended; B named pill; C map thumbnail bubble).

- Keep `invisible-on-blur` on always; the window returns when the overlay reopens.
- Show the bubble while a layout is open or in the lab; the card shows the opened layout.
- The bubble ends when you close the layout, when you leave the lab, or at the midnight UTC reset.
- The layout hotkey outside the overlay holds the card open until pressed again (existing `togglePin`), instead of the full window.

Related: WOKEPOET-87 changes how difficulty is detected in the same file.
