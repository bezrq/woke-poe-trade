---
id: WOKEPOET-23
title: 'Show boss drops on the dock icon in boss arenas, including Atziri'
status: Done
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:04:40.528Z'
    comment: Created ticket.
    id: a-2026-11-05t04-04-40-528z
  - type: activity
    user: Agent
    date: '2026-11-05T04:05:01.852Z'
    comment: >-
      Created worktree for branch
      flux/WOKEPOET-23-show-boss-drops-on-the-dock-icon-in-boss-arenas-including-at
    event: worktree-created
    id: a-2026-11-05t04-05-01-852z
  - type: activity
    user: claude-code@guy-pc
    date: '2026-11-05T04:06:10.323Z'
    comment: Claimed by claude-code@guy-pc
    id: a-2026-11-05t04-06-10-323z
  - type: status_change
    from: Todo
    to: In Progress
    user: claude-code@guy-pc
    date: '2026-11-05T04:06:10.323Z'
  - type: comment
    user: Agent
    comment: >-
      **Boss arenas now light the Boss runs icon, with drops on its card.**
      Added Atziri and Uber Atziri (MapAtziri1, MapAtziri2), area id beats arena
      name, Boss runs now switches on the game log, and a click opens the arena
      boss on Drops. Adversarial review done, findings fixed. Typecheck, lint,
      unit tests, build and in-game E2E pass. No docs needed: no documented
      behaviour changes.
    date: '2026-11-05T04:15:21.367Z'
    completionComment: true
    id: c-2026-11-05t04-15-21-367z
  - type: activity
    user: Agent
    comment: 'PR created: https://github.com/guybnd/woke-poe-trade/pull/99'
    date: '2026-11-05T04:15:31.088Z'
    id: a-2026-11-05t04-15-31-088z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T04:15:31.088Z'
  - type: comment
    user: Agent
    comment: >-
      Boss arenas light the Boss runs icon with drops on its card, Atziri
      included. Reviewed adversarially, checks pass locally. No docs needed.
    completionComment: true
    date: '2026-11-05T04:16:08.422Z'
    id: c-2026-11-05t04-16-08-422z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T04:16:08.565Z'
branch: flux/WOKEPOET-23-show-boss-drops-on-the-dock-icon-in-boss-arenas-including-at
baselineCommit: a4c85a758a73046c8f54268117154f06f5082670
needsAction: null
reviewState: approved
lastReviewedCommit: f2801e7f1d42c01be8fb50f1b898a955cc8ff0df
lastReviewVerdict: approved
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/99'
swimlane: null
diffSummary:
  - file: renderer/src/web/woke/boss-runs/WidgetBossRuns.vue
    additions: 24
    deletions: 3
  - file: renderer/src/web/woke/boss-runs/bosses.ts
    additions: 55
    deletions: 1
  - file: renderer/src/web/woke/boss-runs/calc.ts
    additions: 3
    deletions: 1
  - file: renderer/src/web/woke/modules.ts
    additions: 1
    deletions: 1
  - file: renderer/src/web/woke/shared/boss-areas.ts
    additions: 4
    deletions: 0
  - file: renderer/src/web/woke/shared/zone.ts
    additions: 3
    deletions: 3
  - file: renderer/test/woke/game-log.test.ts
    additions: 16
    deletions: 0
  - file: testing/e2e/in-game.spec.ts
    additions: 69
    deletions: 0
---
> **TL;DR:** Entering a boss arena (Guy's screenshot: "You have entered The Alluring Abyss.") should light the Boss runs dock icon and show that boss's drops. The Alluring Abyss (Uber Atziri) and The Apex of Sacrifice (Atziri) aren't known yet, and shared arena names pick the wrong boss.

- Add Atziri and Uber Atziri bosses (MapAtziri1, MapAtziri2) with poe.how data.
- Area id beats arena name: "The Shaper's Realm" is both MapWorldsShapersRealm and MapWorldsElderArenaUber in Guy's Client.txt.
- Dock card lists the drops; clicking the icon opens the panel on that boss's Drops tab.
