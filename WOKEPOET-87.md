---
id: WOKEPOET-87
title: 'Lab: right layout for the difficulty, and a way past poelab''s 403'
status: Grooming
priority: High
effort: None
assignee: unassigned
tags:
  - bug
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:54:25.660Z'
    comment: Created ticket.
---
Step 5 of the [gameplay helpers critique](https://claude.ai/artifact/NjdEZhrQZBmKwRB56yTsoj). Mock first.

- Every plaza is `Labyrinth_Airlock` at level 33, so auto-load always picks Normal. Read the difficulty from the first room's id (`1_`, `2_`, `3_`, `EndGame_`), and offer a quick difficulty pick in the plaza.
- poelab answered 403 to a direct request and showed a bot check in a browser. Test from inside the app, then find a route that doesn't try to defeat the check.
