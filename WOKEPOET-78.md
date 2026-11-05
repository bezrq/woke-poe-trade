---
id: WOKEPOET-78
title: Item tooltip wherever an item name appears
status: Grooming
priority: Medium
effort: None
assignee: unassigned
tags:
  - feature
  - ui
  - search
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:24:16.319Z'
    comment: Created ticket.
    id: a-2026-11-05t10-24-16-319z
  - type: activity
    user: Agent
    date: '2026-11-05T10:28:08.356Z'
    comment: Updated description.
    id: a-2026-11-05t10-28-08-356z
  - type: comment
    user: Agent
    comment: >-
      Pick for search: A hover only (recommended) or B hover plus a card in the
      right pane? Also confirm the module list on the mock's Where it goes
      board. https://claude.ai/artifact/RkNAKrzGgZqAEKv7bXMmSz
    date: '2026-11-05T10:28:09.069Z'
    id: c-2026-11-05t10-28-09-069z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T10:28:09.069Z'
    comment: >-
      Pick for search: A hover only (recommended) or B hover plus a card in the
      right pane? Also confirm the module list on the mock's Where it goes
      board. https://claude.ai/artifact/RkNAKrzGgZqAEKv7bXMmSz
swimlane: require-input
needsAction: null
---
Guy's report: hovering results in universal search (Alt+P), such as Dying Sun, shows no item tooltip. He wants the shared v-item-tip on item names across modules.

Mocks and full audit: https://claude.ai/artifact/RkNAKrzGgZqAEKv7bXMmSz

Search options: A hover only (recommended); B hover plus the item as a card in the right pane, which also follows the arrow keys.

Adding: Search (results, Other items, pins), Market (multi-price header, alert card), Trade offers, Trade search live results, Scarab flip, Lab gems, Mechanics scarabs and Best line, Essence scan, Boss runs, Session analytics "before the first map", filter tier icons, Campaign gems, Price check unidentified picker, old item search.

Build notes: scarab and essence rows shorten names, so pass the full name. Trade whispers join name and base, so split them (same word walk as artFor in WidgetTrade.vue); rare falls back to base. Multi-price rows show the range in the strip. Search's "Other items" should use refName for non-English clients.

Left out: item in hand, filter preview labels, non-items. Build panel keeps its own tooltip. 1,140 of 4,831 priced names have no text and show name and price only.

No code until Guy picks.
