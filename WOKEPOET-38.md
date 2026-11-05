---
id: WOKEPOET-38
title: Reusable item tooltip across the app
status: Ready
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
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/132'
---
Hovering an item in the Market tracker shows nothing. Promote pob-builds/GameTooltip.vue to a shared component usable from a plain item name, for market, loot filter, boss drops, league investing, farming and price check.

Data pack (en only, loaded on first hover): unique mods from poe.ninja, gems and currency/card text from RePoE, tattoos from poewiki cargo. Weighed at 1.7 MB raw / 335 KB gzip, or 4.3 MB / about 550 KB with every gem level. Icons stay on the CDN.

Mocks: https://claude.ai/artifact/E97sGNebt495BnSYpa2PuQ. No code until Guy picks.
