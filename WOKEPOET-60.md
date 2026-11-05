---
id: WOKEPOET-60
title: 'Trade API: honour Retry-After and 429, identifiable user agent'
status: Done
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
    comment: Created ticket.
    id: a-2026-11-05t08-10-17-964z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:17.964Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-17-964z
  - type: comment
    user: Agent
    comment: >-
      Retry-After and 429 handling landed in #127. Left the user agent alone:
      changing it on the trade site risks Cloudflare rejecting the cookies tied
      to the current one, and GGG's format needs an OAuth client, while the docs
      say new applications aren't being processed.
    date: '2026-11-05T10:53:21.059Z'
    completionComment: true
    id: c-2026-11-05t10-53-21-059z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:53:21.059Z'
needsAction: null
---
> **TL;DR** C15. X-Rate-Limit headers are followed, but the trade code has no Retry-After or 429 lockout, and GGG counts repeated 4xx against you. The user agent is Electron's generic one. Check against WOKEPOET-37, which covers price check.
