---
id: WOKEPOET-11
title: 'Window controls on panel top bars, minimize and right-click menu'
status: Done
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
  - type: comment
    user: Agent
    comment: >-
      **Panels now have settings, move, delete, minimize and hide buttons on the
      title bar, and the hover corner menu is gone.** Right-click on any widget
      gives the same options plus Reset size; rows with their own menu keep it.
      Double-click the title minimizes, so Reset size moved from double-click to
      the right-click menu on main panels. Delete acts at once with a 10 s Undo.
      Widgets without a title bar (campaign strip, run timer, stash/item search,
      image strip, delve grid) get the options by right-click only.


      Validated: 160 tests, vue-tsc, eslint; in the browser with Guy's saved
      layout (read-only copy): minimize, drag while minimized, restore on
      screen, right-click menu, delete + undo. Not run in the Electron overlay.
      Docs: updated renderer/src/web/woke/ui/README.md. Expect small merge
      conflicts with WOKEPOET-10 in Widget.vue and WPanel.vue.
    date: '2026-11-05T02:50:19.480Z'
    completionComment: true
    id: c-2026-11-05t02-50-19-480z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/83'
    date: '2026-11-05T02:50:29.136Z'
    id: a-2026-11-05t02-50-29-136z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T02:50:29.136Z'
  - type: activity
    user: Agent
    date: '2026-11-05T02:54:33.768Z'
    comment: Task worktree automatically reclaimed (ready-or-terminal-status)
    id: a-2026-11-05t02-54-33-768z
  - type: comment
    user: Agent
    comment: >-
      Guy reports windows still showing the old picker. His running build
      predates this PR. Also adding the top-bar buttons to widgets with no title
      bar, which only got right-click in the first pass.
    date: '2026-11-05T02:57:12.776Z'
    id: c-2026-11-05t02-57-12-776z
  - type: status_change
    from: Ready
    to: In Progress
    user: Agent
    date: '2026-11-05T02:57:12.776Z'
  - type: comment
    user: Agent
    comment: >-
      PR squash-merged for branch
      `flux/WOKEPOET-11-window-controls-on-panel-top-bars-minimize-and-right-click-m`
      — advanced to Done.
    date: '2026-11-05T03:15:52.224Z'
    id: c-2026-11-05t03-15-52-224z
  - type: status_change
    from: In Progress
    to: Done
    user: Agent
    date: '2026-11-05T03:15:52.224Z'
  - type: activity
    user: Agent
    date: '2026-11-05T03:20:28.500Z'
    comment: Task worktree automatically reclaimed (ready-or-terminal-status)
    id: a-2026-11-05t03-20-28-500z
needsAction: null
branch: flux/WOKEPOET-11-window-controls-on-panel-top-bars-minimize-and-right-click-m
baselineCommit: 95cbada0b56969b164437487851fe1db57556125
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/83'
swimlane: null
reviewState: null
---
> **TL;DR:** Replace the hover corner menu (hide / edit / move / delete) with buttons on each panel's title bar, add a minimize button that collapses a panel to its title bar, and offer the same options in a right-click menu on every widget.

Guy's ask: overlapping panels are hard to move around, and the corner menu is unwanted. "Just add to the top bar all the options, also right click context menu where possible or relevant."

## Plan
- `overlay/Widget.vue`: single list of window actions (minimize, hide, settings, move, delete), provided to panels; right-click menu on the widget unless an inner row already opened its own; remove the hover panel.
- `woke/ui/WPanel.vue`: the first panel in a widget shows the buttons; minimized hides the body (kept mounted so webviews live) and any secondary panels; double-click on the title toggles minimize; Reset size moves to the right-click menu.
- Minimizing pins the title bar in place; restoring in place returns the exact old anchor, restoring after a move opens toward the free side of the screen.
- Delete acts at once with Undo (P9) instead of hold-for-1s.
- Coordinate with WOKEPOET-10, which edits the same two files for dragging.
