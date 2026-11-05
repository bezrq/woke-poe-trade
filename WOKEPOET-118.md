---
id: WOKEPOET-118
title: 'Listing tooltip: look like the in-game item, with mod tiers and weapon DPS'
status: Ready
priority: Medium
effort: M
assignee: unassigned
tags:
  - woke
  - price-check
  - ui
  - mocks
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T15:35:14.198Z'
    comment: Created ticket.
    id: a-2026-11-05t15-35-14-198z
  - type: comment
    user: Agent
    comment: >-
      Which layout: A (Alt view, tallest), B (tier tags, DPS at the foot; my
      default) or C (table of mods, numbers on top)? DPS placement can mix
      between them. Mock: scratchpad tooltip-options.png, sent in the thread.
    date: '2026-11-05T15:40:00.235Z'
    id: c-2026-11-05t15-40-00-235z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T15:40:00.235Z'
    comment: >-
      Which layout: A (Alt view, tallest), B (tier tags, DPS at the foot; my
      default) or C (table of mods, numbers on top)? DPS placement can mix
      between them. Mock: scratchpad tooltip-options.png, sent in the thread.
  - type: comment
    user: Agent
    comment: >-
      Guy's pick: A with tier tags on the left, roll quality % on the right
      (position in the roll range), and B's bottom row.
    date: '2026-11-05T15:44:57.255Z'
    id: c-2026-11-05t15-44-57-255z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T15:44:57.255Z'
    comment: >-
      Guy's pick: A with tier tags on the left, roll quality % on the right
      (position in the roll range), and B's bottom row.
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T15:44:57.296Z'
  - type: activity
    user: Agent
    date: '2026-11-05T16:03:29.247Z'
    comment: Updated implementation link.
    id: a-2026-11-05t16-03-29-247z
  - type: comment
    user: Agent
    comment: >-
      PR #206 is up with Guy's pick and the real header art. Review findings are
      fixed and local checks pass. Handed to the coordinator for merge.
    date: '2026-11-05T16:03:30.397Z'
    completionComment: true
    id: c-2026-11-05t16-03-30-397z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T16:03:30.397Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/206'
---
> **TL;DR** Guy: "can we improve this, show mod tiers, stuff like total pdps etc? have it more similar to actual item showing?" The tooltip on a price check trade listing (woke/price-insight/listing-tip.ts → GameTooltip.vue) drops most of what the trade site sends.

Mocks with options first; no code until Guy picks.
