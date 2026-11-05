---
id: WOKEPOET-19
title: 'Keep panel resize grips reachable: all-edge resize, clamp to screen'
status: Ready
priority: Medium
effort: M
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:52:51.167Z'
    comment: Created ticket.
    id: a-2026-11-05t03-52-51-167z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T03:52:58.635Z'
  - type: activity
    user: Agent
    date: '2026-11-05T03:53:03.974Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-19-keep-panel-resize-grips-reachable-all-edge-resize-clamp-to-s
    event: worktree-created
    id: a-2026-11-05t03-53-03-974z
  - type: activity
    user: Agent
    date: '2026-11-05T04:23:22.246Z'
    comment: Task worktree automatically reclaimed (zero-commit-branch (FLUX-1214))
    id: a-2026-11-05t04-23-22-246z
  - type: comment
    user: Agent
    comment: >-
      **Panels now resize from every edge and corner, and overflowing widgets
      are drawn back on screen.** Root cause of the unreachable grip: the
      panel's CSS zoom multiplies vh/vw, so a 75vh panel is taller than the
      screen at 135% UI scale (measured: 50vh under zoom 1.5 is 75% of the
      window). Validated: 264 vitest tests, eslint, vue-tsc; a harness at 135%
      in Chromium/Edge for all handles across 5 anchors, two-panel widgets,
      window shrink and regrow, reopen. Not tested in the real overlay yet.
      README updated.
    date: '2026-11-05T05:04:47.590Z'
    completionComment: true
    id: c-2026-11-05t05-04-47-590z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/105'
    date: '2026-11-05T05:04:55.404Z'
    id: a-2026-11-05t05-04-55-404z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T05:04:55.404Z'
needsAction: null
branch: flux/WOKEPOET-19-keep-panel-resize-grips-reachable-all-edge-resize-clamp-to-s
baselineCommit: 7896e164a82865073f89df1ab235131664e8c4a4
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/105'
swimlane: null
---
> **TL;DR:** Overlay panels can grow past the screen so the bottom-right resize grip can't be reached. Resize from every edge and corner, and keep panels on screen on open, on resize and on resolution change.

## Plan
- WPanel: handles on all four edges and corners; the opposite edge stays put (anchor shifts as needed). Non-movable widgets keep only the away-from-anchor handles.
- WPanel: height/width caps account for the panel's CSS zoom and for every anchor side, not only top anchors.
- Widget: a render-only offset pulls a box that overflows back on screen, on open, size change and window resize. It isn't saved until the user moves the panel, so a temporary small window doesn't lose the layout.
- Tests for the pure geometry plus a browser check.
