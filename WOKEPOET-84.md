---
id: WOKEPOET-84
title: Replace invented Client.txt test lines with real log excerpts
status: Released
priority: High
effort: None
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:54:16.694Z'
    comment: Created ticket.
    id: a-2026-11-05t10-54-16-694z
  - type: activity
    user: Agent
    date: '2026-11-05T12:29:16.228Z'
    comment: Updated implementation link.
    id: a-2026-11-05t12-29-16-228z
  - type: comment
    user: Agent
    comment: 'Merged in PRs #170 (campaign log) and #171 (lab log).'
    date: '2026-11-05T12:29:17.176Z'
    completionComment: true
    id: c-2026-11-05t12-29-17-176z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T12:29:17.176Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:47.432Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/170'
needsAction: null
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
Step 2 of the [gameplay helpers critique](https://claude.ai/artifact/NjdEZhrQZBmKwRB56yTsoj). No new UI.

`lab-merciless.txt` has `3_Labyrinth_Airlock` and `campaign-act1.txt` has "You have entered Merveil's Lair". Neither appears in the real log. Replace them with real excerpts (no chat, no character names) so the timer and lab tickets are tested properly.
