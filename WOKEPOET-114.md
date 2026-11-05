---
id: WOKEPOET-114
title: 'Flips: show profit per item, not per recipe'
status: Ready
priority: None
effort: XS
assignee: Agent
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T14:30:23.835Z'
    comment: Created ticket.
    id: a-2026-11-05t14-30-23-835z
  - type: activity
    user: Agent
    date: '2026-11-05T14:39:23.142Z'
    comment: Updated implementation link.
    id: a-2026-11-05t14-39-23-142z
  - type: comment
    user: Agent
    comment: >-
      PR 196 is reviewed and sent to merge at 25d59be8. Flips shows Profit each
      everywhere, and the dock ranks on the same number. Unit tests and flips
      e2e pass; not checked in the real app.
    date: '2026-11-05T14:39:24.755Z'
    completionComment: true
    id: c-2026-11-05t14-39-24-755z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T14:39:24.755Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/196'
needsAction: null
---
> **TL;DR:** Guy asked why profit is shown per recipe when the price beside it is per scarab. Show profit per item you put in, so it matches the price and all tabs compare the same way.

Display only: the ranking and Max profit / day don't change. The stash outlines (WOKEPOET-110) use the same number.
