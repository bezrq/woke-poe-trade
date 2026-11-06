---
id: WOKEPOET-21
title: Remove the redundant move button from panel title bars
status: Released
priority: Low
effort: XS
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:00:25.198Z'
    comment: Created ticket.
    id: a-2026-11-05t04-00-25-198z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T04:00:28.663Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t04-00-28-663z
  - type: status_change
    from: Todo
    to: In Progress
    user: claude-code@guy-pc
    date: '2026-11-05T04:00:28.663Z'
  - type: activity
    user: Agent
    date: '2026-11-05T04:00:33.549Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-21-remove-the-redundant-move-button-from-panel-title-bars
    event: worktree-created
    id: a-2026-11-05t04-00-33-549z
  - type: comment
    user: Agent
    comment: >-
      **The Move icon is off the title bar; choosing the anchor corner is now a
      right-click option.** The handles' only extra ability is that anchor
      choice, which sets the way a widget grows. Review found the tab bar could
      only be moved through those handles, so its empty edges now drag too.


      Validated: 220 tests, vue-tsc, eslint; in the browser with a read-only
      copy of Guy's layout: no Move buttons, tab bar drags by its edge,
      right-click shows Choose anchor corner. Not run in the Electron overlay.
      Docs: updated renderer/src/web/woke/ui/README.md.
    date: '2026-11-05T04:05:35.289Z'
    completionComment: true
    id: c-2026-11-05t04-05-35-289z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/94'
    date: '2026-11-05T04:05:43.188Z'
    id: a-2026-11-05t04-05-43-188z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T04:05:43.189Z'
  - type: comment
    user: Agent
    comment: >-
      PR squash-merged for branch
      `flux/WOKEPOET-21-remove-the-redundant-move-button-from-panel-title-bars`
      — advanced to Done.
    date: '2026-11-05T04:06:52.373Z'
    id: c-2026-11-05t04-06-52-373z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T04:06:52.374Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:49.281Z'
needsAction: null
branch: flux/WOKEPOET-21-remove-the-redundant-move-button-from-panel-title-bars
baselineCommit: a4c85a758a73046c8f54268117154f06f5082670
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/94'
swimlane: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** Dragging the title bar already moves a panel, so the Move icon comes off the title bar. Its one extra ability, choosing which corner the panel is anchored to, stays in the right-click menu under a clearer name.

Guy: "this move icon is redundant when i can already drag the top bar no". Follow-up to WOKEPOET-11.
