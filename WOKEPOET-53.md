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
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C8. Update timing is fine, but there's no way back from a bad release, no code signing, update errors aren't logged (AppUpdater.ts), and it installs only on quit, which tray apps rarely do. Signing costs money, so that part is Guy's decision. Consider replacing the PowerShell call in runningGameLog, which antivirus tools dislike. Logging the error is an easy first step.
