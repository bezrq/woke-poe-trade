---
id: WOKEPOET-13
title: Make the PoB builds panel look like Path of Exile
status: Released
priority: Medium
effort: M
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Guy
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
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T02:51:15.558Z'
  - type: comment
    user: Agent
    comment: >-
      **The build panel now looks like the game.** Gem names take their
      attribute colour with art on Leveling, Gear and Setups. Gear shows real
      item icons in inventory order. Hovering an item or gem shows a game-style
      tooltip. Notes keep PoB's colour codes. Filter tab unchanged.


      Key files: `renderer/src/web/woke/pob-builds/` (`GameTooltip.vue`,
      `GemName.vue`, `item-art.ts`, `tooltip.ts`, `BuildDetail.vue`),
      `main/src/woke/pob-parse.ts`.


      Validated: vue-tsc and eslint clean, 166 renderer tests pass, new
      `testing/e2e/pob-builds.spec.ts` passes on the fixture and on Guy's real
      builds at 1080p and 1440p. Not run against latest master: local `git
      fetch` fails on a crash-corrupted ref (`refs/heads/flux/WOKEPOET-11-...`,
      all NUL bytes, its PR #83 is merged). CI needs to cover the merged result.


      Known gap: 10 of the 278 gems in Guy's builds have no colour data, mostly
      item-granted skills, and show white. Docs: UI README updated with the
      `w-gem-*` classes.
    date: '2026-11-05T03:28:52.594Z'
    completionComment: true
    id: c-2026-11-05t03-28-52-594z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/86'
    date: '2026-11-05T03:28:59.884Z'
    id: a-2026-11-05t03-28-59-884z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T03:28:59.884Z'
  - type: comment
    user: Agent
    comment: >-
      PR squash-merged for branch
      `flux/WOKEPOET-13-make-the-pob-builds-panel-look-like-path-of-exile` —
      advanced to Done.
    date: '2026-11-05T03:33:52.449Z'
    id: c-2026-11-05t03-33-52-449z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T03:33:52.449Z'
  - type: activity
    user: Agent
    date: '2026-11-05T03:38:26.101Z'
    comment: Task worktree automatically reclaimed (ready-or-terminal-status)
    id: a-2026-11-05t03-38-26-101z
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:49.427Z'
branch: flux/WOKEPOET-13-make-the-pob-builds-panel-look-like-path-of-exile
baselineCommit: a58632b0379617cbbaaebd67ac298914035552dd
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/86'
swimlane: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** The build detail view gets game-style visuals: gem names coloured by attribute, real item icons on Gear, and an in-game-style item tooltip on hover, across Leveling, Gear, Setups and the rest.

Requested by Guy. Reuse the item/icon data the app already has (`items.ndjson`, `gem-sources.json`).

Stay out of `Widget.vue` and `WPanel.vue` (other threads are on panel title bars) and the context icon.

## Acceptance
- Gem names use strength red, dexterity green, intelligence blue, white where it applies, on every tab.
- Gear tab shows real item icons.
- Hovering an item shows a tooltip styled like the game's.
- Works in the app's overlay, verified with a real build.
