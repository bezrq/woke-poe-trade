---
id: WOKEPOET-75
title: 'Expedition dock card: fix missing prices, show what helps mid-map'
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
    date: '2026-11-05T10:02:21.931Z'
    comment: Created ticket.
    id: a-2026-11-05t10-02-21-931z
  - type: comment
    user: Agent
    comment: >-
      Pick a card: https://claude.ai/artifact/JoM2avsZfLzBQLcM6Brxxi. A prices
      only, B highlights the vendor in this encounter plus week change
      (recommended), C no hover card. Also: remove scarab chips and arrows from
      every mechanic's card (recommended). Data fixes ship with any pick.
    date: '2026-11-05T10:03:47.935Z'
    id: c-2026-11-05t10-03-47-935z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T10:03:47.935Z'
    comment: >-
      Pick a card: https://claude.ai/artifact/JoM2avsZfLzBQLcM6Brxxi. A prices
      only, B highlights the vendor in this encounter plus week change
      (recommended), C no hover card. Also: remove scarab chips and arrows from
      every mechanic's card (recommended). Data fixes ship with any pick.
swimlane: require-input
needsAction: null
---
Dock hover card for Expedition shows "poe.ninja has no prices for these" plus two scarab chips.

Findings (checked against live poe.ninja Allflame data, 2026-11-05):
- `mechanics/data.ts` filters the vendor currency group on type `Currency`, but poe.ninja lists them under `Artifact`. So the group is always empty.
- Vendor tags are wrong: Scrap Metal belongs to Rog and Astragali to Gwennen (poe-vault guide, July 2026).
- Same empty first group on the glance card: Ultimatum ("Inscribed Ultimatum") and Sanctum ("Tome") match nothing on poe.ninja.
- Scarab chips can't be acted on mid-map; `< >` arrows cycle unrelated mechanics.

Mocks first; no UI code until Guy picks.
