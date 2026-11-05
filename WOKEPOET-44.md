---
id: WOKEPOET-44
title: 'Survive a damaged config.json: backup, recovery, no silent reset'
status: Grooming
priority: High
effort: M
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
    date: '2026-11-05T08:09:38.191Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** F5. A damaged or empty config loads defaults with no message; later saves go to config.json.tmp for the session, so they are lost too. There is no backup and no flush to disk, and a failed write quits the app.

- host-files/ConfigStore.ts: flush before rename, keep a last-good copy, recover at load, move a bad file aside (like readJsonStrict in woke/data-files.ts), never app.exit on a failed write.
- Config.ts initConfig: tell the player when settings were recovered or reset.
- Goal: losing config.json never means losing all settings.
