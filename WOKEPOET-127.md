---
id: WOKEPOET-127
title: Death recap with the map mods you died to
status: Ready
priority: Medium
effort: M
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T03:51:11.514Z'
    comment: Created ticket.
    id: a-2026-11-06t03-51-11-514z
  - type: comment
    user: Agent
    comment: >-
      Which mock: A skull icon with hover card, B inside Session analytics, or C
      death log panel? Recommended A with C's log behind it. Mocks:
      https://claude.ai/artifact/JXbbkg2garWvFVaXgAH9hv
    date: '2026-11-06T03:53:43.850Z'
    id: c-2026-11-06t03-53-43-850z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T03:53:43.850Z'
    comment: >-
      Which mock: A skull icon with hover card, B inside Session analytics, or C
      death log panel? Recommended A with C's log behind it. Mocks:
      https://claude.ai/artifact/JXbbkg2garWvFVaXgAH9hv
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-06T04:42:21.406Z'
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-06T04:42:21.406Z'
  - type: comment
    user: Agent
    comment: >-
      PR #220 merged as 81896ce. Skull icon, hover card, death log panel. Not
      yet seen on a real death in game.
    date: '2026-11-06T05:25:54.217Z'
    completionComment: true
    id: c-2026-11-06t05-25-54-217z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T05:25:54.217Z'
swimlane: null
needsAction: null
subtasks:
  - WOKEPOET-132
---
Guy: "Death recap is cool to maybe have a reference of what map mods you died to if that's possible to easily save."

Checked against the real Client.txt (1,773 deaths since Aug 2024, 1,426 in maps): the log gives time, character, area, level, seed, and speech before the death. It never gives the killer, damage or map mods. Mods only come from an Alt+M check or map scan before the map opens, matched by name and level, so same-name maps can match wrongly.

Mocks first, no code until Guy picks. Nothing permanently on screen.
