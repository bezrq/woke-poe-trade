---
id: WOKEPOET-42
title: Only type into the game when it has focus
status: Done
priority: High
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
    date: '2026-11-05T08:09:31.850Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-31-850z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:31.850Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-31-850z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.016Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-016z
  - type: comment
    user: Agent
    comment: 'Merged in #126.'
    date: '2026-11-05T10:00:53.046Z'
    completionComment: true
    id: c-2026-11-05t10-00-53-046z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:53.046Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/126'
needsAction: null
---
> **TL;DR** F3. paste-in-chat can wait up to 30 s in whenKeysIdle, then types with no check that PoE is in front, so Discord can get Enter, Ctrl+V, Enter.

- shortcuts/Shortcuts.ts user-action handler: after the wait and settle, check poeWindow.isActive just before typing; drop with a logged and visible message otherwise.
- shortcuts/text-box.ts stashSearch: give focus the same 120 ms settle when it comes from the overlay.
