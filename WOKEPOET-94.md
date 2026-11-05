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
    id: a-2026-11-05t11-07-37-474z
  - type: activity
    user: Agent
    date: '2026-11-05T11:10:35.748Z'
    comment: Updated description.
    id: a-2026-11-05t11-10-35-748z
  - type: comment
    user: Agent
    comment: >-
      Which bubble: A letter icon (recommended), B named pill, or C map
      thumbnail? Mocks: https://claude.ai/artifact/7fPodiRCXymABQDG8tk7H1
    date: '2026-11-05T11:10:35.787Z'
    id: c-2026-11-05t11-10-35-787z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T11:10:35.787Z'
    comment: >-
      Which bubble: A letter icon (recommended), B named pill, or C map
      thumbnail? Mocks: https://claude.ai/artifact/7fPodiRCXymABQDG8tk7H1
swimlane: require-input
needsAction: null
---
> **TL;DR** The poelab layout window stays on screen after you leave Shift+Space. It should go away with interact mode and leave a small bubble that shows a mid-size map on hover.

## Cause
`WidgetLab.vue` turns off `invisible-on-blur` while a layout is open (`watch(openDiff, ...)`), so an opened layout outlives the overlay. The dock icon only shows in the lab zone (`:show="inLab"`) and its card only reads the plaza layout (`peekImg`), never the one you opened.

## Plan (no code until Guy picks)
Mocks: https://claude.ai/artifact/7fPodiRCXymABQDG8tk7H1 (A letter icon, recommended; B named pill; C map thumbnail bubble).

- Keep `invisible-on-blur` on always; the window returns when the overlay reopens.
- Show the bubble while a layout is open or in the lab; the card shows the opened layout.
- The bubble ends when you close the layout, when you leave the lab, or at the midnight UTC reset.
- The layout hotkey outside the overlay holds the card open until pressed again (existing `togglePin`), instead of the full window.

Related: WOKEPOET-87 changes how difficulty is detected in the same file.
