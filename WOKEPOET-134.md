---
id: WOKEPOET-134
title: >-
  Bug hunt 2026-11-06: tile max scroll, white socket blank search, Pages deploy
  race
status: In Progress
priority: Low
effort: S
assignee: unassigned
tags:
  - bug
  - price-check
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T05:06:37.021Z'
    comment: Created ticket.
    id: a-2026-11-06t05-06-37-021z
  - type: activity
    user: Agent
    date: '2026-11-06T05:10:31.607Z'
    comment: >-
      PRs #223 and #224 up, waiting on CI and the merge route. White socket
      finding retracted: upstream removed that filter, so the tile can't appear.
      Open for Guy: average weights for unrated orbs, scarabs and runegrafts; "1
      of 3" on merged listing tooltips.
    id: a-2026-11-06t05-10-31-607z
  - type: comment
    user: Agent
    comment: >-
      #223 and #224 merged. Should the unrated Delirium orbs, scarabs and
      runegrafts use the average weight? Recommended: yes. It changes their
      reroll EV a little. Also open: a mock for "1 of 3" on merged listing
      tooltips.
    date: '2026-11-06T05:19:09.744Z'
    id: c-2026-11-06t05-19-09-744z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T05:19:09.744Z'
    comment: >-
      #223 and #224 merged. Should the unrated Delirium orbs, scarabs and
      runegrafts use the average weight? Recommended: yes. It changes their
      reroll EV a little. Also open: a mock for "1 of 3" on merged listing
      tooltips.
  - type: activity
    user: Agent
    date: '2026-11-06T05:27:27.503Z'
    comment: >-
      Guy: yes to average weights, marked, with settings overrides, and check
      community data. PoeData.dev has 3.28 scarab rolls (22,591) and Runegraft
      of the Angler; nothing newer for Delirium. Mocks up, awaiting pick:
      https://claude.ai/artifact/5DWE47hNrTyG3iW4z4CocH
    id: a-2026-11-06t05-27-27-503z
swimlane: require-input
needsAction: null
---
Sweep of recent merges found three small confirmed bugs, fixed in small PRs:

1. Scrolling down on an empty max turns the filter on with max = min.
2. isBlankRareSearch ignores the white sockets tile.
3. Docs workflow has no concurrency group, so close merges fail the Pages deploy (#215's run).

Left for Guy: average weights for unrated Delirium orbs, scarabs and runegrafts; "1 of 3" on merged listing tooltips.
