---
id: WOKEPOET-81
title: 'Keep good poe.ninja prices through bad replies, and remove duplicate rows'
status: In Progress
priority: High
effort: S
assignee: unassigned
tags:
  - prices
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:48:12.781Z'
    comment: Created ticket.
    id: a-2026-11-05t10-48-12-781z
  - type: activity
    user: Agent
    date: '2026-11-05T11:07:05.358Z'
    comment: Updated implementation link.
    id: a-2026-11-05t11-07-05-358z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/157'
---
From the price data critique (https://claude.ai/artifact/1LS2iXRoSHqMWqpHg9fynH), steps 1 and 2. Guy said yes, 2026-11-05.

- A failed or partial reply keeps the last good prices and retries in minutes, not 31.
- A running download isn't cancelled by another request for prices, so no startup AbortError.
- Currency and Fragment are stored once.
- No UI.
