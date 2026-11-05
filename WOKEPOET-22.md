---
id: WOKEPOET-22
title: Let the price check window be moved and resized
status: Ready
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
  - type: comment
    user: Agent
    comment: >-
      **The price check window now drags by its title bar and resizes from its
      right and bottom edges, with a title bar button to dock it again.**
      Position saves on the widget config when the window closes. The
      mouse-entry area sent to the main process follows the moved window. Beside
      the built-in browser it stays docked. Validation: 231 vitest tests pass
      including test/woke/price-window-position.test.ts; 5 price check e2e tests
      pass, the new one covering drag, no league picker opening after a drag,
      resize, save on close, the reported area, and docking. Not tested in the
      real overlay or with PoE, so hold-key behaviour there is unconfirmed. No
      docs needed: the widget has no documented layout.
    date: '2026-11-05T04:07:56.876Z'
    completionComment: true
    id: c-2026-11-05t04-07-56-876z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/95'
    date: '2026-11-05T04:08:07.139Z'
    id: a-2026-11-05t04-08-07-139z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T04:08:07.139Z'
branch: flux/WOKEPOET-22-let-the-price-check-window-be-moved-and-resized
baselineCommit: a4c85a758a73046c8f54268117154f06f5082670
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/95'
swimlane: null
---
> **TL;DR:** The price check window is docked to the side of the screen with no way to move it. Let Guy drag it by its title bar and resize it, remember that across uses, and offer a way back to the docked spot.

## Plan
- Saved floating position and size on the price-check widget config; no saved position keeps today's docked layout.
- Drag by the title bar, resize from the right and bottom edges, reset with a title bar button.
- Report the moved area to the main process, so moving the mouse into the window still hands it the mouse in hold mode.
- The built-in browser layout stays docked: the browser takes the rest of the screen.
- Pure logic tested in `renderer/test/woke/`, flow tested in `testing/e2e/price-check.spec.ts`.
