---
id: WOKEPOET-43
title: 'Save settings on quit, restart and while Settings is open'
status: Grooming
priority: High
effort: S
assignee: unassigned
tags:
  - bug
  - overlay-core
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:35.046Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-35-046z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:35.046Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-35-046z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.101Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-101z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/129'
---
> **TL;DR** F4, the known bug. "Change saved" only updates memory. The disk write happens when Settings hides, and saveConfig refuses while Settings is open, so Quit, tray Quit, Restart now, a crash or a power cut lose the changes.

- SettingsShell.vue apply/quit; Config.ts saveConfig exclusive guard (keep the guard for popups holding temporary state, but let a settings apply save).
- Main: before-quit asks the page to flush with a short timeout, and waits for ConfigStore's write queue.
- Cover tray Quit and update-and-restart too.
