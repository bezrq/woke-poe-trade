---
id: WOKEPOET-53
title: 'Updates: prompt when the game is closed, rollback, signing, log errors'
status: Grooming
priority: Medium
effort: L
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
    date: '2026-11-05T08:10:00.136Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-00-136z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:00.136Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-00-136z
  - type: comment
    user: Agent
    comment: >-
      Update error logging merged in #150. Still open: prompting when the game
      is closed, rollback, and signing (Guy's decision, since it costs money).
    date: '2026-11-05T11:08:35.574Z'
    selfAttested: true
    id: c-2026-11-05t11-08-35-574z
---
> **TL;DR** C8. Update timing is fine, but there's no way back from a bad release, no code signing, update errors aren't logged (AppUpdater.ts), and it installs only on quit, which tray apps rarely do. Signing costs money, so that part is Guy's decision. Consider replacing the PowerShell call in runningGameLog, which antivirus tools dislike. Logging the error is an easy first step.
