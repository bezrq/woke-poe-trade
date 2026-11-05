---
id: WOKEPOET-66
title: 'Price check: use the searched league''s prices and warn on missing data'
status: Grooming
priority: High
effort: M
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-37
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:37.189Z'
    comment: Created as subtask of WOKEPOET-37.
---
> TL;DR: Picking another league keeps the selected league's divine rate and poe.ninja data, and with no rate divine listings silently drop out. Don't use another league's data, say when divine listings can't be converted, and warn when the account name is blank.

`useInsight.ts`, `useSmartPrice.ts`, `Prices.ts`; `TradeBulk.vue` already guards the league. Report finding 5.
