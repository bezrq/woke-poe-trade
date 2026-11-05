---
id: WOKEPOET-56
title: 'Measure a long session: memory and CPU log, bounded logs'
status: Done
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
    comment: Created ticket.
    id: a-2026-11-05t08-10-07-645z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:07.645Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-07-645z
  - type: activity
    user: Agent
    date: '2026-11-05T10:53:21.318Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-53-21-318z
  - type: comment
    user: Agent
    comment: >-
      Merged in #150. Judging leaks still needs a long play session, read from
      Settings > Performance.
    date: '2026-11-05T11:08:31.375Z'
    completionComment: true
    id: c-2026-11-05t11-08-31-375z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T11:08:31.375Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/150'
needsAction: null
---
> **TL;DR** C11. No long-run data exists: the sampler keeps 10 minutes. Logs grow without limit in both processes.

- Keep a coarse sample history (for example one per 5 minutes) so a play session shows a trend.
- Cap log text in RemoteLogger.ts and background/IPC.ts.
- Then judge leaks and FPS from real data.
