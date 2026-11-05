---
id: WOKEPOET-75
title: 'Expedition dock card: fix missing prices, show what helps mid-map'
status: Done
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
  - type: comment
    user: Agent
    comment: 'Guy picked B, with icons.'
    date: '2026-11-05T10:05:25.425Z'
    id: c-2026-11-05t10-05-25-425z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T10:05:25.425Z'
    comment: 'Guy picked B, with icons.'
  - type: activity
    user: Agent
    date: '2026-11-05T10:20:19.312Z'
    comment: >-
      PR https://github.com/guybnd/woke-poe-trade/pull/146, reviewed and checked
      locally. Merge requested through the cloud thread. Known limit left in:
      the last NPC to speak decides the card, so a map with Tujen and Einhar can
      show Bestiary.
    id: a-2026-11-05t10-20-19-312z
  - type: comment
    user: Agent
    comment: >-
      Merged as 406cfa5 (#146), on the dev copy. Card B with icons: Artifact
      prices, vendor who spoke on top (kept through a portal), week's change, no
      chips or arrows on any mechanic's card. Known limit: the last NPC to speak
      decides the card. No docs needed.
    date: '2026-11-05T10:29:52.136Z'
    completionComment: true
    id: c-2026-11-05t10-29-52-136z
  - type: status_change
    from: Grooming
    to: Ready
    user: Agent
    date: '2026-11-05T10:29:52.136Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 406cfa5 and live on the dev copy. Card B with icons: prices
      under poe.ninja's Artifact type, vendor who spoke on top (kept through a
      portal), week's change, no chips or arrows on any mechanic's card. Known
      limit: the last NPC to speak decides the card. No docs needed.
    completionComment: true
    date: '2026-11-05T10:29:57.782Z'
    id: c-2026-11-05t10-29-57-782z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T10:29:58.142Z'
swimlane: null
needsAction: null
baselineCommit: d3529ea34cc3eb9250af781a7d862751daf8ef90
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/146'
diffSummary:
  - file: renderer/src/web/woke/boss-runs/bosses.ts
    additions: 75
    deletions: 0
  - file: renderer/src/web/woke/shared/boss-areas.ts
    additions: 8
    deletions: 5
  - file: renderer/test/woke/boss-runs-card.test.ts
    additions: 2
    deletions: 2
  - file: renderer/test/woke/economy.test.ts
    additions: 2
    deletions: 1
  - file: renderer/test/woke/game-log.test.ts
    additions: 8
    deletions: 2
---
Dock hover card for Expedition shows "poe.ninja has no prices for these" plus two scarab chips.

Findings (checked against live poe.ninja Allflame data, 2026-11-05):
- `mechanics/data.ts` filters the vendor currency group on type `Currency`, but poe.ninja lists them under `Artifact`. So the group is always empty.
- Vendor tags are wrong: Scrap Metal belongs to Rog and Astragali to Gwennen (poe-vault guide, July 2026).
- Same empty first group on the glance card: Ultimatum ("Inscribed Ultimatum") and Sanctum ("Tome") match nothing on poe.ninja.
- Scarab chips can't be acted on mid-map; `< >` arrows cycle unrelated mechanics.

Mocks first; no UI code until Guy picks.
