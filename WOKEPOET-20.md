---
id: WOKEPOET-20
title: Open dynamic popups in the empty left area by default
status: Ready
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
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
  - type: comment
    user: Agent
    comment: >-
      **Dynamic panels now open at one spot on the left (tl 10%, 12%), below the
      tab bar and clear of Guy's far-left icon row.** Panels still exactly on
      their old default follow on config load; moved and minimized panels stay.
      HUD-style widgets keep their spots (campaign, run timer, mechanics, map
      mods, map and essence scan, trade whispers, map check, price check, item
      search). Tab bar "Reset position" now goes to the same spot. Adversarial
      review done; its one real bug (reset position re-migrated for boss runs)
      is fixed. Validation: vitest 206 passed, vue-tsc and eslint clean. No docs
      needed: no documented positions.
    date: '2026-11-05T04:01:15.126Z'
    completionComment: true
    id: c-2026-11-05t04-01-15-126z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/93'
    date: '2026-11-05T04:01:23.115Z'
    id: a-2026-11-05t04-01-23-115z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T04:01:23.115Z'
branch: flux/WOKEPOET-20-open-dynamic-popups-in-the-empty-left-area-by-default
baselineCommit: 7896e164a82865073f89df1ab235131664e8c4a4
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/93'
swimlane: open-pr
---
> **TL;DR:** Panels opened from the dock or tab bar (PoB builds and friends) open at one spot on the left, below the top bar. Panels the user already moved stay put.

## Plan
- One shared default spot for dynamic panels, in `woke/ui/window-anchor.ts`.
- Each dynamic panel's first-open default uses it.
- On config load, panels still sitting exactly at their old default move to the new spot. Moved or minimized panels are untouched.
- HUD-style widgets keep their spots: campaign, run timer, mechanics, map mods, map/essence scan, trade whispers, map check, price check.
