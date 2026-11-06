---
id: WOKEPOET-114
title: 'Flips: show profit per item, not per recipe'
status: Released
priority: None
effort: XS
assignee: Agent
tags:
  - feature
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T14:30:23.835Z'
    comment: Created ticket.
    id: a-2026-11-05t14-30-23-835z
  - type: activity
    user: Agent
    date: '2026-11-05T14:39:23.142Z'
    comment: Updated implementation link.
    id: a-2026-11-05t14-39-23-142z
  - type: comment
    user: Agent
    comment: >-
      PR 196 is reviewed and sent to merge at 25d59be8. Flips shows Profit each
      everywhere, and the dock ranks on the same number. Unit tests and flips
      e2e pass; not checked in the real app.
    date: '2026-11-05T14:39:24.755Z'
    completionComment: true
    id: c-2026-11-05t14-39-24-755z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T14:39:24.755Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 9ba41ca, per the coordinator. The Client.txt thread's dev
      restart covers it.
    completionComment: true
    date: '2026-11-05T14:54:10.193Z'
    id: c-2026-11-05t14-54-10-193z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T14:54:10.491Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:46.938Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/196'
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
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** Guy asked why profit is shown per recipe when the price beside it is per scarab. Show profit per item you put in, so it matches the price and all tabs compare the same way.

Display only: the ranking and Max profit / day don't change. The stash outlines (WOKEPOET-110) use the same number.
