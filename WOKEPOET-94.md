---
id: WOKEPOET-94
title: 'Lab: layout window collapses to a hover bubble when interact mode ends'
status: Grooming
priority: Medium
effort: None
assignee: unassigned
tags:
  - ui
  - mocks
  - woke
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T11:07:37.474Z'
    comment: Created ticket.
---
> **TL;DR** The poelab layout window stays on screen after you leave Shift+Space. It should go away with interact mode and leave a small bubble that shows a mid-size map on hover.

## Cause
`WidgetLab.vue` turns off `invisible-on-blur` while a layout is open (`watch(openDiff, ...)`), so an opened layout outlives the overlay. The dock icon only shows in the lab zone (`:show="inLab"`) and its card only reads the plaza layout (`peekImg`), never the one you opened.

## Plan (mocks first)
- Keep `invisible-on-blur` on always; the window returns when the overlay reopens.
- Show the dock bubble while a layout is open or in the lab; the card shows the opened layout.
- Decide the bubble's look and when it ends from mocks.
