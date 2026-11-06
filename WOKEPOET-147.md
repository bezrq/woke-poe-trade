---
id: WOKEPOET-147
title: 'CI: site-only PRs skip the app tests'
status: Done
priority: None
effort: S
assignee: unassigned
tags:
  - tooling
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T11:36:13.842Z'
    comment: Created ticket.
    id: a-2026-11-06t11-36-13-842z
  - type: comment
    user: Agent
    comment: >-
      **CI skip is up as PR #249**
      (https://github.com/guybnd/woke-poe-trade/pull/249). Decision logic
      checked on sample file lists; the skip itself is proven by the next
      site-only PR, which is the landing cleanup. Docs: testing/README.md
      updated.
    date: '2026-11-06T11:37:21.559Z'
    completionComment: true
    id: c-2026-11-06t11-37-21-559z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T11:37:21.559Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 7259dd3 and proven on #251: required checks skip in seconds and
      count as passed. #252 follows with a load check for landing specs. Docs:
      testing/README.md updated.
    completionComment: true
    date: '2026-11-06T11:49:28.239Z'
    id: c-2026-11-06t11-49-28-239z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T11:49:28.602Z'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/249'
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
> Guy: don't run in-game tests for a landing page. CI looks at the PR's changed files; site-only PRs pass both required checks without the work. Pushes to master still run everything.
