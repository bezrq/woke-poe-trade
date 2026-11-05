---
id: WOKEPOET-58
title: Guard against newer configs and a failed upgrade (no blank overlay)
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
    date: '2026-11-05T08:10:12.997Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-12-997z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:12.997Z'
    comment: Created as subtask of WOKEPOET-36.
    id: a-2026-11-05t08-10-12-997z
  - type: activity
    user: Agent
    date: '2026-11-05T08:51:16.165Z'
    comment: Updated implementation link.
    id: a-2026-11-05t08-51-16-165z
  - type: comment
    user: Agent
    comment: 'Merged in #129.'
    date: '2026-11-05T10:00:56.794Z'
    completionComment: true
    id: c-2026-11-05t10-00-56-794z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T10:00:56.794Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/129'
needsAction: null
---
> **TL;DR** C13. No check for a config newer than the app (still a TODO), and if upgradeConfig throws, nothing catches it and the page stays blank.

- Config.ts initConfig: catch upgrade failures, keep the old file aside, start on defaults with a message.
- Back up the config before each version upgrade.
- Warn when configVersion is newer than the app.
