---
id: WOKEPOET-124
title: 'Cap price check number tiles, slow drag, drag from number'
status: Done
priority: None
effort: None
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T03:15:46.888Z'
    comment: Created ticket.
    id: a-2026-11-06t03-15-46-888z
  - type: comment
    user: Agent
    comment: >-
      PR #213 up. Review findings fixed, local checks pass, CI running; merge
      goes through the merge thread, then dev build pull.
    date: '2026-11-06T03:22:36.615Z'
    completionComment: true
    id: c-2026-11-06t03-22-36-615z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T03:22:36.615Z'
  - type: activity
    user: Agent
    date: '2026-11-06T03:22:37.311Z'
    comment: Updated implementation link.
    id: a-2026-11-06t03-22-37-311z
  - type: comment
    user: Agent
    comment: >-
      Merged as ebbd9ee. Caps, 20 px drag step, drag from the number, click to
      type.
    completionComment: true
    date: '2026-11-06T03:29:18.080Z'
    id: c-2026-11-06t03-29-18-080z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T03:29:18.484Z'
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/213'
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
Guy's screenshot showed Links at 7. Cap tiles at game limits, slow the drag, let a drag start from the number while a plain click still types. Branch claude/number-field-limits, clone E:\Git\woke-number-fields.
