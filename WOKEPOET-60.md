---
id: WOKEPOET-60
title: 'Trade API: honour Retry-After and 429, identifiable user agent'
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
    date: '2026-11-05T08:10:17.964Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C15. X-Rate-Limit headers are followed, but the trade code has no Retry-After or 429 lockout, and GGG counts repeated 4xx against you. The user agent is Electron's generic one. Check against WOKEPOET-37, which covers price check.
