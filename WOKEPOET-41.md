---
id: WOKEPOET-41
title: Lock the local server against other web pages
status: Grooming
priority: Critical
effort: M
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
    date: '2026-11-05T08:09:29.065Z'
    comment: Created as subtask of WOKEPOET-36.
---
> **TL;DR** F2. The websocket and HTTP server on fixed port 8585 check no Origin or Host, so any page in the player's browser can act as the overlay: type chat, overwrite settings, call handlers, and start a program through pob-open.

- main/src/server.ts upgrade handler and request listeners; proxy.ts; file-uploads.ts.
- Origin and Host allowlist, so other sites and DNS rebinding are refused. Keep the fixed port because browser storage is tied to it.
- pob-builds.ts openBuild: stop taking the program path from the request.
- Keep the tray's Open in Browser working, and Vite dev mode.
- Dev mode's own origin is localhost:5173.
