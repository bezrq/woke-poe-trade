---
id: WOKEPOET-126
title: 'Listing tooltip: readable numbers, inline and roll bar views with a switch'
status: Done
priority: Medium
effort: S
assignee: unassigned
tags:
  - woke
  - price-check
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T03:25:33.267Z'
    comment: Created ticket.
    id: a-2026-11-06t03-25-33-267z
  - type: activity
    user: Agent
    date: '2026-11-06T03:34:13.299Z'
    comment: Updated implementation link.
    id: a-2026-11-06t03-34-13-299z
  - type: comment
    user: Agent
    comment: >-
      PR #216 is up with both views, Shift + scroll and the setting. Review
      findings are fixed and local checks pass. Handed to the coordinator for
      merge after CI.
    date: '2026-11-06T03:34:14.449Z'
    completionComment: true
    id: c-2026-11-06t03-34-14-449z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T03:34:14.449Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as #216 and #217, dev copy on master at d3a88749. Shift + scroll
      with a real wheel still awaits Guy's test.
    date: '2026-11-06T03:53:37.170Z'
    completionComment: true
    id: c-2026-11-06t03-53-37-170z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-06T03:53:37.170Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/216'
needsAction: null
reviewState: null
---
> **TL;DR** Guy picked both A (bright numbers, range in the line) and C (roll bars) from the numbers mock, with a setting or quick switch such as the scroll wheel. Plain wheel must keep scrolling results, so the switch is Shift + wheel; the choice is saved and also lives in the price check settings.
