---
id: WOKEPOET-63
title: 'Price check: honour rate limit penalties'
status: In Progress
priority: Critical
effort: S
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-37
history:
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:29.797Z'
    comment: Created ticket.
    id: a-2026-11-05t08-10-29-797z
  - type: activity
    user: Agent
    date: '2026-11-05T08:10:29.797Z'
    comment: Created as subtask of WOKEPOET-37.
    id: a-2026-11-05t08-10-29-797z
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T08:16:39.170Z'
needsAction: null
---
> TL;DR: After a 429 the client lets a search through after 12 s while the server restricts for 60 s. Read the penalty and Retry-After, block requests until it ends, show a countdown, let Measure wait it out.

`common.ts` reads only the first state field; no renderer code reads Retry-After; `drivers.ts` retry regex only matches the client's own message. Report: https://claude.ai/artifact/NciFiZFWAd2WUQJBUrJhqU finding 4.
