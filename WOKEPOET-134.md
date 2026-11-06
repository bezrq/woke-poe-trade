---
id: WOKEPOET-134
title: >-
  Bug hunt 2026-11-06: tile max scroll, white socket blank search, Pages deploy
  race
status: In Progress
priority: Low
effort: S
assignee: unassigned
tags:
  - bug
  - price-check
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T05:06:37.021Z'
    comment: Created ticket.
---
Sweep of recent merges found three small confirmed bugs, fixed in small PRs:

1. Scrolling down on an empty max turns the filter on with max = min.
2. isBlankRareSearch ignores the white sockets tile.
3. Docs workflow has no concurrency group, so close merges fail the Pages deploy (#215's run).

Left for Guy: average weights for unrated Delirium orbs, scarabs and runegrafts; "1 of 3" on merged listing tooltips.
