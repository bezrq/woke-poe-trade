---
id: WOKEPOET-57
title: Stop replacing the whole config on every save
status: Grooming
priority: Medium
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
    date: '2026-11-05T08:10:10.249Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C12. Each save echoes back as config-changed, then re-parses and replaces the whole 74 KB config. That costs work on zone changes, and an edit made during the round trip is overwritten.

- Config.ts: don't replace the config on the echo of this window's own save; only on a change from another client.
- Check the Settings close-on-config-changed behaviour still works.
