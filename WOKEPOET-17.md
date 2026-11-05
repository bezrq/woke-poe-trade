---
id: WOKEPOET-17
title: Build panel tooltip can stay stuck on screen when the overlay closes
status: In Progress
priority: High
effort: XS
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:33:27.784Z'
    comment: Created ticket.
    id: a-2026-11-05t03-33-27-784z
  - type: activity
    user: Agent
    date: '2026-11-05T03:33:37.844Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-17-build-panel-tooltip-can-stay-stuck-on-screen-when-the-overla
    event: worktree-created
    id: a-2026-11-05t03-33-37-844z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T03:33:37.972Z'
branch: flux/WOKEPOET-17-build-panel-tooltip-can-stay-stuck-on-screen-when-the-overla
baselineCommit: a58632b0379617cbbaaebd67ac298914035552dd
needsAction: null
---
> **TL;DR:** Found reviewing PR #86 after it merged. The tooltip sits outside the panel, so closing the overlay while hovering leaves it on screen over the game. Fix that and two small regressions.

- Hide the tooltip when the overlay closes, the window loses focus, or the panel scrolls.
- Truncated gem sources lost their native hover text in Gems by level: restore it.
- Links rows key gems by name, so a gem listed twice in a group gives a duplicate key: key by index.
- Check that gem tooltips open in Gems by level when there's no campaign widget, because the row is then a disabled button.
