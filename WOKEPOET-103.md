---
id: WOKEPOET-103
title: Remove permanent hints from the dock cards
status: Grooming
priority: None
effort: None
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T12:57:21.894Z'
    comment: Created ticket.
    id: a-2026-11-05t12-57-21-894z
  - type: comment
    user: Agent
    comment: >-
      Hints: 1 (none), 2 (show once) or 3 (behind a ?)? Recommended: 1. Mocks:
      https://claude.ai/artifact/8ijRB7sNGAW8r6NuRThEiX
    date: '2026-11-05T12:57:41.241Z'
    id: c-2026-11-05t12-57-41-241z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T12:57:41.241Z'
    comment: >-
      Hints: 1 (none), 2 (show once) or 3 (behind a ?)? Recommended: 1. Mocks:
      https://claude.ai/artifact/8ijRB7sNGAW8r6NuRThEiX
  - type: comment
    user: Agent
    comment: >-
      Guy asked for a Settings link on the hint and a way to dismiss both hints.
      PR #185.
    date: '2026-11-05T13:03:17.925Z'
    id: c-2026-11-05t13-03-17-925z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T13:03:17.925Z'
    comment: >-
      Guy asked for a Settings link on the hint and a way to dismiss both hints.
      PR #185.
  - type: activity
    user: Agent
    date: '2026-11-05T13:03:18.012Z'
    comment: Updated implementation link.
    id: a-2026-11-05t13-03-18-012z
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/185'
---
Guy: "what the hell is this for and why show it all the time". The Trades card always shows the "next step" key hint, and every dock card with a window shows "Shift + Space then click the icon for the full window".

Mocks (row of "hints" boards): https://claude.ai/artifact/8ijRB7sNGAW8r6NuRThEiX
1: no hints (recommended). 2: show once, close with ✕. 3: tucked behind a ?.

No code until Guy picks.
