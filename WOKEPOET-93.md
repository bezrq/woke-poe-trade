---
id: WOKEPOET-93
title: >-
  Boss runs: price jewels unidentified from trade, refresh rates, fill missing
  prices
status: Released
priority: High
effort: M
assignee: unassigned
tags:
  - bug
  - prices
  - mocks
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T11:03:57.518Z'
    comment: Created ticket.
    id: a-2026-11-05t11-03-57-518z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T11:04:28.722Z'
  - type: comment
    user: Agent
    comment: >-
      **Boss jewels now price unidentified from trade, estimates fill missing
      chances.** PR #166. Option A from the mock, chip beside the price so names
      keep their room. Adversarial review findings fixed (thin markets, gap on
      reopen, regional clients, mid-lookup league switch, hung request).
      Typecheck, lint, 2109 unit tests, build and Boss runs e2e pass locally. No
      docs needed: in-panel behaviour only. Awaiting merge.
    date: '2026-11-05T11:37:21.454Z'
    completionComment: true
    id: c-2026-11-05t11-37-21-454z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T11:37:21.455Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as bca53f2 and live on the dev copy. Verified through the real
      trade API: The Light of Meaning prices at 786c from 466 unidentified
      instant buyouts, with a ~20% estimated chance. No docs needed: in-panel
      behaviour only. Known limit: rare cards with no listings stay unpriced,
      and a few drops have no estimate.
    completionComment: true
    date: '2026-11-05T11:48:17.574Z'
    id: c-2026-11-05t11-48-17-574z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T11:48:17.908Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.739Z'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/166'
swimlane: null
diffSummary:
  - file: docs/.vitepress/theme/landing/Landing.vue
    additions: 363
    deletions: 131
  - file: docs/.vitepress/theme/landing/content.js
    additions: 65
    deletions: 23
  - file: docs/public/shots/hero.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/readme-banner.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-essence.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-loot.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-maps.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-price.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-boss-runs.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-boss.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-campaign-chip.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-campaign.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-filter-prices.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-filter-rules.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-map-mods.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-market.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-pob.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-regex.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-trade.webp
    additions: 0
    deletions: 0
  - file: testing/e2e/landing-shots.spec.ts
    additions: 211
    deletions: 4
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR:** Boss jewels drop unidentified, but Boss runs prices them from poe.ninja's single row, which is far below what unidentified copies sell for. Price them from unidentified instant-buyout trade listings instead, refresh stale drop rates, and fill drops poe.ninja doesn't list.

## Findings (Allflame, 2026-11-05)
poe.ninja has no unidentified rows: one row per jewel. Official trade, `identified: false`, status `securable`, sampled cheapest 10:

| Drop | poe.ninja | Unid instant buyout | Listings |
|---|---|---|---|
| Sublime Vision | 393c | 80 div | 12 |
| Forbidden Flesh | 30c | 5 div | 376 |
| The Light of Meaning | 28c | 2 div | 466 |
| Impossible Escape | 10c | 1 div | 404 |
| Watcher's Eye | 42c | 110c | 1155 |
| Thread of Hope | 10c | 15c | 164 |

`online` status returns almost nothing now (0 for Light of Meaning); `any` is polluted by offline bait. `securable` is the clean market. The existing "Unidentified on trade" link still uses `online`.

## Empty and stale data
- Saved prices are fresh: dev copy snapshot was 16 min old with the collector healthy. Not a pipeline fault.
- Uber Uber Elder has no rates anywhere: poe.how reports `hasRealDropRateData: false`, 0 runs, "No community data". Same for Exarch, Eater, Uber Exarch, Uber Eater, Uber Elder, Shaper, Atziri.
- Our rates are out of date for: Maven (poe.how now 100 runs, ours all null), Uber Sirus (606 runs, ours 200).
- Drops with no poe.ninja row show no price: Reliquary Keys, Void of the Elements, Auspicious Ambitions, A Fate Worse Than Death, Imperfect Memories, Triskaidekaphobia, Doppelganger Guise, plus Saresh's whole table.

## Plan
1. `unid` price mode, default for every jewel drop (Beauty, Dissolution of the Flesh, Forbidden Flame/Flesh, Impossible Escape, Melding of the Flesh, Rational Doctrine, Sublime Vision, The Light of Meaning, Thread of Hope, Watcher's Eye) plus existing variable items. Median of cheapest 10 `securable` unidentified listings, converted at the snapshot divine rate.
2. Lookups only for the opened boss, through the shared trade rate limiter, cached per league with a TTL; falls back to poe.ninja with a label until known or on failure.
3. Same lookup fills drops with no poe.ninja row.
4. Update Maven and Uber Sirus rates from poe.how; word the no-rate state plainly.
5. Unit tests for the pricing; e2e if the fake host supports it.

UI layout awaits Guy's pick from the mock.
