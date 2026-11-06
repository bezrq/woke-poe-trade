---
id: WOKEPOET-128
title: 'Drop counter: tracked items with +1 and a maps-run count'
status: Grooming
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
    date: '2026-11-06T03:53:16.184Z'
    comment: Created ticket.
    id: a-2026-11-06t03-53-16-184z
  - type: comment
    user: Agent
    comment: >-
      Which option: A tally card (recommended), B icon strip or C scoreboard?
      Mocks: https://claude.ai/artifact/SWjWD1MN7wBPLxiVVh3Pcy. Default unless
      told otherwise: counts run until reset.
    date: '2026-11-06T03:53:34.577Z'
    id: c-2026-11-06t03-53-34-577z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T03:53:34.577Z'
    comment: >-
      Which option: A tally card (recommended), B icon strip or C scoreboard?
      Mocks: https://claude.ai/artifact/SWjWD1MN7wBPLxiVVh3Pcy. Default unless
      told otherwise: counts run until reset.
swimlane: require-input
needsAction: null
---
Streamer-style counter: freeform list of items added from a search bar, quick +1 on each, and a maps-run count. Nothing permanently on screen, so it lives on a dock hover icon.

Mocks: https://claude.ai/artifact/SWjWD1MN7wBPLxiVVh3Pcy

Plan once picked: new woke module and widget with a DockItem, maps counted with isMapArea + countNewMap as Farming does, items searched through usePriceIndex plus any text, adding calls openOverlay since keys reach the game while the card is up. Awaiting Guy's pick of A, B or C.
