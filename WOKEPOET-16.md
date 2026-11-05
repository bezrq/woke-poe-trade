---
id: WOKEPOET-16
title: Fix map Current rolls max error and make the roll bar set min and max by click
status: In Progress
priority: High
effort: S
assignee: unassigned
tags:
  - bug
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T03:30:52.534Z'
    comment: Created ticket.
    id: a-2026-11-05t03-30-52-534z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T03:31:09.279Z'
  - type: activity
    user: Agent
    date: '2026-11-05T03:31:14.945Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-16-fix-map-current-rolls-max-error-and-make-the-roll-bar-set-mi
    event: worktree-created
    id: a-2026-11-05t03-31-14-945z
needsAction: null
branch: flux/WOKEPOET-16-fix-map-current-rolls-max-error-and-make-the-roll-bar-set-mi
baselineCommit: a58632b0379617cbbaaebd67ac298914035552dd
---
> **TL;DR:** The Current rolls preset on a map sends a max of ~9e15 and the trade site rejects the search. Fix the preset for stats with no upper limit, and make the roll bar set min on left-click and max on right-click.

## Cause
Map, chart and heist property filters use `roll: { min: 0, max: Number.MAX_SAFE_INTEGER }` as a placeholder, which becomes `roll.bounds`. `presetRange` in `renderer/src/web/woke/price-insight/roll-presets.ts` treats that as a tier range, so its window is huge: min clamps to 0 and max comes out at about 9e15.

## Plan
- Current rolls on an open-ended stat: min at the item's value, max empty.
- Roll bar (`renderer/src/web/ui/StatRollSlider.vue`): left-click/drag sets min, right-click/drag sets max, in every mode.
- Tests for both.
