---
id: WOKEPOET-51
title: 'Item and stat data the app updates by itself, without a release or restart'
status: In Progress
priority: High
effort: M
assignee: unassigned
tags:
  - feature
  - overlay-core
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:54.594Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-54-594z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:54.594Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-54-594z
  - type: activity
    user: Agent
    date: '2026-11-05T12:44:05.038Z'
    comment: >-
      Updated title. Updated description. Changed priority to High. Changed
      effort to M.
    id: a-2026-11-05t12-44-05-038z
  - type: comment
    user: Agent
    comment: Guy picked the downloader over release-only.
    date: '2026-11-05T12:44:23.698Z'
    id: c-2026-11-05t12-44-23-698z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T12:44:23.698Z'
needsAction: null
---
> **TL;DR** Guy wants this soon. Item and stat data stays in our repo. Once new data is merged, the app picks it up by itself, with no release, installer or restart.

## Plan
1. Add a small version file for the data in the repo, read online at startup and on a timer.
2. If it's newer, download `renderer/public/data/<lang>/items.ndjson` and `stats.ndjson` for the current language into user data, rebuilding the search indexes (`make-index-files.mjs` builds them at build time today).
3. Check the download loads before using it. On any failure, keep what's there; the built-in data is always the last resort.
4. Swap it in live with `Data.loadForLang`, the path a language change already uses (`renderer/src/assets/data/index.ts`, `main.ts`).
5. Serve the downloaded files in place of the bundled ones, in dev and packaged builds.

## Constraints
- The repo has no tool to generate this data. It comes from Awakened PoE Trade's "update data" commits (ours is from 2026-09-09), so new data still waits on them and on a merge. Building our own generator is a separate, bigger job.
- The app must never run a check or download in a way that affects the game: no hitch during a price check.
- Only fetch from this repo, and treat the downloaded text as data.
- Unconfirmed: that `loadForLang` swaps cleanly with a window open. Test this first.

## Also from the critique
- On an unknown item, fall back to raw text and a trade link instead of a dead end.
- Game clients in languages the app doesn't offer.
These can be separate PRs.
