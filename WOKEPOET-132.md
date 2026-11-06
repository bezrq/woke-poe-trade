---
id: WOKEPOET-132
title: 'Death recap: read map mods by OCR on entering a map'
status: Released
priority: Medium
effort: M
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Guy
parentId: WOKEPOET-127
history:
  - type: activity
    user: Agent
    date: '2026-11-06T04:59:12.293Z'
    comment: Created ticket.
    id: a-2026-11-06t04-59-12-293z
  - type: activity
    user: Agent
    date: '2026-11-06T04:59:12.293Z'
    comment: Created as subtask of WOKEPOET-127.
    id: a-2026-11-06t04-59-12-293z
  - type: comment
    user: Agent
    comment: >-
      Need one in-map screenshot with the map mods turned on in the overlay map.
      Does the list stay up, or only while a key is held?
    date: '2026-11-06T04:59:18.654Z'
    id: c-2026-11-06t04-59-18-654z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T04:59:18.654Z'
    comment: >-
      Need one in-map screenshot with the map mods turned on in the overlay map.
      Does the list stay up, or only while a key is held?
  - type: comment
    user: Agent
    comment: 'Screenshot received: the list reads. PR #238.'
    date: '2026-11-06T09:47:01.001Z'
    id: c-2026-11-06t09-47-01-001z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T09:47:01.001Z'
    comment: 'Screenshot received: the list reads. PR #238.'
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-06T10:30:05.616Z'
  - type: comment
    user: Agent
    comment: >-
      PR #238 merged as 86081b3 and running in the dev copy. Not yet seen on a
      real map.
    date: '2026-11-06T10:30:06.402Z'
    completionComment: true
    id: c-2026-11-06t10-30-06-402z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T10:30:06.402Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 86081b3 and running in the dev copy. Death recap reads the
      game's mod list by OCR 3 s and 8 s after entering a map, shown as From
      screen; checks are the fallback when the list is collapsed. Not yet seen
      on a real map, or with the minimap open. No docs needed beyond code
      comments.
    completionComment: true
    date: '2026-11-06T10:30:08.183Z'
    id: c-2026-11-06t10-30-08-183z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T10:30:08.553Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:45.676Z'
swimlane: null
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/238'
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
> TL;DR: after "You have entered", OCR the game's own map mod list so a recap has mods without a check. Needs the list showing on screen.

Guy's production_Config.ini has `map_overlay_mods_hidden=true`, and his in-map screenshots show no list. Blocked on a real screenshot with the list showing: its position, colour and wording decide the crop and matcher. TooltipMatcher.parse in map-mods/tooltip-parse.ts should reuse for the lines. Reads only, sends no input. The OCR files aren't bundled, so it needs a fallback to checks.
