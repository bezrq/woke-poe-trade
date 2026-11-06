---
id: WOKEPOET-50
title: Recover the input hook after sleep and missed mouse-ups
status: Released
priority: Medium
effort: S
assignee: unassigned
tags:
  - bug
  - overlay-core
createdBy: Agent
updatedBy: Guy
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:52.347Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-52-347z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:52.347Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-52-347z
  - type: activity
    user: Agent
    date: '2026-11-05T10:53:21.174Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-53-21-174z
  - type: comment
    user: Agent
    comment: 'Merged in #150. A real sleep and resume is still untested.'
    date: '2026-11-05T11:08:29.630Z'
    completionComment: true
    id: c-2026-11-05t11-08-29-630z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T11:08:29.630Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.962Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/150'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** C5. uIOhook starts once with no powerMonitor handling. A missed mouse-up leaves heldButtons stuck in woke/hover.ts, and the dock stops catching the mouse.

- On powerMonitor resume, restart the hook and clear held buttons.
- Clear heldButtons on game focus change.
- Needs a real sleep and resume test.
