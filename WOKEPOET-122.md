---
id: WOKEPOET-122
title: 'Landing page: small credits section at the bottom'
status: Done
priority: None
effort: XS
assignee: unassigned
tags:
  - docs
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T02:55:34.668Z'
    comment: Created ticket.
    id: a-2026-11-06t02-55-34-668z
  - type: comment
    user: Agent
    comment: >-
      **Credits section is up as PR #211**
      (https://github.com/guybnd/woke-poe-trade/pull/211), read from the app's
      credits.ts. Checked with the docs build and headless Chromium at 1440 and
      375 wide. Waiting on CI, then merge. No other docs needed: the README
      keeps its own short credits.
    date: '2026-11-06T02:56:21.085Z'
    completionComment: true
    id: c-2026-11-06t02-56-21-085z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T02:56:21.085Z'
  - type: comment
    user: Agent
    comment: Credits section merged as 6ec885b. No other docs needed.
    completionComment: true
    date: '2026-11-06T03:03:36.214Z'
    id: c-2026-11-06t03-03-36-214z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T03:03:36.557Z'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/211'
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
> Small credits section at the bottom of the landing page, from the app's own list (renderer/src/web/woke/settings/credits.ts) so it can't drift.
