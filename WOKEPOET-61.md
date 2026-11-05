---
id: WOKEPOET-61
title: 'Hover zones after display changes, and test mixed DPI'
status: Grooming
priority: Low
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
    date: '2026-11-05T08:10:20.063Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C16. No display-metrics-changed handling, and hover zones can lag by up to 2 s after a move (woke/shared/hover.ts). Mixed DPI is untested. Resend zones on display changes, and test on two monitors.
