---
id: WOKEPOET-56
title: 'Measure a long session: memory and CPU log, bounded logs'
status: Grooming
priority: Medium
effort: S
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
    date: '2026-11-05T08:10:07.645Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** C11. No long-run data exists: the sampler keeps 10 minutes. Logs grow without limit in both processes.

- Keep a coarse sample history (for example one per 5 minutes) so a play session shows a trend.
- Cap log text in RemoteLogger.ts and background/IPC.ts.
- Then judge leaks and FPS from real data.
