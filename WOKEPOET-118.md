---
id: WOKEPOET-118
title: 'Listing tooltip: look like the in-game item, with mod tiers and weapon DPS'
status: Grooming
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
swimlane: require-input
needsAction: null
---
> **TL;DR** Guy: "can we improve this, show mod tiers, stuff like total pdps etc? have it more similar to actual item showing?" The tooltip on a price check trade listing (woke/price-insight/listing-tip.ts → GameTooltip.vue) drops most of what the trade site sends.

Mocks with options first; no code until Guy picks.
