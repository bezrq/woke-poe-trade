---
id: WOKEPOET-30
title: >-
  Open wiki and Craft of Exile in the overlay, with a pop-out to the real
  browser
status: Released
priority: None
effort: None
assignee: unassigned
tags:
  - ui
createdBy: Agent
updatedBy: Guy
history:
  - type: activity
    user: Agent
    date: '2026-11-05T05:54:30.712Z'
    comment: Created ticket.
    id: a-2026-11-05t05-54-30-712z
  - type: comment
    user: Agent
    comment: >-
      Mocks: https://claude.ai/artifact/8Zb1qAHrRVhB8FaAurrCAn. Pick A, B or C
      for the panel, and 1 (same key again) or 2 (own key) for the pop-out. I
      recommend B and 1. Tested headlessly with the overlay's browser identity:
      wiki, poedb and the Craft of Exile item link all load.
    date: '2026-11-05T06:06:54.292Z'
    id: c-2026-11-05t06-06-54-292z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T06:06:54.292Z'
    comment: >-
      Mocks: https://claude.ai/artifact/8Zb1qAHrRVhB8FaAurrCAn. Pick A, B or C
      for the panel, and 1 (same key again) or 2 (own key) for the pop-out. I
      recommend B and 1. Tested headlessly with the overlay's browser identity:
      wiki, poedb and the Craft of Exile item link all load.
  - type: comment
    user: Agent
    comment: >-
      Guy chose tabs (B), a pop-out icon in the header, and wants bookmarks.
      Same key again also pops out (assumed, he didn't pick). Bookmark layout
      mocked and asked in the thread; building tabs and pop-out meanwhile.
    date: '2026-11-05T07:15:19.863Z'
    id: c-2026-11-05t07-15-19-863z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T07:15:19.863Z'
    comment: >-
      Guy chose tabs (B), a pop-out icon in the header, and wants bookmarks.
      Same key again also pops out (assumed, he didn't pick). Bookmark layout
      mocked and asked in the thread; building tabs and pop-out meanwhile.
  - type: activity
    user: Agent
    date: '2026-11-05T07:45:33.419Z'
    comment: Updated implementation link.
    id: a-2026-11-05t07-45-33-419z
  - type: comment
    user: Agent
    comment: >-
      PR #124 has tabs, pop-out (key and header icon) and a bookmarks tab. Guy
      said to proceed as I wish, so I picked the tab layout. Two adversarial
      reviews done and fixed, local checks pass, merge requested. Real key
      presses in the panel are still untested.
    date: '2026-11-05T07:45:34.971Z'
    completionComment: true
    id: c-2026-11-05t07-45-34-971z
  - type: status_change
    from: Grooming
    to: Ready
    user: Agent
    date: '2026-11-05T07:45:34.971Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as 1fe0706f and live on the dev overlay. Tabs, pop-out by key and
      header icon, and a bookmarks tab. Real key presses in the panel still need
      Guy's in-game use.
    completionComment: true
    date: '2026-11-05T07:52:15.715Z'
    id: c-2026-11-05t07-52-15-715z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T07:52:16.032Z'
  - type: status_change
    from: Done
    to: Released
    user: Guy
    date: '2026-11-06T12:10:48.764Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/124'
baselineCommit: 71d0860524434368f668d75cefa01e3c34a5f070
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
> **TL;DR:** The wiki, poedb and Craft of Exile item hotkeys throw you out to your real browser. Guy wants them to open inside the overlay, with a shortcut to pop the page out afterwards. Mocks come first; no code until Guy picks.

Today: `renderer/src/web/item-check/hotkeyable-actions.ts` uses `window.open`, and `OverlayWindow.setWindowOpenHandler` sends that to `shell.openExternal`.

Constraint: nothing sits on screen permanently over gameplay.
