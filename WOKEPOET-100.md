---
id: WOKEPOET-100
title: 'Price check: show a column per ticked stat in the results list'
status: Done
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
    date: '2026-11-05T12:19:38.260Z'
    comment: Created ticket.
    id: a-2026-11-05t12-19-38-260z
  - type: comment
    user: Agent
    comment: >-
      Mocks: https://claude.ai/artifact/2M97pMbz5oVy5F7uMwX1V5 . Pick A plain
      columns, B columns against your item (recommended), or C stats on a second
      line. Which extras: click-to-sort, best-value highlight, mod tier letter.
      Nothing built yet.
    date: '2026-11-05T12:23:32.641Z'
    id: c-2026-11-05t12-23-32-641z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T12:23:32.641Z'
    comment: >-
      Mocks: https://claude.ai/artifact/2M97pMbz5oVy5F7uMwX1V5 . Pick A plain
      columns, B columns against your item (recommended), or C stats on a second
      line. Which extras: click-to-sort, best-value highlight, mod tier letter.
      Nothing built yet.
  - type: comment
    user: Agent
    comment: >-
      Guy picked B, with higher-than-yours in red and lower in green (flipped
      where lower is better).
    date: '2026-11-05T12:26:31.301Z'
    id: c-2026-11-05t12-26-31-301z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T12:26:31.301Z'
    comment: >-
      Guy picked B, with higher-than-yours in red and lower in green (flipped
      where lower is better).
  - type: comment
    user: Agent
    comment: >-
      Guy picked option B: higher than yours in red, lower in green, flipped
      where lower is better. Working in E:\Git\woke-stat-columns on
      claude/stat-columns.
    date: '2026-11-05T12:38:28.361Z'
    id: c-2026-11-05t12-38-28-361z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T12:38:28.361Z'
  - type: activity
    user: Agent
    date: '2026-11-05T13:13:02.590Z'
    comment: Updated implementation link.
    id: a-2026-11-05t13-13-02-590z
  - type: comment
    user: Agent
    comment: >-
      **Stat columns are in PR #186**, sent to the coordinator to merge:
      https://github.com/guybnd/woke-poe-trade/pull/186 . Clone
      E:\Git\woke-stat-columns, branch claude/stat-columns. Two adversarial
      reviews; typecheck, lint, 2340 unit tests, build and price check e2e pass
      on the merged code. No docs needed: no setting or API change.
    date: '2026-11-05T13:13:04.119Z'
    completionComment: true
    id: c-2026-11-05t13-13-04-119z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T13:13:04.119Z'
  - type: comment
    user: Agent
    comment: >-
      PR #186 merged as d28e9151. Not yet checked against live trade data,
      including eldritch implicits and shields.
    date: '2026-11-05T13:19:39.161Z'
    completionComment: true
    id: c-2026-11-05t13-19-39-161z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T13:19:39.161Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/186'
reviewState: null
---
Guy wants the price check results list to show a column for each stat he ticked as a filter (pdps, resistances, evasion...). Price stays visible, columns are capped at what's readable.

Today: Price, ilvl, Listed only (Body Armour check with Energy Shield 1210 ticked shows no ES column).

Mocks first; no code until Guy picks. Touches TradeListing.vue and the trade fetch mapping, near the critique thread's top-of-window trim.
