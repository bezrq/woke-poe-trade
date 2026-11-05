---
id: WOKEPOET-92
title: 'Generalize the flip screen: catalysts, delirium orbs, Harvest rerolls and more'
status: Done
priority: None
effort: L
assignee: Agent
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T11:00:59.781Z'
    comment: Created ticket.
    id: a-2026-11-05t11-00-59-781z
  - type: comment
    user: Agent
    comment: >-
      Pick a layout: A Flip board (my pick), B tabs or C ranked list. Mockups:
      https://claude.ai/artifact/HZ3QdC95eYt4ZZY6CPyygs. Also please check one
      Harvest reroll in game to confirm 30 lifeforce is per item.
    date: '2026-11-05T11:01:15.083Z'
    id: c-2026-11-05t11-01-15-083z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T11:01:15.083Z'
    comment: >-
      Pick a layout: A Flip board (my pick), B tabs or C ranked list. Mockups:
      https://claude.ai/artifact/HZ3QdC95eYt4ZZY6CPyygs. Also please check one
      Harvest reroll in game to confirm 30 lifeforce is per item.
  - type: comment
    user: Agent
    comment: >-
      Guy said "maybe in tabbed views" before the mockups reached him, so this
      leans to B. Asked him to confirm B, or B with a first "Best" tab using A's
      summary. Still waiting on that and on the Harvest cost check.
    date: '2026-11-05T11:01:32.847Z'
    selfAttested: true
    id: c-2026-11-05t11-01-32-847z
  - type: comment
    user: Agent
    comment: 'Guy picked "tabbed": layout B, no extra Best tab.'
    date: '2026-11-05T11:15:05.498Z'
    id: c-2026-11-05t11-15-05-498z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T11:15:05.498Z'
    comment: 'Guy picked "tabbed": layout B, no extra Best tab.'
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T11:15:05.553Z'
  - type: activity
    user: Agent
    date: '2026-11-05T11:29:31.686Z'
    comment: Updated implementation link.
    id: a-2026-11-05t11-29-31-686z
  - type: comment
    user: Agent
    comment: >-
      PR 163 is open: https://github.com/guybnd/woke-poe-trade/pull/163. Tabbed
      Flips with scarabs, catalysts, delirium orbs, fossils, essences, oils and
      runegrafts. 2,107 unit tests, types and lint pass; scarab-flip and
      tab-rail fake-game specs pass (19). Rest of the fake-game suite left to
      CI; not tried in the real app. The 30 lifeforce per item is still
      unconfirmed in game and is editable in the panel. Branch claude/flip-tabs
      in the clone E:\Git\woke-poe-trade-flips.
    date: '2026-11-05T11:29:32.068Z'
    completionComment: true
    id: c-2026-11-05t11-29-32-068z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T11:29:32.068Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 9a3784a1 and running in the dev copy. Tabbed Flips covers
      scarabs, catalysts, delirium orbs, fossils, essences, oils and runegrafts.
      Not yet seen on screen in the real app; the 30 lifeforce per item is still
      to be confirmed in game and is editable in the panel.
    completionComment: true
    date: '2026-11-05T12:16:37.636Z'
    id: c-2026-11-05t12-16-37-636z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T12:16:37.876Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/163'
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
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
> **TL;DR:** Turn the scarab flip panel into one Flips screen covering every recipe and Harvest reroll that can be priced, once Guy picks a layout.

Mockups: https://claude.ai/artifact/HZ3QdC95eYt4ZZY6CPyygs

Flips: scarabs (vendor 3), catalysts (vendor 3, Harvest), delirium orbs (Harvest), fossils (Harvest), essences (Harvest), oils (vendor up a tier), runegrafts (vendor 3).

Costs (PoE Wiki): 30 lifeforce, read as per item. Fossils Wild; oils and catalysts Vivid; essences and delirium orbs Primal.

Weights: PoeData.dev community calculations, patch per family 3.19 to 3.27. 24% of delirium weight and 37% of runegraft weight are on items poe.ninja doesn't list; decide how to treat them. Oils have no weights, so only the tier upgrade is priced.
