---
id: WOKEPOET-140
title: History rows show wrong item tooltip (base instead of unique)
status: Grooming
priority: None
effort: None
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T09:00:25.352Z'
    comment: Created ticket.
    id: a-2026-11-06t09-00-25-352z
  - type: activity
    user: Agent
    date: '2026-11-06T09:04:48.591Z'
    comment: Updated implementation link.
    id: a-2026-11-06t09-04-48-591z
  - type: activity
    user: Agent
    date: '2026-11-06T09:04:49.657Z'
    comment: >-
      Cause: whispers write "Name, Base"; the comma stopped the unique matching,
      so the tooltip used the rare fallback (Windscream, Reinforced Greaves
      showed the base). PR #235 awaiting merge through the cloud route.
    id: a-2026-11-06t09-04-49-657z
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/235'
---
Hovering a row in the History list (Le Heup of All, Praxis and other uniques) shows a tooltip for the wrong item, Reinforced Greaves base instead of the unique.
