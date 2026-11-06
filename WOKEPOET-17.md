---
id: WOKEPOET-17
title: Build panel tooltip can stay stuck on screen when the overlay closes
status: Released
priority: High
effort: XS
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:33:27.784Z'
    comment: Created ticket.
    id: a-2026-11-05t03-33-27-784z
  - type: activity
    user: Agent
    date: '2026-11-05T03:33:37.844Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-17-build-panel-tooltip-can-stay-stuck-on-screen-when-the-overla
    event: worktree-created
    id: a-2026-11-05t03-33-37-844z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T03:33:37.972Z'
  - type: comment
    user: Agent
    comment: >-
      **Guards the build panel tooltip against getting stuck.** It now closes
      with the overlay, on window blur, and on scroll. Also restores the hover
      text on truncated gem sources and stops a duplicate key when a gem is
      listed twice in a link.


      Validated: vue-tsc and eslint clean, 181 renderer tests pass,
      `testing/e2e/pob-builds.spec.ts` passes. The stuck tooltip did not
      reproduce on the fake game: the new overlay-close test also passes without
      the guard, so it doesn't prove the fix. It's a guard for the real overlay,
      which the tests can't exercise. No docs needed: no visual or API change.
    date: '2026-11-05T03:41:15.900Z'
    completionComment: true
    id: c-2026-11-05t03-41-15-900z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/90'
    date: '2026-11-05T03:41:23.691Z'
    id: a-2026-11-05t03-41-23-691z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T03:41:23.691Z'
  - type: comment
    user: Agent
    comment: >-
      PR squash-merged for branch
      `flux/WOKEPOET-17-build-panel-tooltip-can-stay-stuck-on-screen-when-the-overla`
      — advanced to Done.
    date: '2026-11-05T03:45:52.230Z'
    id: c-2026-11-05t03-45-52-230z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T03:45:52.230Z'
  - type: activity
    user: Agent
    date: '2026-11-05T03:45:54.488Z'
    comment: Task worktree automatically reclaimed (ready-or-terminal-status)
    id: a-2026-11-05t03-45-54-488z
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:49.354Z'
branch: flux/WOKEPOET-17-build-panel-tooltip-can-stay-stuck-on-screen-when-the-overla
baselineCommit: a58632b0379617cbbaaebd67ac298914035552dd
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/90'
swimlane: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** Found reviewing PR #86 after it merged. The tooltip sits outside the panel, so closing the overlay while hovering leaves it on screen over the game. Fix that and two small regressions.

- Hide the tooltip when the overlay closes, the window loses focus, or the panel scrolls.
- Truncated gem sources lost their native hover text in Gems by level: restore it.
- Links rows key gems by name, so a gem listed twice in a group gives a duplicate key: key by index.
- Check that gem tooltips open in Gems by level when there's no campaign widget, because the row is then a disabled button.
