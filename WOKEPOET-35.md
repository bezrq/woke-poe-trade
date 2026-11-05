---
id: WOKEPOET-35
title: 'Safety net walks the real rules, protects thin items, judges by best variant'
status: Ready
priority: High
effort: M
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
parentId: WOKEPOET-34
history:
  - type: activity
    user: Agent
    date: '2026-11-05T07:22:20.035Z'
    comment: Created ticket.
    id: a-2026-11-05t07-22-20-035z
  - type: activity
    user: Agent
    date: '2026-11-05T07:22:20.035Z'
    comment: Created as subtask of WOKEPOET-34.
    id: a-2026-11-05t07-22-20-035z
  - type: comment
    user: Agent
    comment: >-
      **PR #123 is ready to merge.** With the net on, no priced item worth 20c
      stays hidden on today's prices, softcore or Hardcore, at any strictness.
      It also covers league-tied moves, old-price warnings, stacks, copies that
      follow their source, and release-pinned NeverSink. Three reviews done and
      fixed; local checks pass. Docs: no docs needed, because this changes
      behaviour inside the editor only. Left open: Hardcore safe mode
      (WOKEPOET-39, Guy's pick) and the chat reload with no key press
      (WOKEPOET-36).
    date: '2026-11-05T08:09:47.914Z'
    completionComment: true
    id: c-2026-11-05t08-09-47-914z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T08:09:47.914Z'
needsAction: null
reviewState: approved
---
> **TL;DR** — The **safety net now walks the real rules** for a plain drop, counts thin markets, never prices a unique by its **cheapest variant**, keeps its **last list** when prices are missing, and respects your own Hide and "Not for me". "Show it" saves.

Branch `claude/filter-gaps-net`, clone `E:\Git\woke-filter-gaps`.
