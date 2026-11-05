---
id: WOKEPOET-90
title: 'Campaign tracker: keep route, gems and run per character'
status: Grooming
priority: Medium
effort: None
assignee: unassigned
tags:
  - feature
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:54:34.535Z'
    comment: Created ticket.
---
Step 8 of the [gameplay helpers critique](https://claude.ai/artifact/NjdEZhrQZBmKwRB56yTsoj). Mock first.

There's one state per widget. A Strand visit past step 3 resets the route and clears ticked gems, and an endgame character entering a campaign zone wakes the route (72 wakes in the replay). The log names a character only on level-up, so the design has to handle that.
