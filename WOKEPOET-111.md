---
id: WOKEPOET-111
title: 'Price check: ticking mods must not move the window''s contents'
status: Grooming
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
---
> Ticking a mod removes the results and price block above the mods, so the mods jump under the cursor. Keep the last results, dimmed, until the next search.

Guy: "pressing and adding and removing mods makes the screen jitter around too much... it needs to stay fixed in position."

Cause: CheckedItem sets doSearch false on any filter change, which unmounts TradeListing and its teleported verdict. Reproduced: 25px jump with the verdict collapsed.

Fix on branch claude/price-check-steady in E:\Git\woke-stat-columns.
