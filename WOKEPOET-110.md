---
id: WOKEPOET-110
title: 'Flips: outline flippable items in open stash tabs by flip-worthiness'
status: Grooming
priority: None
effort: None
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:27:00.768Z'
    comment: Created ticket.
---
> **TL;DR:** When Flips is enabled and a stash tab is open, draw a coloured outline on each flippable item showing how worth flipping it is. Ticketed for later: mockups first, no build yet.

## Guy's ask

"can we add for flips if it is enabled, an overlay on screen on stash tabs to mark the flippable items and give them outline of color of flipworthiness"

## Constraints

- Stash API reading is blocked (GGG OAuth closed), so this likely needs OCR or screen detection of the stash grid. Feasibility is not yet tested.
- Mockups with options go to Guy before any build.
- No popups over PoE. The outlines should only appear with a stash tab open and Flips enabled, and need to be drawn in-place rather than as a window.

## To work out in grooming

- How to detect that a stash tab is open, and which items are in which cells, from the screen alone.
- Which tabs to support first. Scarabs, catalysts, delirium orbs, fossils, essences, oils and runegrafts often sit in special tabs, so check whether their fixed slot layouts make this easier than a plain grid. Unverified idea.
- What the colours mean, using the existing per-item Flips profit: for example worth flipping, close to break-even, keep and sell, and rare and cheap.
- Which method a colour reflects where a family has two (catalysts: vendor or Harvest; essences: Harvest or tier upgrade).
- Screen-reading cost, since the OCR worker is heavy; it should only run while a tab is open.

Depends on Flips in `renderer/src/web/woke/scarab-flip`, whose `priceFlip` gives each item's profit. Its numbers rest on old weights for some families, so colours inherit that uncertainty.
