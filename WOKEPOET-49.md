---
id: WOKEPOET-49
title: Warn on clashes with PoE's binds and add a tray reset for hotkeys
status: Grooming
priority: Medium
effort: M
assignee: unassigned
tags:
  - feature
  - overlay-core
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:49.943Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C4. Only one PoE bind is read from production_Config.ini, and rebinding the overlay key badly leaves no way back into Settings, because the tray only says to press it. Any new UI needs mocks first.

- GameConfig: read ACTION_KEYS; hotkey-health flags clashes.
- Tray: Reset overlay key.
