---
id: WOKEPOET-38
title: Reusable item tooltip across the app
status: Done
priority: Medium
effort: None
assignee: unassigned
tags:
  - feature
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T07:38:48.781Z'
    comment: Created ticket.
    id: a-2026-11-05t07-38-48-781z
  - type: comment
    user: Agent
    comment: Guy picked C + P1 from the mocks.
    date: '2026-11-05T08:01:48.815Z'
    id: c-2026-11-05t08-01-48-815z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T08:01:48.815Z'
  - type: activity
    user: Agent
    date: '2026-11-05T08:34:17.124Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-34-17-124z
  - type: comment
    user: Agent
    comment: >-
      PR #132 is reviewed and passes local checks. Waiting on the merge route.
      Gaps: 54 older uniques have no text, divination cards have no flavour
      text.
    date: '2026-11-05T08:34:17.150Z'
    completionComment: true
    id: c-2026-11-05t08-34-17-150z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T08:34:17.151Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 00a2a53e and live on the dev copy. Shared v-item-tip tooltip
      (look C, placement P1) on market, loot filter, boss drops, investing,
      farming, atlas, mechanics, analytics and price check. Data pack in
      public/data/tips, rebuilt with npm run tip-data. Gaps: 54 older uniques
      have no text, cards have no flavour text.
    completionComment: true
    date: '2026-11-05T08:41:17.964Z'
    id: c-2026-11-05t08-41-17-964z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T08:41:18.410Z'
  - type: activity
    user: Agent
    date: '2026-11-05T09:58:31.547Z'
    comment: >-
      Follow-up PR #145 from Guy's reports: tooltips follow the cursor, and
      unique-tier bases list their uniques with price and grade.
    id: a-2026-11-05t09-58-31-547z
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/132'
baselineCommit: d3529ea34cc3eb9250af781a7d862751daf8ef90
swimlane: null
diffSummary:
  - file: renderer/src/web/woke/boss-runs/bosses.ts
    additions: 75
    deletions: 0
  - file: renderer/src/web/woke/shared/boss-areas.ts
    additions: 8
    deletions: 5
  - file: renderer/test/woke/boss-runs-card.test.ts
    additions: 2
    deletions: 2
  - file: renderer/test/woke/economy.test.ts
    additions: 2
    deletions: 1
  - file: renderer/test/woke/game-log.test.ts
    additions: 8
    deletions: 2
---
Hovering an item in the Market tracker shows nothing. Promote pob-builds/GameTooltip.vue to a shared component usable from a plain item name, for market, loot filter, boss drops, league investing, farming and price check.

Data pack (en only, loaded on first hover): unique mods from poe.ninja, gems and currency/card text from RePoE, tattoos from poewiki cargo. Weighed at 1.7 MB raw / 335 KB gzip, or 4.3 MB / about 550 KB with every gem level. Icons stay on the CDN.

Mocks: https://claude.ai/artifact/E97sGNebt495BnSYpa2PuQ. No code until Guy picks.
