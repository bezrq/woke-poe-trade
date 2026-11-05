---
id: WOKEPOET-24
title: 'Loot filter rule card works on ground items, including hidden ones'
status: Grooming
priority: Medium
effort: S
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T04:06:05.829Z'
    comment: Created ticket.
---
> **TL;DR:** Alt + F already opens the matching filter rule for a hovered item with quick edits. On the ground it releases Alt before copying, so an item your filter hides (only visible while Alt is held) loses its label and nothing is copied. Keep Alt held through the copy.

## Plan
- Loot filter sample hotkey keeps its modifier keys held during the copy (same as the editor hotkey).
- Mention ground items in the hotkey's settings hint.
- Unit test the shortcut definition.

## Open
- Ctrl+C on a ground label needs one in-game confirmation from Guy; no source documents it.
