---
id: WOKEPOET-83
title: >-
  Map verdicts: catch Thorns reflect, warn on dead ratings, stop calling unknown
  maps safe
status: Grooming
priority: High
effort: None
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:54:14.617Z'
    comment: Created ticket.
    id: a-2026-11-05t10-54-14-617z
  - type: comment
    user: Agent
    comment: 'Done in PR #172.'
    date: '2026-11-05T12:02:38.469Z'
    selfAttested: true
    id: c-2026-11-05t12-02-38-469z
---
Step 1 of the [gameplay helpers critique](https://claude.ai/artifact/NjdEZhrQZBmKwRB56yTsoj). No new UI.

- The default profile rates `Monsters reflect #%...`, which isn't in current mod data. Add the Physical and Elemental Thorns wording to the default and to existing profiles that rated the old one.
- Warn when a rating names a mod that no longer exists.
- Unidentified maps and unrecognised mods stop reading RUN, "Safe for your build" (`checkMap`). Map scan already shows "?".
- Update `map-mods.test.ts`, which still tests the old wording.
