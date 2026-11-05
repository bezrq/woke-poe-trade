---
id: WOKEPOET-113
title: Client.txt warning never clears when the app starts before the game
status: In Progress
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
---
> **TL;DR** Start the app before PoE and the health card says "Client.txt not found" for the rest of the session, even once the log is being read.

**Cause.** `log-tail.ts` retries for about 10 s, then memoizes `path: null` for the app's life, and `followGameLog` only calls `onTail` once. Main recovers on its own when the game window attaches (`gameStarted`), but nothing tells the overlay. Confirmed live: the running overlay's `game-log-tail` returns the F: path with `clientLog: null`.

**Fix.**
- Main broadcasts when the watcher has a log open. `followGameLog` re-reads the tail on it, clears the warning and replays what it missed.
- `logTail` doesn't memoize a miss.
- Auto mode's stand-in before the game runs uses the full finder (registry, Steam libraries, drives), not just two C: folders.
- A set path that doesn't exist yet is watched until it appears.
