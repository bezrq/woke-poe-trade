---
id: WOKEPOET-111
title: 'Price check: ticking mods must not move the window''s contents'
status: In Progress
priority: None
effort: None
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:52:36.766Z'
    comment: Created ticket.
    id: a-2026-11-05t13-52-36-766z
  - type: comment
    user: Agent
    comment: >-
      Keeping the last results mounted and dimmed. Pushed to
      claude/price-check-steady; adversarial review running.
    date: '2026-11-05T13:56:49.565Z'
    id: c-2026-11-05t13-56-49-565z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T13:56:49.565Z'
needsAction: null
---
> Ticking a mod removes the results and price block above the mods, so the mods jump under the cursor. Keep the last results, dimmed, until the next search.

Guy: "pressing and adding and removing mods makes the screen jitter around too much... it needs to stay fixed in position."

Cause: CheckedItem sets doSearch false on any filter change, which unmounts TradeListing and its teleported verdict. Reproduced: 25px jump with the verdict collapsed.

Fix on branch claude/price-check-steady in E:\Git\woke-stat-columns.
