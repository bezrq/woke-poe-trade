---
id: WOKEPOET-46
title: Show attach state in the tray and warn about exclusive fullscreen
status: Released
priority: Medium
effort: S
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
    date: '2026-11-05T08:09:43.296Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-43-296z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:43.296Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-43-296z
  - type: comment
    user: Agent
    comment: >-
      Merged in #175. The tray can't run in the test host, so it's untested
      until tried on Windows.
    date: '2026-11-05T12:40:14.623Z'
    completionComment: true
    id: c-2026-11-05t12-40-14-623z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T12:40:14.623Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.360Z'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** C1. Nothing says whether the overlay is attached or why not. The tray tooltip shows only the version, and exclusive fullscreen fails with no warning. Any new UI needs mocks first.

- AppTray tooltip and menu line: waiting for PoE, attached, or needs admin.
- GameWindow attach and fullscreen events.
