---
id: WOKEPOET-16
title: Fix map Current rolls max error and make the roll bar set min and max by click
status: Done
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
  - type: comment
    user: Agent
    comment: >-
      **Current rolls on maps now searches from each roll up with no max, and
      the roll bar sets min on left-click and max on right-click.** PR:
      https://github.com/guybnd/woke-poe-trade/pull/87


      Validated: `renderer/test/woke/roll-controls.test.ts` (map test fails
      without the fix), full suite 167/167, vue-tsc and eslint clean, bar
      clicked in Chromium with the real FilterModifier. No live trade search was
      sent. No docs needed: the bar has a tooltip and no doc covers it.


      Leftover: untracked `renderer/__harness.html` and `renderer/__harness.ts`
      remain in this worktree (not committed) because the delete was held by a
      safety hook. They go when the worktree is removed.
    date: '2026-11-05T03:38:19.943Z'
    completionComment: true
    id: c-2026-11-05t03-38-19-943z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/87'
    date: '2026-11-05T03:38:24.642Z'
    id: a-2026-11-05t03-38-24-642z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T03:38:24.642Z'
  - type: comment
    user: Agent
    comment: >-
      PR squash-merged for branch
      `flux/WOKEPOET-16-fix-map-current-rolls-max-error-and-make-the-roll-bar-set-mi`
      — advanced to Done.
    date: '2026-11-05T03:42:52.211Z'
    id: c-2026-11-05t03-42-52-211z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T03:42:52.211Z'
  - type: activity
    user: Agent
    date: '2026-11-05T03:47:22.926Z'
    comment: Task worktree automatically reclaimed (ready-or-terminal-status)
    id: a-2026-11-05t03-47-22-926z
needsAction: null
branch: flux/WOKEPOET-16-fix-map-current-rolls-max-error-and-make-the-roll-bar-set-mi
baselineCommit: a58632b0379617cbbaaebd67ac298914035552dd
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/87'
swimlane: null
---
> **TL;DR:** The Current rolls preset on a map sends a max of ~9e15 and the trade site rejects the search. Fix the preset for stats with no upper limit, and make the roll bar set min on left-click and max on right-click.

## Cause
Map, chart and heist property filters use `roll: { min: 0, max: Number.MAX_SAFE_INTEGER }` as a placeholder, which becomes `roll.bounds`. `presetRange` in `renderer/src/web/woke/price-insight/roll-presets.ts` treats that as a tier range, so its window is huge: min clamps to 0 and max comes out at about 9e15.

## Plan
- Current rolls on an open-ended stat: min at the item's value, max empty.
- Roll bar (`renderer/src/web/ui/StatRollSlider.vue`): left-click/drag sets min, right-click/drag sets max, in every mode.
- Tests for both.
