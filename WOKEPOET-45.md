---
id: WOKEPOET-45
title: Say so when a price check gets no item
status: Grooming
priority: High
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
    date: '2026-11-05T08:09:40.796Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-40-796z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:40.796Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-40-796z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.200Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-200z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/133'
---
> **TL;DR** F6. item-text-failed is sent by main, but only the loot filter's sample key listens. Every other copy-item hotkey does nothing visible on failure.

- Listen in one shared place and show the existing toast, or a short message near the cursor, for any target that hasn't handled it.
- Must show while the overlay is closed and the game has focus.
