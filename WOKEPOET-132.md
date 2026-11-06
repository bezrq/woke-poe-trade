---
id: WOKEPOET-132
title: 'Death recap: read map mods by OCR on entering a map'
status: Grooming
priority: Medium
effort: M
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-127
history:
  - type: activity
    user: Agent
    date: '2026-11-06T04:59:12.293Z'
    comment: Created ticket.
    id: a-2026-11-06t04-59-12-293z
  - type: activity
    user: Agent
    date: '2026-11-06T04:59:12.293Z'
    comment: Created as subtask of WOKEPOET-127.
    id: a-2026-11-06t04-59-12-293z
  - type: comment
    user: Agent
    comment: >-
      Need one in-map screenshot with the map mods turned on in the overlay map.
      Does the list stay up, or only while a key is held?
    date: '2026-11-06T04:59:18.654Z'
    id: c-2026-11-06t04-59-18-654z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T04:59:18.654Z'
    comment: >-
      Need one in-map screenshot with the map mods turned on in the overlay map.
      Does the list stay up, or only while a key is held?
  - type: comment
    user: Agent
    comment: 'Screenshot received: the list reads. PR #238.'
    date: '2026-11-06T09:47:01.001Z'
    id: c-2026-11-06t09-47-01-001z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T09:47:01.001Z'
    comment: 'Screenshot received: the list reads. PR #238.'
swimlane: null
needsAction: null
---
> TL;DR: after "You have entered", OCR the game's own map mod list so a recap has mods without a check. Needs the list showing on screen.

Guy's production_Config.ini has `map_overlay_mods_hidden=true`, and his in-map screenshots show no list. Blocked on a real screenshot with the list showing: its position, colour and wording decide the crop and matcher. TooltipMatcher.parse in map-mods/tooltip-parse.ts should reuse for the lines. Reads only, sends no input. The OCR files aren't bundled, so it needs a fallback to checks.
