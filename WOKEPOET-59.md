---
id: WOKEPOET-59
title: 'Clipboard: safer restore, keep images'
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
    date: '2026-11-05T08:10:15.706Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-15-706z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:15.706Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-15-706z
  - type: activity
    user: Agent
    date: '2026-11-05T10:53:21.390Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-53-21-390z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/150'
---
> **TL;DR** C14. Restore is off by default, so item text replaces your clipboard. With it on, the fixed 120 ms window (HostClipboard.ts) can paste your own text and press Enter when the game lags. Only text is saved, so images are lost.

- Longer or adaptive restore delay when a command auto-sends.
- Save and restore non-text formats.
- Decide the default.
