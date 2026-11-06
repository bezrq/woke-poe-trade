---
id: WOKEPOET-148
title: 'Stash outlines: stack totals off by default'
status: Released
priority: None
effort: XS
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-06T11:41:31.535Z'
    comment: Created ticket.
    id: a-2026-11-06t11-41-31-535z
  - type: comment
    user: Agent
    comment: >-
      **Stack totals off by default, PR #250**
      (https://github.com/guybnd/woke-poe-trade/pull/250). Lint, types, 2688
      unit tests and scarab-flip.spec.ts pass. Waiting on review and CI. No docs
      needed: the setting's label already explains it.
    date: '2026-11-06T11:44:02.306Z'
    completionComment: true
    id: c-2026-11-06t11-44-02-306z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T11:44:02.306Z'
  - type: comment
    user: Agent
    comment: 'Stack totals off by default, merged as 57bfe08. No docs needed.'
    completionComment: true
    date: '2026-11-06T11:58:04.890Z'
    id: c-2026-11-06t11-58-04-890z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T11:58:05.134Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:45.225Z'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/250'
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
> Guy: stash outline badges show only the per-item figure by default; the stack total stays as a setting.
