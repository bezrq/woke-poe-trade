---
id: WOKEPOET-111
title: 'Price check: ticking mods must not move the window''s contents'
status: Released
priority: None
effort: None
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:52:36.766Z'
    comment: Created ticket.
    id: a-2026-11-05t13-52-36-766z
  - type: comment
    user: Agent
    comment: >-
      Keeping the last results mounted and dimmed. Pushed to
      claude/price-check-steady; adversarial review running.
    date: '2026-11-05T13:56:49.565Z'
    id: c-2026-11-05t13-56-49-565z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T13:56:49.565Z'
  - type: activity
    user: Agent
    date: '2026-11-05T14:22:22.830Z'
    comment: Updated implementation link.
    id: a-2026-11-05t14-22-22-830z
  - type: comment
    user: Agent
    comment: >-
      **PR #193 stops the price check shifting** while filters change and
      results load, sent to the coordinator to merge. Known gaps are in the PR:
      trend and prediction cards still jump once on first search. No docs
      needed: no setting or API change.
    date: '2026-11-05T14:22:24.339Z'
    completionComment: true
    id: c-2026-11-05t14-22-24-339z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T14:22:24.339Z'
  - type: comment
    user: Agent
    comment: >-
      PR #193 merged as 1bf0d68. Dev update pending. Not yet checked in Guy's
      overlay on live listings.
    date: '2026-11-05T14:31:55.698Z'
    completionComment: true
    id: c-2026-11-05t14-31-55-698z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T14:31:55.698Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.011Z'
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/193'
reviewState: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> Ticking a mod removes the results and price block above the mods, so the mods jump under the cursor. Keep the last results, dimmed, until the next search.

Guy: "pressing and adding and removing mods makes the screen jitter around too much... it needs to stay fixed in position."

Cause: CheckedItem sets doSearch false on any filter change, which unmounts TradeListing and its teleported verdict. Reproduced: 25px jump with the verdict collapsed.

Fix on branch claude/price-check-steady in E:\Git\woke-stat-columns.
