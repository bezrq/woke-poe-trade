---
id: WOKEPOET-116
title: 'Flips: add Essence of Doubt to the essence flip'
status: Ready
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
    id: a-2026-11-05t15-04-03-443z
  - type: activity
    user: Agent
    date: '2026-11-05T15:10:32.350Z'
    comment: Updated implementation link.
    id: a-2026-11-05t15-10-32-350z
  - type: comment
    user: Agent
    comment: >-
      PR #202 is up, rebased on master. Doubt now takes the average weight;
      specials were already out, and a test pins that. Adversarial review found
      one test bug, now fixed. Local vitest (2440), typecheck:test, lint and
      build pass. Not checked in the running overlay. Waiting on merge.
    date: '2026-11-05T15:10:32.392Z'
    completionComment: true
    id: c-2026-11-05t15-10-32-392z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T15:10:32.392Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/202'
needsAction: null
---
Guy asked whether the Essence flip counts special essences (Hysteria, Insanity, Horror, Delirium). It doesn't: the reroll pool only takes Deafening names, and the upgrade chains only tiered types. No change needed, a test now pins it.

Found while checking: Doubt is missing. PoeData.dev's essence dataset lists Deafening Doubt as the input being rerolled, so it has no observed weight. `ESSENCE_TYPES` is derived from those weights, so all Doubt upgrade rows are missing and Deafening Doubt sits out of the reroll average.

Fix: give Doubt the average weight, say so in the source note, and test both.
