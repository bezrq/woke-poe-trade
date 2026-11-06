---
id: WOKEPOET-144
title: 'Landing page: retake shots against latest master'
status: Done
priority: None
effort: S
assignee: unassigned
tags:
  - docs
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T10:21:01.544Z'
    comment: Created ticket.
    id: a-2026-11-06t10-21-01-544z
  - type: comment
    user: Agent
    comment: >-
      **New tagline is up as PR #243**
      (https://github.com/guybnd/woke-poe-trade/pull/243). All shots were
      retaken from master and none are stale except the tree (#242) and listing
      tooltip (other thread). Waiting on CI, then merge. Public build follows
      once #240, #241 and #242 settle. Docs: README banner and alt text updated.
    date: '2026-11-06T10:26:08.150Z'
    completionComment: true
    id: c-2026-11-06t10-26-08-150z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T10:26:08.150Z'
  - type: comment
    user: Agent
    comment: >-
      Both taglines merged as 6d16efb. Docs: README banner and alt text updated.
      The public build follows once #242 lands, with a tree shot retake if #242
      didn't do it.
    completionComment: true
    date: '2026-11-06T10:38:07.551Z'
    id: c-2026-11-06t10-38-07-551z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T10:38:07.797Z'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/243'
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
> Guy: some landing graphics need updating to the most recent commits. Retake every shot from latest master, compare, ship the ones that changed.
