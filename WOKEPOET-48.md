---
id: WOKEPOET-48
title: A hotkey clash shouldn't kill both actions
status: Grooming
priority: Low
effort: XS
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
    date: '2026-11-05T08:09:47.299Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-47-299z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:47.299Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-47-299z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.255Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-255z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/133'
---
> **TL;DR** C3. Shortcuts.updateActions drops every action on a clashing key except toggle-overlay. Settings warns, but keeping the first action is kinder.

- Keep the first action on the key, drop later ones, and log which.
