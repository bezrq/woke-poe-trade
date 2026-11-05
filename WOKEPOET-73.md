---
id: WOKEPOET-73
title: 'Settings Text size changes window size, not text'
status: In Progress
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
    date: '2026-11-05T09:31:52.823Z'
    comment: Created ticket.
    id: a-2026-11-05t09-31-52-823z
  - type: activity
    user: Agent
    date: '2026-11-05T10:01:39.986Z'
    comment: >-
      PR #143 up: real Text size (100-150%), old control renamed Price check
      window size. Local checks pass, review findings fixed. Merge pending the
      cloud step.
    id: a-2026-11-05t10-01-39-986z
---
Guy: the Settings "Text size" option makes windows bigger instead of text. It sets the root font size (rem), which scales the whole APT window. Fix: real text scale for all text; old control renamed to what it does.
