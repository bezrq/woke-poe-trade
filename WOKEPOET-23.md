---
id: WOKEPOET-23
title: 'Show boss drops on the dock icon in boss arenas, including Atziri'
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
branch: flux/WOKEPOET-23-show-boss-drops-on-the-dock-icon-in-boss-arenas-including-at
baselineCommit: a4c85a758a73046c8f54268117154f06f5082670
needsAction: null
claim:
  holder: claude-code@guy-pc
  claimedAt: '2026-11-05T04:06:10.323Z'
  expiresAt: '2026-11-05T04:36:10.323Z'
---
> **TL;DR:** Entering a boss arena (Guy's screenshot: "You have entered The Alluring Abyss.") should light the Boss runs dock icon and show that boss's drops. The Alluring Abyss (Uber Atziri) and The Apex of Sacrifice (Atziri) aren't known yet, and shared arena names pick the wrong boss.

- Add Atziri and Uber Atziri bosses (MapAtziri1, MapAtziri2) with poe.how data.
- Area id beats arena name: "The Shaper's Realm" is both MapWorldsShapersRealm and MapWorldsElderArenaUber in Guy's Client.txt.
- Dock card lists the drops; clicking the icon opens the panel on that boss's Drops tab.
