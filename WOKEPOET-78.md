---
id: WOKEPOET-78
title: Item tooltip wherever an item name appears
status: Released
priority: Medium
effort: None
assignee: unassigned
tags:
  - feature
  - ui
  - search
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:24:16.319Z'
    comment: Created ticket.
    id: a-2026-11-05t10-24-16-319z
  - type: activity
    user: Agent
    date: '2026-11-05T10:28:08.356Z'
    comment: Updated description.
    id: a-2026-11-05t10-28-08-356z
  - type: comment
    user: Agent
    comment: >-
      Pick for search: A hover only (recommended) or B hover plus a card in the
      right pane? Also confirm the module list on the mock's Where it goes
      board. https://claude.ai/artifact/RkNAKrzGgZqAEKv7bXMmSz
    date: '2026-11-05T10:28:09.069Z'
    id: c-2026-11-05t10-28-09-069z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T10:28:09.069Z'
    comment: >-
      Pick for search: A hover only (recommended) or B hover plus a card in the
      right pane? Also confirm the module list on the mock's Where it goes
      board. https://claude.ai/artifact/RkNAKrzGgZqAEKv7bXMmSz
  - type: comment
    user: Agent
    comment: Guy picked A (hover only) and all 13 modules.
    date: '2026-11-05T10:41:30.598Z'
    id: c-2026-11-05t10-41-30-598z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T10:41:30.598Z'
    comment: Guy picked A (hover only) and all 13 modules.
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T10:41:30.652Z'
  - type: activity
    user: Agent
    date: '2026-11-05T11:04:22.811Z'
    comment: Updated implementation link.
    id: a-2026-11-05t11-04-22-811z
  - type: comment
    user: Agent
    comment: >-
      PR #154: tooltips on all picked modules, long mod pools folded, review
      findings fixed, local checks pass. Waiting on merge. Known limit: the data
      can't mark fixed mods, so one can land past the first 6.
    date: '2026-11-05T11:04:24.055Z'
    completionComment: true
    id: c-2026-11-05t11-04-24-055z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T11:04:24.055Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 92aaf421 and live in the dev copy. Tooltips on search and the
      other picked modules, long mod pools folded. Open idea: Path of Building's
      unique lists may mark fixed vs random mods; offered to Guy, not checked.
    completionComment: true
    date: '2026-11-05T11:46:31.040Z'
    id: c-2026-11-05t11-46-31-040z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T11:46:33.679Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.751Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/154'
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
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
Guy's report: hovering results in universal search (Alt+P), such as Dying Sun, shows no item tooltip. He wants the shared v-item-tip on item names across modules.

Mocks and full audit: https://claude.ai/artifact/RkNAKrzGgZqAEKv7bXMmSz

Search options: A hover only (recommended); B hover plus the item as a card in the right pane, which also follows the arrow keys.

Adding: Search (results, Other items, pins), Market (multi-price header, alert card), Trade offers, Trade search live results, Scarab flip, Lab gems, Mechanics scarabs and Best line, Essence scan, Boss runs, Session analytics "before the first map", filter tier icons, Campaign gems, Price check unidentified picker, old item search.

Build notes: scarab and essence rows shorten names, so pass the full name. Trade whispers join name and base, so split them (same word walk as artFor in WidgetTrade.vue); rare falls back to base. Multi-price rows show the range in the strip. Search's "Other items" should use refName for non-English clients.

Left out: item in hand, filter preview labels, non-items. Build panel keeps its own tooltip. 1,140 of 4,831 priced names have no text and show name and price only.

No code until Guy picks.
