---
id: WOKEPOET-112
title: Get master CI green and make it a required check
status: Grooming
priority: High
effort: None
assignee: Agent
tags:
  - bug
  - tooling
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:53:58.879Z'
    comment: Created ticket.
---
Master CI (Tests workflow) has been red and merges went past it. Goal: fix root causes, no skips, make real flakes deterministic, then propose CI as a required check.

Known at 03581e4a (run 42038824826):
- Unit job stops at typecheck:test: bump-data-version.mjs implicit any, unused @ts-expect-error in live-data.test.ts. Unit tests and main typecheck never run after it.
- Game job stops at OCR tests: map-real-01 and map-real-11. Playwright, perf and Electron smoke never run after it, so their state on CI is unknown.
- Reported separately: loot-filter spec :256, price-check.spec.ts:23 drag flake, item-tip.spec.ts:104 (from #184, owned by the Loot filter thread), price-stat-columns.

Working clone: E:\Git\woke-ci-fix.
