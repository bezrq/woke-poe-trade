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
---
> **TL;DR:** The wiki, poedb and Craft of Exile item hotkeys throw you out to your real browser. Guy wants them to open inside the overlay, with a shortcut to pop the page out afterwards. Mocks come first; no code until Guy picks.

Today: `renderer/src/web/item-check/hotkeyable-actions.ts` uses `window.open`, and `OverlayWindow.setWindowOpenHandler` sends that to `shell.openExternal`.

Constraint: nothing sits on screen permanently over gameplay.
