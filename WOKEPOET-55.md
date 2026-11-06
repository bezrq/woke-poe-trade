---
id: WOKEPOET-55
title: Stop harmless errors being recorded as crashes
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
    date: '2026-11-05T08:10:05.102Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-05-102z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:05.102Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-05-102z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.074Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-074z
  - type: comment
    user: Agent
    comment: 'Merged in #128.'
    date: '2026-11-05T10:00:54.542Z'
    completionComment: true
    id: c-2026-11-05t10-00-54-542z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:54.542Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:48.322Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/128'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** C10. Missing files throw uncaught stream errors (server.ts, file-uploads.ts), and a bad socket message throws at JSON.parse. Both are recorded as crashes.

- Add error handlers with a 404, strip query strings, keep paths inside their folders.
- try/catch around socket parsing.
- Guard lastActiveClient before the page connects.
- Add an unhandledRejection handler.
