---
id: WOKEPOET-47
title: Second launch should tell the player it's already running
status: Grooming
priority: Medium
effort: XS
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
    date: '2026-11-05T08:09:45.151Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C2. main.ts exits a second copy with no feedback and has no second-instance handler.

- Add app.on('second-instance') that shows a tray balloon with the overlay key.
