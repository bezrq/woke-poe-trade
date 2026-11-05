---
id: WOKEPOET-72
title: 'League mechanics settings: explain per mechanic what the overlay does'
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
    date: '2026-11-05T09:30:05.791Z'
    comment: Created ticket.
    id: a-2026-11-05t09-30-05-791z
  - type: comment
    user: Agent
    comment: >-
      Pick a layout from https://claude.ai/artifact/73vxCdUfUGy2Y6bjBRpGKj : A
      (pick a mechanic, read about it; recommended), B (every mechanic as a
      sentence) or C (coverage table). Build also fixes the empty Expedition
      prices and makes the launcher open the panel.
    date: '2026-11-05T09:35:44.243Z'
    id: c-2026-11-05t09-35-44-243z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T09:35:44.243Z'
    comment: >-
      Pick a layout from https://claude.ai/artifact/73vxCdUfUGy2Y6bjBRpGKj : A
      (pick a mechanic, read about it; recommended), B (every mechanic as a
      sentence) or C (coverage table). Build also fixes the empty Expedition
      prices and makes the launcher open the panel.
swimlane: require-input
needsAction: null
---
> **TL;DR** The League mechanics settings page reads like a Syndicate-only page. Rework it so each mechanic says what the overlay shows, when, and how to configure it. Mocks with options first; Guy picks; then build.

Current page (`woke/mechanics/mechanics-editor.vue`): one auto-switch toggle, a flat show/hide checklist, then the Betrayal reward editor which dominates the page.
