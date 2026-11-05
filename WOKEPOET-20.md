---
id: WOKEPOET-20
title: Open dynamic popups in the empty left area by default
status: In Progress
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: claude-code@guy-pc
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:55:02.074Z'
    comment: Created ticket.
    id: a-2026-11-05t03-55-02-074z
  - type: activity
    user: Agent
    date: '2026-11-05T03:55:21.545Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-20-open-dynamic-popups-in-the-empty-left-area-by-default
    event: worktree-created
    id: a-2026-11-05t03-55-21-545z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T03:55:21.578Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t03-55-21-578z
branch: flux/WOKEPOET-20-open-dynamic-popups-in-the-empty-left-area-by-default
baselineCommit: 7896e164a82865073f89df1ab235131664e8c4a4
claim:
  holder: claude-code@guy-pc
  claimedAt: '2026-11-05T03:55:21.578Z'
  expiresAt: '2026-11-05T04:25:21.578Z'
---
> **TL;DR:** Panels opened from the dock or tab bar (PoB builds and friends) open at one spot on the left, below the top bar. Panels the user already moved stay put.

## Plan
- One shared default spot for dynamic panels, in `woke/ui/window-anchor.ts`.
- Each dynamic panel's first-open default uses it.
- On config load, panels still sitting exactly at their old default move to the new spot. Moved or minimized panels are untouched.
- HUD-style widgets keep their spots: campaign, run timer, mechanics, map mods, map/essence scan, trade whispers, map check, price check.
