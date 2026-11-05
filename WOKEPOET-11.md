---
id: WOKEPOET-11
title: 'Window controls on panel top bars, minimize and right-click menu'
status: In Progress
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
    date: '2026-11-05T02:42:06.940Z'
    comment: Created ticket.
    id: a-2026-11-05t02-42-06-940z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T02:42:10.232Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t02-42-10-232z
  - type: status_change
    from: Todo
    to: In Progress
    user: claude-code@guy-pc
    date: '2026-11-05T02:42:10.232Z'
  - type: activity
    user: Agent
    date: '2026-11-05T02:42:20.940Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-11-window-controls-on-panel-top-bars-minimize-and-right-click-m
    event: worktree-created
    id: a-2026-11-05t02-42-20-940z
needsAction: null
claim:
  holder: claude-code@guy-pc
  claimedAt: '2026-11-05T02:42:10.232Z'
  expiresAt: '2026-11-05T03:12:10.232Z'
branch: flux/WOKEPOET-11-window-controls-on-panel-top-bars-minimize-and-right-click-m
baselineCommit: 95cbada0b56969b164437487851fe1db57556125
---
> **TL;DR:** Replace the hover corner menu (hide / edit / move / delete) with buttons on each panel's title bar, add a minimize button that collapses a panel to its title bar, and offer the same options in a right-click menu on every widget.

Guy's ask: overlapping panels are hard to move around, and the corner menu is unwanted. "Just add to the top bar all the options, also right click context menu where possible or relevant."

## Plan
- `overlay/Widget.vue`: single list of window actions (minimize, hide, settings, move, delete), provided to panels; right-click menu on the widget unless an inner row already opened its own; remove the hover panel.
- `woke/ui/WPanel.vue`: the first panel in a widget shows the buttons; minimized hides the body (kept mounted so webviews live) and any secondary panels; double-click on the title toggles minimize; Reset size moves to the right-click menu.
- Minimizing pins the title bar in place; restoring in place returns the exact old anchor, restoring after a move opens toward the free side of the screen.
- Delete acts at once with Undo (P9) instead of hold-for-1s.
- Coordinate with WOKEPOET-10, which edits the same two files for dragging.
