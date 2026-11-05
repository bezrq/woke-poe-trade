---
id: WOKEPOET-30
title: >-
  Open wiki and Craft of Exile in the overlay, with a pop-out to the real
  browser
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
    date: '2026-11-05T05:54:30.712Z'
    comment: Created ticket.
    id: a-2026-11-05t05-54-30-712z
  - type: comment
    user: Agent
    comment: >-
      Mocks: https://claude.ai/artifact/8Zb1qAHrRVhB8FaAurrCAn. Pick A, B or C
      for the panel, and 1 (same key again) or 2 (own key) for the pop-out. I
      recommend B and 1. Tested headlessly with the overlay's browser identity:
      wiki, poedb and the Craft of Exile item link all load.
    date: '2026-11-05T06:06:54.292Z'
    id: c-2026-11-05t06-06-54-292z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T06:06:54.292Z'
    comment: >-
      Mocks: https://claude.ai/artifact/8Zb1qAHrRVhB8FaAurrCAn. Pick A, B or C
      for the panel, and 1 (same key again) or 2 (own key) for the pop-out. I
      recommend B and 1. Tested headlessly with the overlay's browser identity:
      wiki, poedb and the Craft of Exile item link all load.
  - type: comment
    user: Agent
    comment: >-
      Guy chose tabs (B), a pop-out icon in the header, and wants bookmarks.
      Same key again also pops out (assumed, he didn't pick). Bookmark layout
      mocked and asked in the thread; building tabs and pop-out meanwhile.
    date: '2026-11-05T07:15:19.863Z'
    id: c-2026-11-05t07-15-19-863z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T07:15:19.863Z'
    comment: >-
      Guy chose tabs (B), a pop-out icon in the header, and wants bookmarks.
      Same key again also pops out (assumed, he didn't pick). Bookmark layout
      mocked and asked in the thread; building tabs and pop-out meanwhile.
swimlane: null
needsAction: null
---
> **TL;DR:** The wiki, poedb and Craft of Exile item hotkeys throw you out to your real browser. Guy wants them to open inside the overlay, with a shortcut to pop the page out afterwards. Mocks come first; no code until Guy picks.

Today: `renderer/src/web/item-check/hotkeyable-actions.ts` uses `window.open`, and `OverlayWindow.setWindowOpenHandler` sends that to `shell.openExternal`.

Constraint: nothing sits on screen permanently over gameplay.
