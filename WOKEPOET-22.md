---
id: WOKEPOET-22
title: Let the price check window be moved and resized
status: In Progress
priority: Medium
effort: M
assignee: Agent
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:01:00.708Z'
    comment: Created ticket.
    id: a-2026-11-05t04-01-00-708z
  - type: activity
    user: Agent
    date: '2026-11-05T04:01:17.696Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-22-let-the-price-check-window-be-moved-and-resized
    event: worktree-created
    id: a-2026-11-05t04-01-17-696z
branch: flux/WOKEPOET-22-let-the-price-check-window-be-moved-and-resized
baselineCommit: a4c85a758a73046c8f54268117154f06f5082670
---
> **TL;DR:** The price check window is docked to the side of the screen with no way to move it. Let Guy drag it by its title bar and resize it, remember that across uses, and offer a way back to the docked spot.

## Plan
- Saved floating position and size on the price-check widget config; no saved position keeps today's docked layout.
- Drag by the title bar, resize from the right and bottom edges, reset with a title bar button.
- Report the moved area to the main process, so moving the mouse into the window still hands it the mouse in hold mode.
- The built-in browser layout stays docked: the browser takes the rest of the screen.
- Pure logic tested in `renderer/test/woke/`, flow tested in `testing/e2e/price-check.spec.ts`.
