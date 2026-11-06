---
id: WOKEPOET-61
title: 'Hover zones after display changes, and test mixed DPI'
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
    date: '2026-11-05T08:10:20.063Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-20-063z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:20.063Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-20-063z
  - type: activity
    user: Agent
    date: '2026-11-05T10:53:21.466Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-53-21-466z
  - type: comment
    user: Agent
    comment: 'Merged in #150. Mixed-DPI monitors are still untested.'
    date: '2026-11-05T11:08:33.126Z'
    completionComment: true
    id: c-2026-11-05t11-08-33-126z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T11:08:33.126Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.905Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/150'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** C16. No display-metrics-changed handling, and hover zones can lag by up to 2 s after a move (woke/shared/hover.ts). Mixed DPI is untested. Resend zones on display changes, and test on two monitors.
