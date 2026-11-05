---
id: WOKEPOET-55
title: Stop harmless errors being recorded as crashes
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
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/128'
---
> **TL;DR** C10. Missing files throw uncaught stream errors (server.ts, file-uploads.ts), and a bad socket message throws at JSON.parse. Both are recorded as crashes.

- Add error handlers with a 404, strip query strings, keep paths inside their folders.
- try/catch around socket parsing.
- Guard lastActiveClient before the page connects.
- Add an unhandledRejection handler.
