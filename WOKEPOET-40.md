---
id: WOKEPOET-40
title: >-
  Never send chat commands without a key press (filter reload, strictness
  ladder)
status: Released
priority: Critical
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
    date: '2026-11-05T08:09:25.474Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-25-474z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:25.474Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-25-474z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:15.985Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-15-985z
  - type: comment
    user: Agent
    comment: 'Merged in #126. Follow-up: mocks for a better reload prompt.'
    date: '2026-11-05T10:00:52.298Z'
    completionComment: true
    id: c-2026-11-05t10-00-52-298z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:52.298Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:48.371Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/126'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** F1. /itemfilter is sent from a Client.txt area line plus a 4 s timer, with no key pressed. GGG's macro rules forbid timers and file changes as triggers; the penalty is account termination.

- woke/loot-filter/store.ts: log handler timer (reloadTimer), followLadder -> setLevel -> save -> reloadInGame(false).
- Keep the file save. Never send without a user press or click.
- Show that a reload is waiting using the existing toast and Reload now button for now; a better prompt needs mocks first.
- Check overlap with WOKEPOET-34, which also works in store.ts.
