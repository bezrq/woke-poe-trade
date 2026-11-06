---
id: WOKEPOET-35
title: 'Safety net walks the real rules, protects thin items, judges by best variant'
status: Released
priority: High
effort: M
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Guy
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
  - type: comment
    user: Agent
    comment: >-
      Merged as d3529ea and live in the dev build. No docs needed, because this
      changes behaviour inside the editor only.
    completionComment: true
    date: '2026-11-05T08:16:16.989Z'
    id: c-2026-11-05t08-16-16-989z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T08:16:17.378Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:48.734Z'
needsAction: null
reviewState: approved
baselineCommit: 71d0860524434368f668d75cefa01e3c34a5f070
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/123'
swimlane: null
diffSummary:
  - file: docs/public/favicon.png
    additions: 0
    deletions: 0
  - file: ipc/types.ts
    additions: 2
    deletions: 0
  - file: main/build/icons/1024x1024.png
    additions: 0
    deletions: 0
  - file: main/build/icons/128x128.png
    additions: 0
    deletions: 0
  - file: main/build/icons/16x16.png
    additions: 0
    deletions: 0
  - file: main/build/icons/24x24.png
    additions: 0
    deletions: 0
  - file: main/build/icons/256x256.png
    additions: 0
    deletions: 0
  - file: main/build/icons/32x32.png
    additions: 0
    deletions: 0
  - file: main/build/icons/48x48.png
    additions: 0
    deletions: 0
  - file: main/build/icons/512x512.png
    additions: 0
    deletions: 0
  - file: main/build/icons/64x64.png
    additions: 0
    deletions: 0
  - file: main/build/icons/icon.icns
    additions: 0
    deletions: 0
  - file: main/build/icons/icon.ico
    additions: 0
    deletions: 0
  - file: main/build/script.mjs
    additions: 0
    deletions: 1
  - file: main/src/AppTray.ts
    additions: 14
    deletions: 14
  - file: main/src/main.ts
    additions: 8
    deletions: 1
  - file: main/src/windowing/OverlayWindow.ts
    additions: 7
    deletions: 2
  - file: main/src/woke/app-icon.ts
    additions: 33
    deletions: 0
  - file: main/src/woke/setup.ts
    additions: 16
    deletions: 1
  - file: renderer/public/icon.ico
    additions: 0
    deletions: 0
  - file: renderer/public/icon.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/TransferOrb.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/daybreak.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/daybreak.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/divine-orb.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/divine-orb.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/eternal-orb.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/eternal-orb.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/forged-w.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/forged-w.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/fracturing-orb.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/fracturing-orb.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/goldrim.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/goldrim.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/lantern.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/lantern.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/maven-witness.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/maven-witness.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/offering-to-the-goddess.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/offering-to-the-goddess.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/orb-of-conflict.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/orb-of-conflict.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/risen.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/risen.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/runic-astrolabe.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/runic-astrolabe.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/shapers-exalted.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/shapers-exalted.png
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/waking-eye.ico
    additions: 0
    deletions: 0
  - file: renderer/public/images/app-icons/waking-eye.png
    additions: 0
    deletions: 0
  - file: renderer/src/web/Config.ts
    additions: 4
    deletions: 1
  - file: renderer/src/web/overlay/LoadingAnimation.vue
    additions: 5
    deletions: 3
  - file: renderer/src/web/settings/about.vue
    additions: 4
    deletions: 1
  - file: renderer/src/web/woke/settings/LookPage.vue
    additions: 21
    deletions: 0
  - file: renderer/src/web/woke/settings/pages.ts
    additions: 1
    deletions: 1
  - file: renderer/src/web/woke/setup/SetupWizard.vue
    additions: 2
    deletions: 1
  - file: renderer/src/web/woke/tab-bar/TabBar.vue
    additions: 5
    deletions: 0
  - file: renderer/src/web/woke/ui/app-icon.ts
    additions: 29
    deletions: 0
  - file: renderer/test/woke/app-icon.test.ts
    additions: 27
    deletions: 0
  - file: testing/e2e/app-icon.spec.ts
    additions: 25
    deletions: 0
  - file: testing/main/app-icon.test.ts
    additions: 19
    deletions: 0
version: 0.3.0
releasedAt: '2026-11-06T12:10:45.221Z'
releaseDocPath: release-notes/0.3.0
---
> **TL;DR** — The **safety net now walks the real rules** for a plain drop, counts thin markets, never prices a unique by its **cheapest variant**, keeps its **last list** when prices are missing, and respects your own Hide and "Not for me". "Show it" saves.

Branch `claude/filter-gaps-net`, clone `E:\Git\woke-filter-gaps`.
