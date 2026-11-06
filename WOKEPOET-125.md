---
id: WOKEPOET-125
title: Three-way Corrupted chip in price check
status: In Progress
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T03:20:38.700Z'
    comment: Created ticket.
    id: a-2026-11-06t03-20-38-700z
  - type: activity
    user: Agent
    date: '2026-11-06T03:33:59.153Z'
    comment: Updated implementation link.
    id: a-2026-11-06t03-33-59-153z
  - type: activity
    user: Agent
    date: '2026-11-06T03:34:00.138Z'
    comment: >-
      PR #214 up, clone E:\Git\woke-corrupted-chip. Review finding fixed
      (poe.ninja fit follows the chip). Local checks pass; CI running; merge
      requested from the coordinator once green.
    id: a-2026-11-06t03-34-00-138z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/214'
---
Guy asked which chip setting searches both corrupted and not corrupted, then approved a three-way chip, with "make sure the chip stays not too big".

Today: value true and not exact sends no filter (both), but is labelled Corrupted. Corrupted-only is impossible except on magic jewels.

Change: click cycles Any / Corrupted / Not Corrupted. Openers: uncorrupted item on Not Corrupted, magic jewel on Corrupted, corrupted item on Any (same search as today).
