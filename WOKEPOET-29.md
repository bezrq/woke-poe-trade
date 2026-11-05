---
id: WOKEPOET-29
title: Pick and apply a colour scheme for the price check window
status: In Progress
priority: Medium
effort: S
assignee: Agent
tags:
  - ui
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T05:21:37.633Z'
    comment: Created ticket.
    id: a-2026-11-05t05-21-37-633z
  - type: activity
    user: Agent
    date: '2026-11-05T05:28:53.945Z'
    comment: >-
      Guy asked for proper mocks before any more building. Mocks:
      https://claude.ai/artifact/GDKAgY25KK9rnDFjHhwV7v (layouts A, B, C and
      three colour schemes). This now covers the full redesign. The old-listings
      fix for WOKEPOET-28 sits unpushed on the local branch
      claude/price-check-old-listings until the pick.
    id: a-2026-11-05t05-28-53-945z
  - type: comment
    user: Agent
    comment: >-
      Which layout (A, B or C) and which colour scheme? Mocks:
      https://claude.ai/artifact/GDKAgY25KK9rnDFjHhwV7v
    date: '2026-11-05T05:28:53.979Z'
    id: c-2026-11-05t05-28-53-979z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T05:28:53.979Z'
    comment: >-
      Which layout (A, B or C) and which colour scheme? Mocks:
      https://claude.ai/artifact/GDKAgY25KK9rnDFjHhwV7v
  - type: activity
    user: Agent
    date: '2026-11-05T05:45:02.916Z'
    comment: >-
      Guy picked layout A. Each case is mocked in A (Cases board plus 14
      windows). Still waiting on Require Input: Guy's sign-off or changes before
      building.
    id: a-2026-11-05t05-45-02-916z
  - type: activity
    user: Agent
    date: '2026-11-05T06:45:38.685Z'
    comment: Updated implementation link.
    id: a-2026-11-05t06-45-38-685z
  - type: comment
    user: Agent
    comment: 'Guy signed off layout A. Built as PR #118, queued for merge.'
    date: '2026-11-05T06:45:40.121Z'
    id: c-2026-11-05t06-45-40-121z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T06:45:40.121Z'
    comment: 'Guy signed off layout A. Built as PR #118, queued for merge.'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/118'
---
> **TL;DR:** Guy thinks the window's colours are still off after #101. Mock up options on the real window, let Guy pick, then apply the pick.
