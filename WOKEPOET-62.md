---
id: WOKEPOET-62
title: 'Test whether holding a hotkey repeats it, and guard if so'
status: Grooming
priority: Medium
effort: XS
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
    date: '2026-11-05T08:10:22.553Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C17. The hotkey callback has no repeat guard (Shortcuts.ts register), and GGG's rules allow one action per press. Whether Windows repeats these hotkeys needs a test. A guard keyed on the uIOhook keyup is cheap either way: ignore a hotkey until its key has been released.
