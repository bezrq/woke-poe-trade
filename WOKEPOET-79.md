---
id: WOKEPOET-79
title: 'Lab gems: leave thin-market gems out of EV'
status: In Progress
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
  - type: comment
    user: Agent
    comment: 'Guy picked A: thin gems count as 0 and leave the list.'
    date: '2026-11-05T10:37:12.406Z'
    id: c-2026-11-05t10-37-12-406z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T10:37:12.406Z'
    comment: 'Guy picked A: thin gems count as 0 and leave the list.'
  - type: activity
    user: Agent
    date: '2026-11-05T10:44:17.314Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-44-17-314z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T10:44:17.959Z'
  - type: activity
    user: Agent
    date: '2026-11-05T10:50:43.299Z'
    comment: >-
      PR #152 at e185d3e2: review findings fixed (dock card label, zero-column
      highlight, pool EV highlight now marks the best colour, e2e EV assertion).
      Local checks pass. Merge requested through the cloud merge thread. Not
      changed: graphGaps in market/parse.ts counts a missing graph as 0 gaps, so
      such a gem would count as trusted; not confirmed in the live feed.
    id: a-2026-11-05t10-50-43-299z
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/152'
---
> **TL;DR:** Gems marked "!" (thin market on poe.ninja) still inflate the Lab gems EVs. Add a saved toggle that leaves them out of the sums and the lists.

Scope: `renderer/src/web/woke/lab-gems`. A thin gem is treated as unpriced (0 in EV), because the font can still offer it. Base gem prices are never dropped: an unknown base counts as free in `pickProfit`, so dropping one would inflate profit.
