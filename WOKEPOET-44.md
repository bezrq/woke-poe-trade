---
id: WOKEPOET-44
title: 'Survive a damaged config.json: backup, recovery, no silent reset'
status: Released
priority: High
effort: M
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
    date: '2026-11-05T08:09:38.191Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-38-191z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:38.191Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-38-191z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.133Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-133z
  - type: comment
    user: Agent
    comment: 'Merged in #129.'
    date: '2026-11-05T10:00:56.044Z'
    completionComment: true
    id: c-2026-11-05t10-00-56-044z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:56.044Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:48.296Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/129'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** F5. A damaged or empty config loads defaults with no message; later saves go to config.json.tmp for the session, so they are lost too. There is no backup and no flush to disk, and a failed write quits the app.

- host-files/ConfigStore.ts: flush before rename, keep a last-good copy, recover at load, move a bad file aside (like readJsonStrict in woke/data-files.ts), never app.exit on a failed write.
- Config.ts initConfig: tell the player when settings were recovered or reset.
- Goal: losing config.json never means losing all settings.
