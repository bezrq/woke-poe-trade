---
id: WOKEPOET-52
title: Keep tailing Client.txt after it's cleared or replaced
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
    date: '2026-11-05T08:09:57.494Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-57-494z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:57.494Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-57-494z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.281Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-281z
  - type: comment
    user: Agent
    comment: 'Merged in #133.'
    date: '2026-11-05T10:00:59.848Z'
    completionComment: true
    id: c-2026-11-05t10-00-59-848z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:59.848Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/133'
needsAction: null
---
> **TL;DR** C7. GameLogWatcher never compares its offset to file size and keeps the old handle, so a cleared or replaced log stops silently and every log-based feature stops with it.

- handleFileChange: stat by path; if size < offset or the file identity changed, reopen and start from the right place.
- Also: You have entered is English only (woke/campaign/log-parse.ts ZONE_RE); note this for non-English clients.
