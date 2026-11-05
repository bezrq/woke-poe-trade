---
id: WOKEPOET-26
title: Map scan badge off the map; rolling stuck in quad tab
status: In Progress
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:08:43.152Z'
    comment: Created ticket.
---
> **TL;DR:** The map roller badge could sit away from the map, and rolling didn't follow to another map or tab. Fixed in PR #96.

- Cursor now read from the OS each frame (uiohook drops moves with a button held).
- Roll lock is dropped when the cursor moves away.
- Same-slot radius is half a quad cell.

PR: https://github.com/guybnd/woke-poe-trade/pull/96
