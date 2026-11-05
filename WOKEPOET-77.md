---
id: WOKEPOET-77
title: Remove the redundant old map stat list from Item info settings
status: In Progress
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
  - type: comment
    user: Agent
    comment: >-
      Guy picked B and asked for tabs per mode (heist, maps, charts) plus a
      Nightmare/T17 on/off toggle that mixes with maps. Mocks:
      https://claude.ai/artifact/Tyc9XyZE9wA2TqMnUgFzHx (A tabs, B rail).
      Findings: Nightmare maps are the T17 pool (`ubermap_exclusive`, 42
      wordings), so one toggle covers both. Heist has 43 tagged wordings. Charts
      have no tag in stats.ndjson: poedb lists a Deep Water chart pool of 150
      rows, shared lines overlap map mods, and "adjacent Areas" lines are
      missing from the app's stat data, so they'd show as not recognised; a
      chart tab needs a curated list and a real chart to test. Toggle-off
      proposal: hide T17 rows, drop T17 picks from the regex, keep ratings,
      verdict card still flags them. Waiting on Guy's layout pick.
    date: '2026-11-05T10:22:23.835Z'
    selfAttested: true
    id: c-2026-11-05t10-22-23-835z
  - type: comment
    user: Agent
    comment: >-
      Guy: drop the picked-chips block in Map mods, since it duplicates the
      list. Instead sort picked mods to the top of each category, grouped Avoid,
      Careful, Want, then Not rated. Mock updated. The order refreshes on mode,
      filter or T17 change rather than on each click, so rows don't jump while
      rating.
    date: '2026-11-05T10:30:06.705Z'
    selfAttested: true
    id: c-2026-11-05t10-30-06-705z
  - type: comment
    user: Agent
    comment: >-
      Test fixture from Guy, a real chart. Sandy Seabed Chart "Nautical
      Travail", area Abyssal Plain, Area Level 83, Item Rarity +60%, Pack Size
      +36%, Chart Shape: Junction, implicit "Voyage Modifier will be revealed
      once Charted". Explicits: "Monsters fire 2 additional Projectiles",
      "Monsters deal 28(21-35)% extra Physical Damage as Cold", "Area has
      patches of Shocked Ground which increase Damage taken by 10%", "Monsters
      have 53(46-60)% increased Area of Effect". All 4 explicit matchers and the
      implicit exist in stats.ndjson with fromAreaMods: yes (checked against
      strings only, not run through the parser). No adjacent-area lines on this
      chart. Plan: Charts tab is a curated list from the shared pool, and the
      card keeps the juice score since charts show rarity and pack size. Still
      waiting on A or B.
    date: '2026-11-05T10:30:31.850Z'
    selfAttested: true
    id: c-2026-11-05t10-30-31-850z
  - type: comment
    user: Agent
    comment: >-
      Guy picked A: tabs on top, T17 switch beside them, picked mods sorted to
      the top, chips block removed.
    date: '2026-11-05T10:30:53.295Z'
    id: c-2026-11-05t10-30-53-295z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T10:30:53.295Z'
    comment: >-
      Guy picked A: tabs on top, T17 switch beside them, picked mods sorted to
      the top, chips block removed.
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T10:32:11.795Z'
  - type: comment
    user: Agent
    comment: >-
      Guy: each tab gets its own regex row and modes never intermingle.
      Supersedes shared ratings: profile keeps separate ratings for Maps, Heist
      and Charts, the verdict card uses the list for the item's type, and an
      Avoid on Charts no longer reaches the map search.
    date: '2026-11-05T10:44:11.852Z'
    selfAttested: true
    pin: true
    id: c-2026-11-05t10-44-11-852z
  - type: activity
    user: Agent
    date: '2026-11-05T10:53:50.962Z'
    comment: >-
      First adversarial review (81d7f7ba) found 7 issues. Fixing: final import
      limited to heist marks with no profile creation (it could undo un-ratings
      and revive deleted profiles); unrecognised Voyage implicits kept visible;
      chart list and unrevealed Voyage match by stat ref for other languages;
      sort refreshes on search and Quick chips; unidentified items no longer say
      Safe; duplicate keys; a Map mods off hint. "Want on Charts narrows the map
      search" is gone with per-tab ratings. PR #151.
    id: a-2026-11-05t10-53-50-962z
  - type: activity
    user: Agent
    date: '2026-11-05T11:07:58.290Z'
    comment: >-
      Second review fixed in dc5ee85d: heist one row per stat (reduced rows
      shared token `duc`), 5-letter minimum tokens on Heist and Charts, per-tab
      highlight and auto-trim, curse wording row. Not fixed by choice: Charts
      start empty (Guy's no-intermingling rule), caches on language change
      (already true of the map list), strip not showing unrecognised lines.
      Local checks pass. Merge requested.
    id: a-2026-11-05t11-07-58-290z
swimlane: null
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
