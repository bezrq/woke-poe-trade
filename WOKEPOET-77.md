---
id: WOKEPOET-77
title: Remove the redundant old map stat list from Item info settings
status: Grooming
priority: Low
effort: None
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:15:41.696Z'
    comment: Created ticket.
    id: a-2026-11-05t10-15-41-696z
  - type: comment
    user: Agent
    comment: >-
      Which one: A remove the list from settings and keep the old card
      (recommended), B full merge into Map mods including heist contracts,
      blueprints and charts, or C keep it collapsed and labelled? All 9 of Guy's
      marks are already in Map mods with matching ratings, so no migration is
      needed.
    date: '2026-11-05T10:15:44.794Z'
    id: c-2026-11-05t10-15-44-794z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T10:15:44.794Z'
    comment: >-
      Which one: A remove the list from settings and keep the old card
      (recommended), B full merge into Map mods including heist contracts,
      blueprints and charts, or C keep it collapsed and labelled? All 9 of Guy's
      marks are already in Map mods with matching ratings, so no migration is
      needed.
swimlane: require-input
needsAction: null
---
Settings > Item info & map check still shows APT's map stat list (343 stats with warning, danger and ok marks).

**Findings (origin/master 6f950541)**
- With Map mods on, map, invitation and logbook checks use Map mods ratings (`WidgetItemCheck.vue`, `check.ts`), so edits to this list do nothing for them.
- The marks were imported into Map mods once (`aptImported`). Later edits don't sync.
- The list's marks are still read in two cases: heist contracts, blueprints and charts, which Map mods doesn't rate, and any map-like item when the Map mods module is off. Both open `MapCheck.vue`, which has click-to-rate buttons of its own.
- Map mods has no heist-exclusive mods (`data.ts`), so those exist only in the old list.

**Options**
- A: remove the list from settings, keep the old card and its click-to-rate. No migration.
- B: full merge: Map mods rates heist contracts, blueprints and charts too; delete the old card.
- C: keep the list, collapsed, labelled as used only for heist and when Map mods is off.

Waiting on Guy's pick; mock before building.
