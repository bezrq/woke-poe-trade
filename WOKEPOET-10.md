---
id: WOKEPOET-10
title: Trade search window can't be moved or resized
status: In Progress
priority: Medium
effort: S
assignee: Agent
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T02:31:12.414Z'
    comment: Created ticket.
    id: a-2026-11-05t02-31-12-414z
  - type: activity
    user: Agent
    date: '2026-11-05T02:32:55.641Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-10-trade-search-window-can-t-be-moved-or-resized
    event: worktree-created
    id: a-2026-11-05t02-32-55-641z
branch: flux/WOKEPOET-10-trade-search-window-can-t-be-moved-or-resized
baselineCommit: 95cbada0b56969b164437487851fe1db57556125
---
> **TL;DR:** The Trade searches browser panel ignores resizing, loses the mouse mid-drag over the embedded page, and starts jammed against the bottom-right of the screen. Fix all three so it drags, resizes and remembers.

## Causes
1. `WidgetTradeSearches.vue` passes `style="width: 60vw; height: 75vh"` to `WPanel`. Vue merges that fallthrough style after `boxStyle`, so the saved size is written to config but never applied. `WidgetLab.vue` has the same bug.
2. A `<webview>` takes mouse events once the cursor is over it, so the document's `mousemove`/`mouseup` stop mid-drag (shrinking in particular).
3. `Widget.vue` keeps the whole widget on screen. Default anchor 30%/25% plus 60vw/75vh puts the widget's edges on the screen edges, so it can only move up or left.

## Fix
- `WPanel`: add a `height` prop; the two widgets pass `width`/`height` props instead of inline style.
- Turn off webview pointer events during any panel drag or resize.
- Pure drag clamp: widgets too big to move stay partly on screen with the title bar reachable; smaller widgets keep the whole-widget rule.
- Tests in `renderer/test/woke/`.
