---
id: WOKEPOET-143
title: >-
  Hover cards open the full window on click; Loot filter card goes straight to
  price changes
status: Grooming
priority: Medium
effort: None
assignee: unassigned
tags:
  - woke
  - ui
  - mocks
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T09:40:15.561Z'
    comment: Created ticket.
    id: a-2026-11-06t09-40-15-561z
  - type: comment
    user: Agent
    comment: >-
      Pick a mock: https://claude.ai/artifact/Dv8Lnvg4VxfBykEJkoT7bW. A: whole
      card opens (default). B: title bar only. C: Open row at the bottom.
      Findings: footer tip is shared by every card with a window, so all ~20
      change. The current "See it" button calls wm.show without openOverlay, and
      the filter is invisible-on-blur, so See it does nothing visible while
      playing. Plan: DockIcon.pressedInGame opens the full window when wmId is
      set (keep gameClick, and hover-off: click opens the card first); guard the
      mouse-up page click against double handling; loot filter sets openTab from
      its first notice.
    date: '2026-11-06T09:42:28.434Z'
    id: c-2026-11-06t09-42-28-434z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-06T09:42:28.434Z'
    comment: >-
      Pick a mock: https://claude.ai/artifact/Dv8Lnvg4VxfBykEJkoT7bW. A: whole
      card opens (default). B: title bar only. C: Open row at the bottom.
      Findings: footer tip is shared by every card with a window, so all ~20
      change. The current "See it" button calls wm.show without openOverlay, and
      the filter is invisible-on-blur, so See it does nothing visible while
      playing. Plan: DockIcon.pressedInGame opens the full window when wmId is
      set (keep gameClick, and hover-off: click opens the card first); guard the
      mouse-up page click against double handling; loot filter sets openTab from
      its first notice.
swimlane: require-input
needsAction: null
---
Guy: clicking the Loot filter hover card ("42 items would move to match today's prices") should open the Prices tab so the moves can be applied. Clicking any card or its icon should open the full window directly, without Shift+Space first. The footer tip is shared, so this is app-wide. Mocks first.
