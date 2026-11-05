---
id: WOKEPOET-104
title: Redesign the price check filter header (C3)
status: Ready
priority: Medium
effort: M
assignee: unassigned
tags:
  - ui
  - price-check
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:12:06.848Z'
    comment: Created ticket.
    id: a-2026-11-05t13-12-06-848z
  - type: activity
    user: Agent
    date: '2026-11-05T13:39:05.892Z'
    comment: Updated implementation link.
    id: a-2026-11-05t13-39-05-892z
  - type: comment
    user: Agent
    comment: >-
      **C3 header built as PR #188, queued for merge.** Title shows the search
      target with a Generic / Base switch, tiles change by scroll or drag, stat
      count and roll presets share one header. Adversarial review findings
      fixed. Lint, types, 2425 unit tests, build and the price-check,
      stat-columns, tab-rail and pob-builds e2e specs pass. No docs needed: no
      reference doc covers this panel. Not yet tried in the game. The
      coordinator is handling the dev build update.
    date: '2026-11-05T13:39:07.904Z'
    completionComment: true
    id: c-2026-11-05t13-39-07-904z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T13:39:07.904Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/188'
needsAction: null
---
> TL;DR: Guy picked C3 from the mocks. The title shows what's being searched, a Generic / Base switch changes it, Links and iLvl become tiles beside it, and Stats plus the roll presets become one header on the stat list.

Mocks: https://claude.ai/artifact/WPzs5hoFtYK7GSQKRAsKCZ (bottom row, C3)

- Title: category ("Body Armour") on Generic, base type ("Twilight Regalia") on Base. No rare name, no "Category:" prefix.
- Numeric filters become value tiles beside the title; on/off filters stay chips under it.
- Stats count, Pseudo / Base item tabs and Low/Approx/High/By value share one header row.
- "rough guess" becomes a ≈ on By value, with the source on hover.
