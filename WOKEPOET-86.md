---
id: WOKEPOET-86
title: 'Boss sub-splits: rebuild from what the log really writes'
status: Done
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
    date: '2026-11-05T10:54:22.535Z'
    comment: Created ticket.
    id: a-2026-11-05t10-54-22-535z
  - type: activity
    user: Agent
    date: '2026-11-05T12:29:18.675Z'
    comment: Updated implementation link.
    id: a-2026-11-05t12-29-18-675z
  - type: comment
    user: Agent
    comment: 'Merged in PR #170.'
    date: '2026-11-05T12:29:19.531Z'
    completionComment: true
    id: c-2026-11-05t12-29-19-531z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T12:29:19.531Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/170'
needsAction: null
---
Step 4 of the [gameplay helpers critique](https://claude.ai/artifact/NjdEZhrQZBmKwRB56yTsoj). No new UI.

Boss arenas never log "You have entered", so all 18 sub-split zones get 0 hits and the boss pin stays on the act's first boss. Use area ids plus boss speech (Piety, Daresso, Malachai, Merveil, Dominus, Brutus, Tukohama, Avarius). Depends on the real log excerpts ticket.
