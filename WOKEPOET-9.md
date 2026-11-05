---
id: WOKEPOET-9
title: 'Settings window: centre sidebar icons and make the panel more opaque'
status: Ready
priority: Medium
effort: XS
assignee: Agent
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T02:22:59.908Z'
    comment: Created ticket.
    id: a-2026-11-05t02-22-59-908z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T02:23:30.266Z'
  - type: comment
    user: Agent
    comment: >-
      Sidebar icons now centre in their boxes: Font Awesome's display on .fas
      was beating WIcon's grid (computed display was block, now grid). This also
      applies everywhere WIcon draws a Font Awesome icon. Settings window now
      uses a new solid --w-panel-solid per theme instead of translucent
      --w-panel; in-game panels unchanged. Verified headless in hybrid, modern
      and native with before/after screenshots. Not checked over the real game
      or in the packaged app, since Guy is testing the Tauri overlay.
    date: '2026-11-05T02:28:29.732Z'
    completionComment: true
    id: c-2026-11-05t02-28-29-732z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/81'
    date: '2026-11-05T02:28:37.633Z'
    id: a-2026-11-05t02-28-37-633z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T02:28:37.634Z'
branch: flux/WOKEPOET-9-settings-window-centre-sidebar-icons-and-make-the-panel-more
baselineCommit: 301ac1fcb1ecf86b5d04d66b9a83b4e036d062ea
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/81'
swimlane: null
---
> **TL;DR:** The sidebar icons in the new Settings window don't line up with their labels, and the window is too see-through over the game. Fix both.

Reported from Guy's screenshot of the sidebar redesign (PR #51).
