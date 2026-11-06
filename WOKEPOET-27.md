---
id: WOKEPOET-27
title: 'Boss runs card leads with drops and chances, run stats only with logged kills'
status: Released
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:30:06.926Z'
    comment: Created ticket.
    id: a-2026-11-05t04-30-06-926z
  - type: activity
    user: Agent
    date: '2026-11-05T04:30:14.938Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-27-boss-runs-card-leads-with-drops-and-chances-run-stats-only-w
    event: worktree-created
    id: a-2026-11-05t04-30-14-938z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T04:30:14.962Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t04-30-14-962z
  - type: status_change
    from: Todo
    to: In Progress
    user: claude-code@guy-pc
    date: '2026-11-05T04:30:14.962Z'
  - type: activity
    user: Event Horizon
    date: '2026-11-05T05:00:27.173Z'
    comment: Claim by claude-code@guy-pc expired (no heartbeat for 30 min)
    id: a-2026-11-05t05-00-27-173z
  - type: status_change
    from: In Progress
    to: Todo
    user: Event Horizon
    date: '2026-11-05T05:00:27.175Z'
  - type: comment
    user: Agent
    comment: >-
      **The Boss runs card leads with drops and chances; run stats wait for
      logged kills.** Drop lists added for 7 bosses plus new normal Sirus and
      Venarius; only The Feared has none. Arena tier now comes from area level
      (85 is uber). Adversarial review done, findings fixed apart from normal
      and uber sharing a price for one item. Typecheck, lint, unit tests, build
      and boss E2E pass. No docs needed.
    date: '2026-11-05T05:08:26.576Z'
    completionComment: true
    id: c-2026-11-05t05-08-26-576z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/107'
    date: '2026-11-05T05:08:36.317Z'
    id: a-2026-11-05t05-08-36-317z
  - type: status_change
    from: Todo
    to: Ready
    user: Agent
    date: '2026-11-05T05:08:36.318Z'
  - type: comment
    user: Agent
    comment: >-
      Boss runs card leads with drops and chances; run stats wait for logged
      kills. Reviewed adversarially, checks pass locally. No docs needed.
    completionComment: true
    date: '2026-11-05T05:09:06.556Z'
    id: c-2026-11-05t05-09-06-556z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T05:09:06.944Z'
  - type: activity
    user: Agent
    date: '2026-11-05T05:09:21.659Z'
    comment: Updated implementation link.
    id: a-2026-11-05t05-09-21-659z
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:49.054Z'
branch: flux/WOKEPOET-27-boss-runs-card-leads-with-drops-and-chances-run-stats-only-w
baselineCommit: 902cbb4b8e52d836935a1829cc7263b093bbc787
needsAction: null
reviewState: approved
lastReviewedCommit: 4cb1b27a5c9c5d6436e6d5f7963921a246e14abc
lastReviewVerdict: approved
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/107'
swimlane: null
diffSummary:
  - file: renderer/src/web/woke/boss-runs/WidgetBossRuns.vue
    additions: 21
    deletions: 14
  - file: renderer/src/web/woke/boss-runs/bosses.ts
    additions: 141
    deletions: 14
  - file: renderer/src/web/woke/boss-runs/calc.ts
    additions: 25
    deletions: 2
  - file: renderer/src/web/woke/shared/boss-areas.ts
    additions: 2
    deletions: 2
  - file: renderer/test/woke/boss-runs-card.test.ts
    additions: 57
    deletions: 0
  - file: renderer/test/woke/game-log.test.ts
    additions: 4
    deletions: 0
  - file: testing/e2e/in-game.spec.ts
    additions: 5
    deletions: 0
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** Guy's feedback on the arena icon card: show the boss's drops and drop chances first, and show entry and run stats only when kills are logged. Exarch and other bosses have empty drop lists, so fill them from poe.how.
