---
id: WOKEPOET-147
title: 'CI: site-only PRs skip the app tests'
status: Ready
priority: None
effort: S
assignee: unassigned
tags:
  - tooling
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T11:36:13.842Z'
    comment: Created ticket.
    id: a-2026-11-06t11-36-13-842z
  - type: comment
    user: Agent
    comment: >-
      **CI skip is up as PR #249**
      (https://github.com/guybnd/woke-poe-trade/pull/249). Decision logic
      checked on sample file lists; the skip itself is proven by the next
      site-only PR, which is the landing cleanup. Docs: testing/README.md
      updated.
    date: '2026-11-06T11:37:21.559Z'
    completionComment: true
    id: c-2026-11-06t11-37-21-559z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-06T11:37:21.559Z'
needsAction: null
---
> Guy: don't run in-game tests for a landing page. CI looks at the PR's changed files; site-only PRs pass both required checks without the work. Pushes to master still run everything.
