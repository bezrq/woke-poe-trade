---
id: WOKEPOET-37
title: 'Price check: fixes from the veteran critique'
status: Grooming
priority: High
effort: None
assignee: unassigned
tags:
  - woke
  - price-check
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T07:38:40.132Z'
    comment: Created ticket.
    id: a-2026-11-05t07-38-40-132z
  - type: comment
    user: Agent
    comment: >-
      Which fixes should I start? I suggest fixes 1 to 4 from the report:
      https://claude.ai/artifact/NciFiZFWAd2WUQJBUrJhqU
    date: '2026-11-05T07:38:52.721Z'
    id: c-2026-11-05t07-38-52-721z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T07:38:52.721Z'
    comment: >-
      Which fixes should I start? I suggest fixes 1 to 4 from the report:
      https://claude.ai/artifact/NciFiZFWAd2WUQJBUrJhqU
swimlane: require-input
needsAction: null
---
Harsh critique of the price check on master be3d56a5: https://claude.ai/artifact/NciFiZFWAd2WUQJBUrJhqU

Suggested fix order:
1. Respect rate limits (penalty, Retry-After, countdown on Retry)
2. Stop the false verdicts (tick T1 and T2 on rares, no price when a rare's search has no mods)
3. Keep poe.ninja out of rolled, corrupted and Foulborn searches; never headline below the cheapest trusted listing
4. Use the searched league's rate and prices; warn on unconverted divines and a blank account name
5. Honest confidence: count sellers, thin-market bait, trusted Sell fast floor
6. Small bugs: life seed, partial-page errors, stale bulk errors, flooring, perfect-base tick, refresh
7. Show more, mocks first: listing mods, corrupted column, bulk verdict, data age, real sales

Read-only until Guy picks. New UI needs mocks first.
