---
id: WOKEPOET-41
title: Lock the local server against other web pages
status: Released
priority: Critical
effort: M
assignee: unassigned
tags:
  - bug
  - overlay-core
createdBy: Agent
updatedBy: Guy
parentId: WOKEPOET-36
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:29.065Z'
    comment: Created ticket.
    id: a-2026-11-05t08-09-29-065z
  - type: activity
    user: Agent
    date: '2026-11-05T08:09:29.065Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-09-29-065z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.042Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-042z
  - type: comment
    user: Agent
    comment: 'Merged in #128.'
    date: '2026-11-05T10:00:53.795Z'
    completionComment: true
    id: c-2026-11-05t10-00-53-795z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:53.795Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:48.343Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/128'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** F2. The websocket and HTTP server on fixed port 8585 check no Origin or Host, so any page in the player's browser can act as the overlay: type chat, overwrite settings, call handlers, and start a program through pob-open.

- main/src/server.ts upgrade handler and request listeners; proxy.ts; file-uploads.ts.
- Origin and Host allowlist, so other sites and DNS rebinding are refused. Keep the fixed port because browser storage is tied to it.
- pob-builds.ts openBuild: stop taking the program path from the request.
- Keep the tray's Open in Browser working, and Vite dev mode.
- Dev mode's own origin is localhost:5173.
