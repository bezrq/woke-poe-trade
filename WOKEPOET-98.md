---
id: WOKEPOET-98
title: 'woke-dev: wait for Vite, and catch an overlay page that failed to load'
status: Done
priority: Medium
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
    date: '2026-11-05T12:03:00.169Z'
    comment: Created ticket.
    id: a-2026-11-05t12-03-00-169z
  - type: activity
    user: Agent
    date: '2026-11-05T12:03:00.169Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t12-03-00-169z
  - type: comment
    user: Agent
    comment: 'Merged in #173. Its restart path first runs on the next woke-dev.'
    date: '2026-11-05T12:40:15.332Z'
    completionComment: true
    id: c-2026-11-05t12-40-15-332z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T12:40:15.332Z'
needsAction: null
---
> **TL;DR** `woke-dev master` let Electron load before Vite was serving: ERR_CONNECTION_REFUSED, a chrome-error page, and status still said RUNNING. Another thread recovered it over CDP.

- scripts/woke-dev.ps1: the port check can see the old Vite while it's dying. Wait for the ports to free, then for a real HTTP answer from Vite.
- Status checks the page over the debug port and reports a failed one.
- OverlayWindow: in dev mode, retry a failed page load.
- E:\Git\woke-dev.ps1 is a copy outside the clone, so refresh it after merging.
