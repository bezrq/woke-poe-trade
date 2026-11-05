---
id: WOKEPOET-13
title: Make the PoB builds panel look like Path of Exile
status: Grooming
priority: Medium
effort: M
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T02:49:44.102Z'
    comment: Created ticket.
    id: a-2026-11-05t02-49-44-102z
  - type: activity
    user: Agent
    date: '2026-11-05T02:50:03.218Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-13-make-the-pob-builds-panel-look-like-path-of-exile
    event: worktree-created
    id: a-2026-11-05t02-50-03-218z
branch: flux/WOKEPOET-13-make-the-pob-builds-panel-look-like-path-of-exile
baselineCommit: a58632b0379617cbbaaebd67ac298914035552dd
---
> **TL;DR:** The build detail view gets game-style visuals: gem names coloured by attribute, real item icons on Gear, and an in-game-style item tooltip on hover, across Leveling, Gear, Setups and the rest.

Requested by Guy. Reuse the item/icon data the app already has (`items.ndjson`, `gem-sources.json`).

Stay out of `Widget.vue` and `WPanel.vue` (other threads are on panel title bars) and the context icon.

## Acceptance
- Gem names use strength red, dexterity green, intelligence blue, white where it applies, on every tab.
- Gear tab shows real item icons.
- Hovering an item shows a tooltip styled like the game's.
- Works in the app's overlay, verified with a real build.
