---
id: WOKEPOET-100
title: 'Price check: show a column per ticked stat in the results list'
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
    date: '2026-11-05T12:19:38.260Z'
    comment: Created ticket.
---
Guy wants the price check results list to show a column for each stat he ticked as a filter (pdps, resistances, evasion...). Price stays visible, columns are capped at what's readable.

Today: Price, ilvl, Listed only (Body Armour check with Energy Shield 1210 ticked shows no ES column).

Mocks first; no code until Guy picks. Touches TradeListing.vue and the trade fetch mapping, near the critique thread's top-of-window trim.
