---
id: WOKEPOET-104
title: Redesign the price check filter header (C3)
status: Done
priority: Medium
effort: M
assignee: unassigned
tags:
  - ui
  - price-check
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:12:06.848Z'
    comment: Created ticket.
    id: a-2026-11-05t13-12-06-848z
  - type: activity
    user: Agent
    date: '2026-11-05T13:39:05.892Z'
    comment: Updated implementation link.
    id: a-2026-11-05t13-39-05-892z
  - type: comment
    user: Agent
    comment: >-
      **C3 header built as PR #188, queued for merge.** Title shows the search
      target with a Generic / Base switch, tiles change by scroll or drag, stat
      count and roll presets share one header. Adversarial review findings
      fixed. Lint, types, 2425 unit tests, build and the price-check,
      stat-columns, tab-rail and pob-builds e2e specs pass. No docs needed: no
      reference doc covers this panel. Not yet tried in the game. The
      coordinator is handling the dev build update.
    date: '2026-11-05T13:39:07.904Z'
    completionComment: true
    id: c-2026-11-05t13-39-07-904z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T13:39:07.904Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 03581e4 and running on the dev build. C3 header with scroll and
      drag on the tiles. No docs needed. Not yet tried in the game.
    completionComment: true
    date: '2026-11-05T13:49:46.957Z'
    id: c-2026-11-05t13-49-46-957z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T13:49:47.242Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/188'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
swimlane: null
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
> TL;DR: Guy picked C3 from the mocks. The title shows what's being searched, a Generic / Base switch changes it, Links and iLvl become tiles beside it, and Stats plus the roll presets become one header on the stat list.

Mocks: https://claude.ai/artifact/WPzs5hoFtYK7GSQKRAsKCZ (bottom row, C3)

- Title: category ("Body Armour") on Generic, base type ("Twilight Regalia") on Base. No rare name, no "Category:" prefix.
- Numeric filters become value tiles beside the title; on/off filters stay chips under it.
- Stats count, Pseudo / Base item tabs and Low/Approx/High/By value share one header row.
- "rough guess" becomes a ≈ on By value, with the source on hover.
