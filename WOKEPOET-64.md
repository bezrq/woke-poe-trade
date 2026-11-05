---
id: WOKEPOET-64
title: 'Price check: no false verdict on rares with empty searches'
status: Grooming
priority: Critical
effort: S
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-37
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:32.285Z'
    comment: Created as subtask of WOKEPOET-37.
---
> TL;DR: A rare with T1 mods can search with no mods ticked and read "Not worth listing". Tick T1 and T2 mods by default, and give no price or Not worth listing when a rare's search has no mods.

`create-stat-filters.ts` only ticks T1/T2 in the exact path; `PriceVerdict.vue` never checks the search. Report finding 1.
