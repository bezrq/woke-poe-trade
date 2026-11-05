---
id: WOKEPOET-18
title: Make the chosen PoB loadout shared across every window
status: Grooming
priority: Medium
effort: M
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:42:51.336Z'
    comment: Created ticket.
---
> **TL;DR:** Picking a skill or item set chip in the PoB panel only changed that one panel's view. Make the pick one saved choice per build that the panel tabs, campaign card, price chip and filter rules all read. The level-based pick stays the default until a set is picked by hand.

## Plan
- Save per-build picks on the PoB widget (`loadouts`, by set title).
- `build-model`: `loadoutOf` resolves skill set, item set and tree; a pick links same-named sets. Stage helpers take the pick.
- `useActiveBuild` exposes the active build's pick; campaign card, price chip and filter input pass it on.
- Build panel: chips save the pick; Links you need now, gems, Gear and Setups follow it; an Auto chip goes back to following your level.
- Tests in `renderer/test/woke`.
