---
id: WOKEPOET-36
title: 'Overlay core critique: pick which fixes to start'
status: Grooming
priority: High
effort: None
assignee: unassigned
tags:
  - critique
  - overlay-core
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T07:36:24.682Z'
    comment: Created ticket.
    id: a-2026-11-05t07-36-24-682z
  - type: comment
    user: Agent
    comment: >-
      Which fixes should I start? Recommended: 1 (no chat send without a key
      press, focus check), 2 (lock the local server) and 3 (safe settings). Fix
      1 needs a mock for where "filter ready, reload?" shows; 2 and 3 need no
      UI. Report: https://claude.ai/artifact/Du1efrqGyeBo1LyyHQHtTw
    date: '2026-11-05T07:36:29.069Z'
    id: c-2026-11-05t07-36-29-069z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T07:36:29.069Z'
    comment: >-
      Which fixes should I start? Recommended: 1 (no chat send without a key
      press, focus check), 2 (lock the local server) and 3 (safe settings). Fix
      1 needs a mock for where "filter ready, reload?" shows; 2 and 3 need no
      UI. Report: https://claude.ai/artifact/Du1efrqGyeBo1LyyHQHtTw
swimlane: require-input
needsAction: null
---
Harsh critique of the overlay core, read-only on master be3d56a5.

Report: https://claude.ai/artifact/Du1efrqGyeBo1LyyHQHtTw

Top findings:
- F1: loot filter sends /itemfilter from a Client.txt line plus a timer, with no key pressed (store.ts:123-130, 796). Against GGG's macro rules.
- F2: local server has no Origin or Host check on a fixed port, so any web page can drive the app (server.ts:69-76, pob-builds.ts:107).
- F3: chat keys typed with no focus check (Shortcuts.ts:84-91).
- F4, F5: settings not saved until Settings closes; a damaged config silently resets, with no backup.
- F6: failed price check shows nothing.

No code changes until Guy picks. New UI needs mocks first.
