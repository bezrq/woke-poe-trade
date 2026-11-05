---
id: WOKEPOET-8
title: Show the challenge guide in the overlay on a hotkey
status: Grooming
priority: None
effort: S
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T02:20:22.815Z'
    comment: Created ticket.
    id: a-2026-11-05t02-20-22-815z
  - type: activity
    user: Agent
    date: '2026-11-05T02:26:10.606Z'
    comment: Updated description. Changed effort to S.
    id: a-2026-11-05t02-26-10-606z
  - type: comment
    user: Agent
    comment: >-
      Mockups: https://claude.ai/artifact/WE3oQ8S11FuyN4dbrkL3JK


      1. Which option: A (site as it is), B (site fitted to the toolkit, with
      progress header and optional hover icon) or C (native tracker)? Proposed
      default: B.

      2. Should the hotkey let you click right away (scroll and tick, then
      hotkey or Esc back to the game), or open click-through like the lab page?
      Proposed default: click right away.
    date: '2026-11-05T02:26:13.563Z'
    id: c-2026-11-05t02-26-13-563z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T02:26:13.563Z'
    comment: >-
      Mockups: https://claude.ai/artifact/WE3oQ8S11FuyN4dbrkL3JK


      1. Which option: A (site as it is), B (site fitted to the toolkit, with
      progress header and optional hover icon) or C (native tracker)? Proposed
      default: B.

      2. Should the hotkey let you click right away (scroll and tick, then
      hotkey or Esc back to the game), or open click-through like the lab page?
      Proposed default: click right away.
swimlane: require-input
needsAction: null
---
> **TL;DR** A hotkey shows CraniumCarnage's challenge guide (https://craniumviolence.github.io/) in an overlay panel. It embeds fine in a webview; waiting on Guy's pick from the mockups before building.

Tested in a real Electron `<webview>` with the default session: no load errors, 40 tick boxes, 276 prices, ticks survive an app restart (site uses localStorage).

Constraints for any embed option:
- Start with the site's side list closed. It opens by default and covers the text. The site's `data-sidebar` value is inverted: `visible` means closed.
- Keep the panel wider than 770px, because the site's narrow CSS makes the text much larger.

Reuse: `lab/WidgetLab.vue` (webview panel, `widget-action` hotkey), `shortcuts.ts`, `settings/hotkey-fields.ts`, `modules.ts`, `DockItem`. `trigger-event` already supports `focusOverlay` to take focus on the hotkey.

Project rules: nothing permanently on screen (hover icon or hotkey popup only); a test ships with the feature.
