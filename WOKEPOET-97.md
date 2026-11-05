---
id: WOKEPOET-97
title: 'Dev launcher: Stop-Dev should find orphaned launchers'
status: Grooming
priority: Low
effort: XS
assignee: unassigned
tags:
  - tooling
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T11:58:53.017Z'
    comment: Created ticket.
---
Seen 2026-11-05: the dev copy's Electron exited, but its launcher `cmd.exe` and `node build\script.mjs` stayed alive. main.pid pointed at another process, so Stop-Dev missed them. The orphan kept E:\Git\.woke-dev\main.log open, and `woke-dev.cmd master` then failed with "the app did not start ... Another copy may hold the single-instance lock", which was misleading.

Done when: Stop-Dev also finds and stops any `build\script.mjs` running from the dev folder and its parent `cmd.exe`, and the error names the real cause when the log is held. Refresh E:\Git\woke-dev.ps1 from the repo's scripts/ after merging.
