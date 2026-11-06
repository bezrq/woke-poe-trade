---
id: WOKEPOET-142
title: >-
  Landing page: redesign feature slides (sharp shots, pickers on top, real PoE
  art)
status: In Progress
priority: None
effort: None
assignee: unassigned
tags:
  - landing
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T09:07:24.740Z'
    comment: Created ticket.
    id: a-2026-11-06t09-07-24-740z
  - type: comment
    user: Agent
    comment: 'Guy picked B, the item tooltip look. PR #237 open, bug review running.'
    date: '2026-11-06T09:32:14.982Z'
    id: c-2026-11-06t09-32-14-982z
  - type: status_change
    from: Require Input
    to: In Progress
    user: Agent
    date: '2026-11-06T09:32:14.982Z'
needsAction: null
---
Guy's points: images too big and blurry; pickers ugly, use real PoE art; pickers above each section and fit one screen with the slide; background not plain black or an item border on the pics.

Blur cause: landing-highlights crops 1120-1280 px of a 1920x1080 page, then scales to 1600x900, and the page stretches that to 160vh. Fix: capture at deviceScaleFactor 2, save with no resize, cap the stage at 1280x720.

Art: real item-frame headers in renderer/public/images/item-frame, item icons from poecdn, stash tabs and panel band cut from Guy's frames (testing/fixtures/screens/frames).

Mocks: three options await Guy's pick. Clone E:\Git\woke-landing-poe, branch claude/landing-tour-mocks.
