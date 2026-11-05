---
id: WOKEPOET-40
title: >-
  Never send chat commands without a key press (filter reload, strictness
  ladder)
status: Grooming
priority: Critical
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
    date: '2026-11-05T08:09:25.474Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** F1. /itemfilter is sent from a Client.txt area line plus a 4 s timer, with no key pressed. GGG's macro rules forbid timers and file changes as triggers; the penalty is account termination.

- woke/loot-filter/store.ts: log handler timer (reloadTimer), followLadder -> setLevel -> save -> reloadInGame(false).
- Keep the file save. Never send without a user press or click.
- Show that a reload is waiting using the existing toast and Reload now button for now; a better prompt needs mocks first.
- Check overlap with WOKEPOET-34, which also works in store.ts.
