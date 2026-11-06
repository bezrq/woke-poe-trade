---
id: WOKEPOET-119
title: 'Redesign landing page: simpler, PoE font and look, five highlights with slides'
status: Released
priority: Medium
effort: None
assignee: unassigned
tags:
  - docs
  - ui
  - mocks
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-06T01:53:50.246Z'
    comment: Created ticket.
    id: a-2026-11-06t01-53-50-246z
  - type: comment
    user: Agent
    comment: >-
      Which direction: A item tooltips, B stash tabs (one screen, recommended),
      or C full-bleed with socket pager? Mocks:
      https://claude.ai/artifact/HkQxGLGCSZoVVtCYWmvcWT
    date: '2026-11-06T02:03:45.168Z'
    id: c-2026-11-06t02-03-45-168z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T02:03:45.168Z'
    comment: >-
      Which direction: A item tooltips, B stash tabs (one screen, recommended),
      or C full-bleed with socket pager? Mocks:
      https://claude.ai/artifact/HkQxGLGCSZoVVtCYWmvcWT
  - type: comment
    user: Agent
    comment: >-
      Guy picked C, without the demo button, plus slides for lab gem pricing,
      the regex maker and the regex clipboard.
    date: '2026-11-06T02:10:50.178Z'
    id: c-2026-11-06t02-10-50-178z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T02:10:50.178Z'
    comment: >-
      Guy picked C, without the demo button, plus slides for lab gem pricing,
      the regex maker and the regex clipboard.
  - type: comment
    user: Agent
    comment: >-
      Guy picked C. Building on claude/landing-poe-look in
      E:\Git\woke-landing-poe.
    date: '2026-11-06T02:14:34.714Z'
    id: c-2026-11-06t02-14-34-714z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-06T02:14:34.714Z'
  - type: comment
    user: Agent
    comment: >-
      **Landing page C is up as PR #209**
      (https://github.com/guybnd/woke-poe-trade/pull/209), review findings
      fixed. Checked: lint, types, unit tests, docs build, headless page check
      at three widths. Waiting on CI, then merge. Guy may send an Act 1 town
      screenshot to replace the on-screen slides' hideout frame; docs: README
      updated.
    date: '2026-11-06T02:25:06.075Z'
    completionComment: true
    id: c-2026-11-06t02-25-06-075z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T02:25:06.075Z'
  - type: comment
    user: Agent
    comment: >-
      Landing page C and the README are merged as 9de89a9, with both CI checks
      green. Docs updated: README. Follow-up when Guy's 8 screenshots land: swap
      the on-screen slides onto real calm frames.
    completionComment: true
    date: '2026-11-06T02:32:14.011Z'
    id: c-2026-11-06t02-32-14-011z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T02:32:14.235Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:46.688Z'
swimlane: null
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/209'
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
Guy's ask: make the landing page much simpler, with the PoE font and a PoE-ish design, built around highlights that each have a few slides.

1. Redesigned price check: competing items and their stars in char, tooltip info
2. In-game filter: editing it, and the shortcut from an item to its filter listing
3. In-game PoB tooling: char info and useful links
4. Market info: flips tab, stash highlighter, boss runs manager
5. Dynamic on-screen info: trades, league mechanic info, campaign tracker, challenges, lab run
6. And many more: plain feature list

Mocks first, using real overlay shots. Guy picks, then build. Working clone: E:\Git\woke-landing-poe.
