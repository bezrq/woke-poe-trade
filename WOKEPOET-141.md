---
id: WOKEPOET-141
title: 'History rows: Reopen on hover and a dismiss that removes the row'
status: Grooming
priority: None
effort: None
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T09:03:45.494Z'
    comment: Created ticket.
    id: a-2026-11-06t09-03-45-494z
  - type: activity
    user: Agent
    date: '2026-11-06T09:05:52.641Z'
    comment: Updated description.
    id: a-2026-11-06t09-05-52-641z
  - type: comment
    user: Agent
    comment: >-
      Which History row layout: A, B or C? Mocks:
      https://claude.ai/artifact/J2d63jbZGnic74kadKWzrB (A recommended)
    date: '2026-11-06T09:06:08.727Z'
    id: c-2026-11-06t09-06-08-727z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T09:06:08.727Z'
    comment: >-
      Which History row layout: A, B or C? Mocks:
      https://claude.ai/artifact/J2d63jbZGnic74kadKWzrB (A recommended)
swimlane: require-input
needsAction: null
---
Guy: show Reopen only on row hover, and add a dismiss that removes the row completely. Mocks first; waiting on his pick of A, B or C.

## Plan
- OfferRow: closed rows get a hover slot with the age at rest, Reopen and remove on hover.
- Remove: drop the row with an Undo toast, then delete the record, keeping enough to stop a Client.txt replay reopening it (alreadyClosed reads the history; a tombstone or hidden flag).

## Acceptance criteria
- [ ] Reopen shows only on row hover or keyboard focus
- [ ] Remove takes the row away, with Undo
- [ ] A removed offer doesn't return at restart from a Client.txt replay
- [ ] A new whisper from the same player still shows as a new offer
