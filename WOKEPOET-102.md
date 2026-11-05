---
id: WOKEPOET-102
title: 'Flips: clearer volume labels, lifeforce cost moves to settings'
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
    date: '2026-11-05T12:55:01.250Z'
    comment: Created ticket.
    id: a-2026-11-05t12-55-01-250z
  - type: activity
    user: Agent
    date: '2026-11-05T13:09:43.762Z'
    comment: Updated implementation link.
    id: a-2026-11-05t13-09-43-762z
  - type: comment
    user: Agent
    comment: >-
      PR 183 is reviewed and sent to merge at 0afd9ee4. Columns renamed with
      tooltips, and the lifeforce field moved to settings. Unit tests and flips
      e2e pass; not checked in the real app. Tab icons are separate, waiting on
      Guy's pick.
    date: '2026-11-05T13:09:43.821Z'
    completionComment: true
    id: c-2026-11-05t13-09-43-821z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T13:09:43.821Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/183'
needsAction: null
---
> **TL;DR:** Guy couldn't tell what "Traded / day" and "C / day" mean, and doesn't want the lifeforce cost field on the panel. Rename the columns with explaining tooltips, and move the field to the Flips settings.

Market / day: market-wide volume from poe.ninja, last 24 hours. Max profit / day: a ceiling if you bought everything traded. No change to the maths.
