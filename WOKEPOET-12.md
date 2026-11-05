---
id: WOKEPOET-12
title: Make dock icons snappy and their cards clickable
status: In Progress
priority: Medium
effort: S
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: claude-code@guy-pc
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
branch: flux/WOKEPOET-12-make-dock-icons-snappy-and-their-cards-clickable
baselineCommit: 95cbada0b56969b164437487851fe1db57556125
needsAction: null
claim:
  holder: claude-code@guy-pc
  claimedAt: '2026-11-05T02:43:39.887Z'
  expiresAt: '2026-11-05T03:13:39.887Z'
---
> **TL;DR:** Dock icon cards open slowly on hover, clicking an icon in game does nothing, and buttons on the Regex library, Atlas and Mechanics cards can't be clicked. Cut the delays, open on click, and mark those cards clickable.

Asked for by Guy in the project thread. Touches the dock (`renderer/src/web/woke/dock`), `useHoverZone`, and `main/src/woke/hover.ts`.
