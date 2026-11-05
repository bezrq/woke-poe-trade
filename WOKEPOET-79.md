---
id: WOKEPOET-79
title: 'Lab gems: leave thin-market gems out of EV'
status: Grooming
priority: None
effort: None
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:27:02.856Z'
    comment: Created ticket.
    id: a-2026-11-05t10-27-02-856z
  - type: comment
    user: Agent
    comment: >-
      Which option for thin gems? A: hide them, counted as 0 (recommended). B:
      same EV, keep them struck out in the list. C: keep them, capped at the
      pool's best trusted price. Level 1 EVs today, red/green/blue: now
      254/245/1314c, A or B 106/113/71c, C 142/198/117c. Toggle saved per
      window, default off.
    date: '2026-11-05T10:27:56.903Z'
    id: c-2026-11-05t10-27-56-903z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T10:27:56.903Z'
    comment: >-
      Which option for thin gems? A: hide them, counted as 0 (recommended). B:
      same EV, keep them struck out in the list. C: keep them, capped at the
      pool's best trusted price. Level 1 EVs today, red/green/blue: now
      254/245/1314c, A or B 106/113/71c, C 142/198/117c. Toggle saved per
      window, default off.
swimlane: require-input
needsAction: null
---
> **TL;DR:** Gems marked "!" (thin market on poe.ninja) still inflate the Lab gems EVs. Add a saved toggle that leaves them out of the sums and the lists.

Scope: `renderer/src/web/woke/lab-gems`. A thin gem is treated as unpriced (0 in EV), because the font can still offer it. Base gem prices are never dropped: an unknown base counts as free in `pickProfit`, so dropping one would inflate profit.
