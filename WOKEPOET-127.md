---
id: WOKEPOET-127
title: Death recap with the map mods you died to
status: Released
priority: Medium
effort: M
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-06T03:51:11.514Z'
    comment: Created ticket.
    id: a-2026-11-06t03-51-11-514z
  - type: comment
    user: Agent
    comment: >-
      Which mock: A skull icon with hover card, B inside Session analytics, or C
      death log panel? Recommended A with C's log behind it. Mocks:
      https://claude.ai/artifact/JXbbkg2garWvFVaXgAH9hv
    date: '2026-11-06T03:53:43.850Z'
    id: c-2026-11-06t03-53-43-850z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T03:53:43.850Z'
    comment: >-
      Which mock: A skull icon with hover card, B inside Session analytics, or C
      death log panel? Recommended A with C's log behind it. Mocks:
      https://claude.ai/artifact/JXbbkg2garWvFVaXgAH9hv
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T04:42:21.406Z'
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-06T04:42:21.406Z'
  - type: comment
    user: Agent
    comment: >-
      PR #220 merged as 81896ce. Skull icon, hover card, death log panel. Not
      yet seen on a real death in game.
    date: '2026-11-06T05:25:54.217Z'
    completionComment: true
    id: c-2026-11-06t05-25-54-217z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T05:25:54.217Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 81896ce: skull dock icon after a death, hover card, death log
      panel with Mods you die to. Mods come from item checks before opening; OCR
      on entering is WOKEPOET-132. README module table updated; no other docs
      needed. Not yet seen on a real death in game.
    completionComment: true
    date: '2026-11-06T05:28:24.713Z'
    id: c-2026-11-06t05-28-24-713z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T05:28:25.000Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:46.260Z'
swimlane: null
needsAction: null
subtasks:
  - WOKEPOET-132
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/220'
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
Guy: "Death recap is cool to maybe have a reference of what map mods you died to if that's possible to easily save."

Checked against the real Client.txt (1,773 deaths since Aug 2024, 1,426 in maps): the log gives time, character, area, level, seed, and speech before the death. It never gives the killer, damage or map mods. Mods only come from an Alt+M check or map scan before the map opens, matched by name and level, so same-name maps can match wrongly.

Mocks first, no code until Guy picks. Nothing permanently on screen.
