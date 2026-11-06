---
id: WOKEPOET-142
title: >-
  Landing page: redesign feature slides (sharp shots, pickers on top, real PoE
  art)
status: Released
priority: None
effort: None
assignee: unassigned
tags:
  - landing
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-06T09:07:24.740Z'
    comment: Created ticket.
    id: a-2026-11-06t09-07-24-740z
  - type: comment
    user: Agent
    comment: 'Guy picked B, the item tooltip look. PR #237 open, bug review running.'
    date: '2026-11-06T09:32:14.982Z'
    id: c-2026-11-06t09-32-14-982z
  - type: status_change
    from: Require Input
    to: In Progress
    user: Agent
    date: '2026-11-06T09:32:14.982Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as #237 (6f6adfe) and live on the landing page. Checked at
      1024x768: all shots load and each section fits the window.
    date: '2026-11-06T09:48:30.220Z'
    completionComment: true
    id: c-2026-11-06t09-48-30-220z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T09:48:30.220Z'
  - type: comment
    user: Agent
    comment: >-
      Option B live: item tooltip sections, name plates above the shot, stone
      background, shots retaken at double resolution and shown at 1280x720 at
      most.
    completionComment: true
    date: '2026-11-06T09:48:31.259Z'
    id: c-2026-11-06t09-48-31-259z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T09:48:31.506Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:45.846Z'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/237'
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
Guy's points: images too big and blurry; pickers ugly, use real PoE art; pickers above each section and fit one screen with the slide; background not plain black or an item border on the pics.

Blur cause: landing-highlights crops 1120-1280 px of a 1920x1080 page, then scales to 1600x900, and the page stretches that to 160vh. Fix: capture at deviceScaleFactor 2, save with no resize, cap the stage at 1280x720.

Art: real item-frame headers in renderer/public/images/item-frame, item icons from poecdn, stash tabs and panel band cut from Guy's frames (testing/fixtures/screens/frames).

Mocks: three options await Guy's pick. Clone E:\Git\woke-landing-poe, branch claude/landing-tour-mocks.
