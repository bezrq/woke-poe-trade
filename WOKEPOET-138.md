---
id: WOKEPOET-138
title: Move explanatory text behind ? hovers
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
    date: '2026-11-06T07:37:30.061Z'
    comment: Created ticket.
    id: a-2026-11-06t07-37-30-061z
  - type: comment
    user: Agent
    comment: >-
      Audit and mocks: https://claude.ai/artifact/9GaRWNLnKhpGNgK8SjWtUx (43
      move, 20 shorten, 16 keep). Which ?: A, always there inside an open window
      (recommended), or B, only with the mouse on the row? And go on the list,
      or what to change?
    date: '2026-11-06T07:45:07.471Z'
    id: c-2026-11-06t07-45-07-471z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T07:45:07.471Z'
    comment: >-
      Audit and mocks: https://claude.ai/artifact/9GaRWNLnKhpGNgK8SjWtUx (43
      move, 20 shorten, 16 keep). Which ?: A, always there inside an open window
      (recommended), or B, only with the mouse on the row? And go on the list,
      or what to change?
  - type: comment
    user: Agent
    comment: >-
      Guy picked A: the ? is always there inside an open window. Building the
      list as written unless he changes it.
    date: '2026-11-06T08:12:46.364Z'
    id: c-2026-11-06t08-12-46-364z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T08:12:46.364Z'
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-06T08:12:46.364Z'
  - type: comment
    user: Agent
    comment: >-
      PR #234 is up with review findings fixed and local checks run. Queued to
      merge once GitHub CI is green. After that, merge master into
      dev-230-with-master for the dev build, not a restart from master. Two e2e
      failures also fail on clean master. Not tried in the real game yet.
    date: '2026-11-06T08:36:46.587Z'
    completionComment: true
    id: c-2026-11-06t08-36-46-587z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T08:36:46.587Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as a872e741 and live on the dev build through dev-230-with-master
      (1f495264). Not tried in the real game yet.
    completionComment: true
    date: '2026-11-06T08:45:12.320Z'
    id: c-2026-11-06t08-45-12-320z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T08:45:12.636Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:45.978Z'
swimlane: null
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/234'
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
Audit the overlay and landing page for explanatory or filler text that could sit behind a small ? hover. Report by screen with move/shorten/keep, mock the pattern, build after Guy's pick. Clone: E:\Git\woke-help-hints.
