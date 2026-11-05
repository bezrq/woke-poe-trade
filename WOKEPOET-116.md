---
id: WOKEPOET-116
title: 'Flips: add Essence of Doubt to the essence flip'
status: Done
priority: Medium
effort: XS
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T15:04:03.443Z'
    comment: Created ticket.
    id: a-2026-11-05t15-04-03-443z
  - type: activity
    user: Agent
    date: '2026-11-05T15:10:32.350Z'
    comment: Updated implementation link.
    id: a-2026-11-05t15-10-32-350z
  - type: comment
    user: Agent
    comment: >-
      PR #202 is up, rebased on master. Doubt now takes the average weight;
      specials were already out, and a test pins that. Adversarial review found
      one test bug, now fixed. Local vitest (2440), typecheck:test, lint and
      build pass. Not checked in the running overlay. Waiting on merge.
    date: '2026-11-05T15:10:32.392Z'
    completionComment: true
    id: c-2026-11-05t15-10-32-392z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T15:10:32.392Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as PR #202 and live on the dev build. Essence of Doubt now uses the
      average weight in rerolls and has its 3-to-1 rows. Special essences remain
      out of both flips, pinned by a test.
    completionComment: true
    date: '2026-11-05T15:33:26.745Z'
    id: c-2026-11-05t15-33-26-745z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T15:33:27.020Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/202'
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
Guy asked whether the Essence flip counts special essences (Hysteria, Insanity, Horror, Delirium). It doesn't: the reroll pool only takes Deafening names, and the upgrade chains only tiered types. No change needed, a test now pins it.

Found while checking: Doubt is missing. PoeData.dev's essence dataset lists Deafening Doubt as the input being rerolled, so it has no observed weight. `ESSENCE_TYPES` is derived from those weights, so all Doubt upgrade rows are missing and Deafening Doubt sits out of the reroll average.

Fix: give Doubt the average weight, say so in the source note, and test both.
