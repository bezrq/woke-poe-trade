---
id: WOKEPOET-128
title: 'Drop counter: tracked items with +1 and a maps-run count'
status: Released
priority: None
effort: None
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-06T03:53:16.184Z'
    comment: Created ticket.
    id: a-2026-11-06t03-53-16-184z
  - type: comment
    user: Agent
    comment: >-
      Which option: A tally card (recommended), B icon strip or C scoreboard?
      Mocks: https://claude.ai/artifact/SWjWD1MN7wBPLxiVVh3Pcy. Default unless
      told otherwise: counts run until reset.
    date: '2026-11-06T03:53:34.577Z'
    id: c-2026-11-06t03-53-34-577z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T03:53:34.577Z'
    comment: >-
      Which option: A tally card (recommended), B icon strip or C scoreboard?
      Mocks: https://claude.ai/artifact/SWjWD1MN7wBPLxiVVh3Pcy. Default unless
      told otherwise: counts run until reset.
  - type: comment
    user: Agent
    comment: >-
      Guy likes A and B: A default, B by setting, plus hover key for +1. No
      automatic pickup: Client.txt doesn't log them.
    date: '2026-11-06T04:37:23.686Z'
    id: c-2026-11-06t04-37-23-686z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T04:37:23.686Z'
    comment: >-
      Guy likes A and B: A default, B by setting, plus hover key for +1. No
      automatic pickup: Client.txt doesn't log them.
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-06T04:37:24.188Z'
  - type: comment
    user: Agent
    comment: >-
      PR #222 up: https://github.com/guybnd/woke-poe-trade/pull/222. Review
      findings fixed, local checks pass, merge requested. Right-click and hotkey
      untested in real PoE.
    date: '2026-11-06T05:08:53.725Z'
    completionComment: true
    id: c-2026-11-06t05-08-53-725z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T05:08:53.725Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 485dd1b: Drop counter with list and strip cards, maps counted
      from Client.txt, +1 key on the hovered item. Right-click and the key are
      untested in real PoE.
    completionComment: true
    date: '2026-11-06T05:18:33.335Z'
    id: c-2026-11-06t05-18-33-335z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T05:18:33.616Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:46.284Z'
swimlane: null
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/222'
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
Streamer-style counter: freeform list of items added from a search bar, quick +1 on each, and a maps-run count. Nothing permanently on screen, so it lives on a dock hover icon.

Mocks: https://claude.ai/artifact/SWjWD1MN7wBPLxiVVh3Pcy

Plan once picked: new woke module and widget with a DockItem, maps counted with isMapArea + countNewMap as Farming does, items searched through usePriceIndex plus any text, adding calls openOverlay since keys reach the game while the card is up. Awaiting Guy's pick of A, B or C.
