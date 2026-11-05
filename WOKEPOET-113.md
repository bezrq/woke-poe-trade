---
id: WOKEPOET-113
title: Client.txt warning never clears when the app starts before the game
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
    date: '2026-11-05T14:18:36.862Z'
    comment: Created ticket.
    id: a-2026-11-05t14-18-36-862z
  - type: activity
    user: Agent
    date: '2026-11-05T14:33:38.515Z'
    comment: Updated implementation link.
    id: a-2026-11-05t14-33-38-515z
  - type: comment
    user: Agent
    comment: >-
      PR #195 is up and queued for merge. Review findings are fixed, and unit
      tests, e2e and builds pass. Going live needs the merge and then a dev copy
      restart. Not tested in game.
    date: '2026-11-05T14:33:40.070Z'
    completionComment: true
    id: c-2026-11-05t14-33-40-070z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T14:33:40.070Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as #195 (7ac6039) and live on the dev copy at 9ba41cad. After the
      restart with the game already running, the overlay reads the F: log and
      shows no health problems. Starting the app before the game hasn't been
      watched live.
    date: '2026-11-05T14:54:39.156Z'
    completionComment: true
    id: c-2026-11-05t14-54-39-156z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T14:54:39.156Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/195'
needsAction: null
reviewState: null
---
> **TL;DR** Start the app before PoE and the health card says "Client.txt not found" for the rest of the session, even once the log is being read.

**Cause.** `log-tail.ts` retries for about 10 s, then memoizes `path: null` for the app's life, and `followGameLog` only calls `onTail` once. Main recovers on its own when the game window attaches (`gameStarted`), but nothing tells the overlay. Confirmed live: the running overlay's `game-log-tail` returns the F: path with `clientLog: null`.

**Fix.**
- Main broadcasts when the watcher has a log open. `followGameLog` re-reads the tail on it, clears the warning and replays what it missed.
- `logTail` doesn't memoize a miss.
- Auto mode's stand-in before the game runs uses the full finder (registry, Steam libraries, drives), not just two C: folders.
- A set path that doesn't exist yet is watched until it appears.
