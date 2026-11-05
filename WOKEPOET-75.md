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
---
Dock hover card for Expedition shows "poe.ninja has no prices for these" plus two scarab chips.

Findings (checked against live poe.ninja Allflame data, 2026-11-05):
- `mechanics/data.ts` filters the vendor currency group on type `Currency`, but poe.ninja lists them under `Artifact`. So the group is always empty.
- Vendor tags are wrong: Scrap Metal belongs to Rog and Astragali to Gwennen (poe-vault guide, July 2026).
- Same empty first group on the glance card: Ultimatum ("Inscribed Ultimatum") and Sanctum ("Tome") match nothing on poe.ninja.
- Scarab chips can't be acted on mid-map; `< >` arrows cycle unrelated mechanics.

Mocks first; no UI code until Guy picks.
