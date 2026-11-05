---
id: WOKEPOET-116
title: 'Flips: add Essence of Doubt to the essence flip'
status: In Progress
priority: Medium
effort: XS
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T15:04:03.443Z'
    comment: Created ticket.
---
Guy asked whether the Essence flip counts special essences (Hysteria, Insanity, Horror, Delirium). It doesn't: the reroll pool only takes Deafening names, and the upgrade chains only tiered types. No change needed, a test now pins it.

Found while checking: Doubt is missing. PoeData.dev's essence dataset lists Deafening Doubt as the input being rerolled, so it has no observed weight. `ESSENCE_TYPES` is derived from those weights, so all Doubt upgrade rows are missing and Deafening Doubt sits out of the reroll average.

Fix: give Doubt the average weight, say so in the source note, and test both.
