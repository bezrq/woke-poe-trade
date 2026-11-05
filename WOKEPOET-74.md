---
id: WOKEPOET-74
title: 'Trades card: collapse offers, fix wrapped button row'
status: Grooming
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
    date: '2026-11-05T09:46:31.980Z'
    comment: Created ticket.
    id: a-2026-11-05t09-46-31-980z
  - type: comment
    user: Agent
    comment: >-
      Which layout: A, B or C? Recommended: C. Mocks:
      https://claude.ai/artifact/8ijRB7sNGAW8r6NuRThEiX
    date: '2026-11-05T09:46:41.962Z'
    id: c-2026-11-05t09-46-41-962z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T09:46:41.962Z'
    comment: >-
      Which layout: A, B or C? Recommended: C. Mocks:
      https://claude.ai/artifact/8ijRB7sNGAW8r6NuRThEiX
  - type: activity
    user: Agent
    date: '2026-11-05T09:48:19.898Z'
    comment: >-
      Added scope from Guy: a dismissed offer gets a Reopen button on its row,
      so an accidental dismiss can be undone. Mocks A, B and C updated. Also in
      scope: unique art lookup keeps the comma in the name, and the ✓ ✕ buttons
      render squashed.
    id: a-2026-11-05t09-48-19-898z
  - type: comment
    user: Agent
    comment: >-
      Guy picked one-line rows with the next step on hover, click to expand, a
      row style setting and a kept history. PR #147.
    date: '2026-11-05T10:14:14.073Z'
    id: c-2026-11-05t10-14-14-073z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T10:14:14.073Z'
    comment: >-
      Guy picked one-line rows with the next step on hover, click to expand, a
      row style setting and a kept history. PR #147.
  - type: activity
    user: Agent
    date: '2026-11-05T10:14:14.113Z'
    comment: Updated implementation link.
    id: a-2026-11-05t10-14-14-113z
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/147'
---
Guy wants to click an offer to collapse it for easier browsing with several offers. Today the top offer can't be collapsed (OfferRow accordion, `expand` in WidgetTrade.vue). The ✓ and ✕ buttons also wrap onto their own line in the 23rem card.

Mocks: https://claude.ai/artifact/8ijRB7sNGAW8r6NuRThEiX
A: same two-line rows, click to close. B: one-line rows. C: one-line rows with the next-step button on each row (recommended).
All three split the buttons into two rows: steps, then Busy/Still?/Sold with ✓ ✕ on the right.

No code until Guy picks.
