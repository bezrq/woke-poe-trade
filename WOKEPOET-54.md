---
id: WOKEPOET-54
title: Warn when port 8585 is busy instead of silently losing saved data
status: Released
priority: Low
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
    date: '2026-11-05T08:10:02.256Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-02-256z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:02.256Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-02-256z
  - type: activity
    user: Agent
    date: '2026-11-05T10:53:21.247Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-53-21-247z
  - type: comment
    user: Agent
    comment: 'Merged in #150.'
    date: '2026-11-05T11:08:30.384Z'
    completionComment: true
    id: c-2026-11-05t11-08-30-384z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T11:08:30.384Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.949Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/150'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** C9. A busy 8585 falls back to a random port. That's a new browser storage origin, so market data and other saved data look empty, with no message. Warn at least. Longer term, move this data to host-side stores.
