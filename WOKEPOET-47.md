---
id: WOKEPOET-47
title: Second launch should tell the player it's already running
status: Done
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
    comment: Created ticket.
    id: a-2026-11-05t08-09-45-151z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:45.151Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-45-151z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.228Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-228z
  - type: comment
    user: Agent
    comment: 'Merged in #133.'
    date: '2026-11-05T10:00:58.296Z'
    completionComment: true
    id: c-2026-11-05t10-00-58-296z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:58.296Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/133'
needsAction: null
---
> **TL;DR** C2. main.ts exits a second copy with no feedback and has no second-instance handler.

- Add app.on('second-instance') that shows a tray balloon with the overlay key.
