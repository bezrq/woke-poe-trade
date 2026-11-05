---
id: WOKEPOET-50
title: Recover the input hook after sleep and missed mouse-ups
status: Grooming
priority: Medium
effort: S
assignee: unassigned
tags:
  - bug
  - overlay-core
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:52.347Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C5. uIOhook starts once with no powerMonitor handling. A missed mouse-up leaves heldButtons stuck in woke/hover.ts, and the dock stops catching the mouse.

- On powerMonitor resume, restart the hook and clear held buttons.
- Clear heldButtons on game focus change.
- Needs a real sleep and resume test.
