---
id: WOKEPOET-12
title: Make dock icons snappy and their cards clickable
status: Done
priority: Medium
effort: S
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T02:43:15.923Z'
    comment: Created ticket.
    id: a-2026-11-05t02-43-15-923z
  - type: activity
    user: Agent
    date: '2026-11-05T02:43:39.626Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-12-make-dock-icons-snappy-and-their-cards-clickable
    event: worktree-created
    id: a-2026-11-05t02-43-39-626z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T02:43:39.887Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t02-43-39-887z
  - type: status_change
    from: Todo
    to: In Progress
    user: claude-code@guy-pc
    date: '2026-11-05T02:43:39.887Z'
  - type: comment
    user: Agent
    comment: >-
      **Dock icons now open their cards in 120ms (was 400ms), a click opens them
      at once, and the Regex library, Atlas and Mechanics cards are clickable
      without the overlay key.** Validated: type checks, 150 unit tests, and 17
      fake-game specs pass, including a new regex library test; 3 were skipped.
      Not run: `toolkit.spec` fails to load on this PC with an ES module import
      error ('MODULES' from renderer modules), so CI needs to cover it. Not
      tried in the real game. Caveats: a click on an icon also reaches the game,
      and making a card clickable turns on the overlay tint and shows any open
      panels while the mouse is on the card, as the Trade card already does. No
      docs needed: no documented behaviour or schema changed.
    date: '2026-11-05T02:53:55.469Z'
    completionComment: true
    id: c-2026-11-05t02-53-55-469z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/84'
    date: '2026-11-05T02:54:06.677Z'
    id: a-2026-11-05t02-54-06-677z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T02:54:06.677Z'
  - type: comment
    user: Agent
    comment: >-
      PR squash-merged for branch
      `flux/WOKEPOET-12-make-dock-icons-snappy-and-their-cards-clickable` —
      advanced to Done.
    date: '2026-11-05T03:15:55.928Z'
    id: c-2026-11-05t03-15-55-928z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T03:15:55.928Z'
branch: flux/WOKEPOET-12-make-dock-icons-snappy-and-their-cards-clickable
baselineCommit: 95cbada0b56969b164437487851fe1db57556125
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/84'
swimlane: null
---
> **TL;DR:** Dock icon cards open slowly on hover, clicking an icon in game does nothing, and buttons on the Regex library, Atlas and Mechanics cards can't be clicked. Cut the delays, open on click, and mark those cards clickable.

Asked for by Guy in the project thread. Touches the dock (`renderer/src/web/woke/dock`), `useHoverZone`, and `main/src/woke/hover.ts`.
