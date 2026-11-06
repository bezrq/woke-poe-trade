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
    id: a-2026-11-05t13-53-58-879z
  - type: activity
    user: Agent
    date: '2026-11-05T13:59:29.207Z'
    comment: >-
      PR #192 clears the blockers: type check, stale OCR fixtures (map-real-01,
      -11), toolkit.spec load failure on Node 20. Unit 2429/2429 and OCR 132/132
      pass locally. Playwright sweep running to find what rotted while the step
      was skipped.
    id: a-2026-11-05t13-59-29-207z
  - type: activity
    user: Agent
    date: '2026-11-05T14:54:01.313Z'
    comment: >-
      #192 merged as e6ab107. Real bugs found behind flakes: hover state not
      told to a reloaded overlay (main/src/woke/hover.ts); apexcharts delayed
      redraw after the chart is removed (PriceTrend.vue). Noted, not fixed:
      after an overlay reload main keeps zones from owners the new page doesn't
      reuse; testing/ isn't covered by any typecheck; CI retries=1 can still
      hide flakes.
    pin: true
    id: a-2026-11-05t14-54-01-313z
  - type: comment
    user: Agent
    comment: >-
      Master CI is green (runs on a38e48d1 and bb81b36b). Should both Tests jobs
      become required checks? Recommended: yes, on master, without "branches up
      to date". Cost: merges wait about 7 minutes for CI, instead of going in on
      local checks alone.
    date: '2026-11-05T15:34:17.963Z'
    id: c-2026-11-05t15-34-17-963z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T15:34:17.963Z'
    comment: >-
      Master CI is green (runs on a38e48d1 and bb81b36b). Should both Tests jobs
      become required checks? Recommended: yes, on master, without "branches up
      to date". Cost: merges wait about 7 minutes for CI, instead of going in on
      local checks alone.
  - type: comment
    user: Agent
    comment: >-
      Guy said go: CI required on master (ruleset 26662541), no local runner,
      package cache in #208.
    date: '2026-11-06T00:57:34.968Z'
    id: c-2026-11-06t00-57-34-968z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T00:57:34.968Z'
    comment: >-
      Guy said go: CI required on master (ruleset 26662541), no local runner,
      package cache in #208.
swimlane: null
needsAction: null
---
Master CI (Tests workflow) has been red and merges went past it. Goal: fix root causes, no skips, make real flakes deterministic, then propose CI as a required check.

Known at 03581e4a (run 42038824826):
- Unit job stops at typecheck:test: bump-data-version.mjs implicit any, unused @ts-expect-error in live-data.test.ts. Unit tests and main typecheck never run after it.
- Game job stops at OCR tests: map-real-01 and map-real-11. Playwright, perf and Electron smoke never run after it, so their state on CI is unknown.
- Reported separately: loot-filter spec :256, price-check.spec.ts:23 drag flake, item-tip.spec.ts:104 (from #184, owned by the Loot filter thread), price-stat-columns.

Working clone: E:\Git\woke-ci-fix.
