---
id: WOKEPOET-102
title: 'Flips: clearer volume labels, lifeforce cost moves to settings'
status: Done
priority: None
effort: XS
assignee: Agent
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T12:55:01.250Z'
    comment: Created ticket.
    id: a-2026-11-05t12-55-01-250z
  - type: activity
    user: Agent
    date: '2026-11-05T13:09:43.762Z'
    comment: Updated implementation link.
    id: a-2026-11-05t13-09-43-762z
  - type: comment
    user: Agent
    comment: >-
      PR 183 is reviewed and sent to merge at 0afd9ee4. Columns renamed with
      tooltips, and the lifeforce field moved to settings. Unit tests and flips
      e2e pass; not checked in the real app. Tab icons are separate, waiting on
      Guy's pick.
    date: '2026-11-05T13:09:43.821Z'
    completionComment: true
    id: c-2026-11-05t13-09-43-821z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T13:09:43.821Z'
  - type: comment
    user: Agent
    comment: >-
      Merged, per the coordinator. Not yet in the dev build: that update is
      being held until PRs 182 and 184 land.
    completionComment: true
    date: '2026-11-05T13:12:47.013Z'
    id: c-2026-11-05t13-12-47-013z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T13:12:47.263Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/183'
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
---
> **TL;DR:** Guy couldn't tell what "Traded / day" and "C / day" mean, and doesn't want the lifeforce cost field on the panel. Rename the columns with explaining tooltips, and move the field to the Flips settings.

Market / day: market-wide volume from poe.ninja, last 24 hours. Max profit / day: a ceiling if you bought everything traded. No change to the maths.
