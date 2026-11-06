---
id: WOKEPOET-49
title: Warn on clashes with PoE's binds and add a tray reset for hotkeys
status: Released
priority: Medium
effort: M
assignee: unassigned
tags:
  - feature
  - overlay-core
createdBy: Agent
updatedBy: Guy
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:49.943Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-49-943z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:49.943Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-49-943z
  - type: comment
    user: Agent
    comment: 'Merged in #175.'
    date: '2026-11-05T12:40:14.879Z'
    completionComment: true
    id: c-2026-11-05t12-40-14-879z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T12:40:14.879Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.337Z'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** C4. Only one PoE bind is read from production_Config.ini, and rebinding the overlay key badly leaves no way back into Settings, because the tray only says to press it. Any new UI needs mocks first.

- GameConfig: read ACTION_KEYS; hotkey-health flags clashes.
- Tray: Reset overlay key.
