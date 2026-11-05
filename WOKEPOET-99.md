---
id: WOKEPOET-99
title: Fix dock-menu e2e test failing since the Trades bubble stays
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
    date: '2026-11-05T12:15:18.165Z'
    comment: Created ticket.
---
e2e/dock-menu.spec.ts:113 "a click on a menu row leaves no card behind" fails every run on master.

Cause: it checks that no card is open by looking for the buyer's name anywhere in the trade icon. Since #147 the bubble stays until no offers are open and names the buyer, so the name is always found. The old bubble ended after 5 s. Nothing is wrong in the product.

Fix: check for an offer row (`[data-offer]`), which only the card draws.
