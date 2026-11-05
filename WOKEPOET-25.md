---
id: WOKEPOET-25
title: Redesign the price check window UI
status: In Progress
priority: Medium
effort: M
assignee: Agent
tags:
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:06:49.455Z'
    comment: Created ticket.
    id: a-2026-11-05t04-06-49-455z
  - type: activity
    user: Agent
    date: '2026-11-05T04:59:46.780Z'
    comment: >-
      PR #101 reviewed, findings fixed, local checks pass on 099f51ad
      (typecheck, lint, 264 unit tests, build, price-check e2e). gh pr merge
      from this PC was refused, so the cloud merge step was requested. The dev
      build is still to do, after the merge and when PoE isn't in front.
    id: a-2026-11-05t04-59-46-780z
---
> **TL;DR:** Overhaul the price check window's look: compact verdict at top, cleaner toolbar (Classic/Improved no longer clipped), tighter listings table with same-price grouping and stale de-emphasis, consistent fonts and spacing, PoE-flavored. All functions kept. WOKEPOET-22 owns moving/resizing the window, so this stays out of PriceCheckWindow's positioning.

Worked in the clone E:\Git\woke-poe-trade-pricecheck on `claude/price-check-redesign`.
