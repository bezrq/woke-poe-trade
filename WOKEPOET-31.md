---
id: WOKEPOET-31
title: Give Woke its own icon and overlay mark
status: Grooming
priority: Medium
effort: S
assignee: unassigned
tags:
  - ui
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T05:58:18.426Z'
    comment: Created ticket.
    id: a-2026-11-05t05-58-18-426z
  - type: activity
    user: Agent
    date: '2026-11-05T06:02:50.614Z'
    comment: Updated description.
    id: a-2026-11-05t06-02-50-614z
  - type: comment
    user: Agent
    comment: >-
      Which concept (A Waking Eye, B Forged W, C Daybreak, D Lantern, E Risen)?
      And should the tab bar and dock get the mark too? Mocks:
      https://claude.ai/artifact/Bwu7RtrW93ktFE7kUbw8Zy
    date: '2026-11-05T06:02:52.453Z'
    id: c-2026-11-05t06-02-52-453z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T06:02:52.453Z'
    comment: >-
      Which concept (A Waking Eye, B Forged W, C Daybreak, D Lantern, E Risen)?
      And should the tab bar and dock get the mark too? Mocks:
      https://claude.ai/artifact/Bwu7RtrW93ktFE7kUbw8Zy
  - type: comment
    user: Agent
    comment: >-
      Guy asked about PoE item art instead. Sheet of bundled art sent. Bundled
      sources are only about 26 to 48px (77px for today's orb), so a 256px app
      icon would blur. Maven witness and Divine Orb hold up best at 16px.
      Waiting on his pick.
    date: '2026-11-05T06:09:45.297Z'
    selfAttested: true
    id: c-2026-11-05t06-09-45-297z
swimlane: require-input
needsAction: null
---
> **TL;DR:** The app still shows Awakened PoE Trade's mark (tray, exe, overlay). Replace it with original art. Guy picks from mocks before anything is built.

Mocks: https://claude.ai/artifact/Bwu7RtrW93ktFE7kUbw8Zy (concept art sources are in that session's scratchpad; redraw from the mock if lost).

## Where the old mark shows (audit of master, ebbad3e2)
- Exe, installer, taskbar: `main/build/icons/` (icon.ico, icon.icns, 16 to 1024 PNGs). electron-builder picks these up by default.
- Tray: `renderer/public/icon.ico` / `icon.png` via `main/src/AppTray.ts`.
- Window icons: `icon.png` in `main/src/windowing/OverlayWindow.ts` and `main/src/woke/setup.ts`. Favicon: `renderer/index.html`.
- Game art used as the logo: `renderer/public/images/TransferOrb.png` in `overlay/LoadingAnimation.vue` (attach notice), `settings/about.vue`, `woke/setup/SetupWizard.vue`.
- Docs site and README: `docs/public/favicon.png`, `docs/.vitepress/config.js` title, README heading and hotlinked orb image.

## Not changing
- Credit to APT: About page "Built on", Credits page, the Classic APT theme name, and links for OCR downloads.
- Dock and tab icons per tool: dock art is game art by design; a separate question.

## Build plan after the pick
1. Add master SVGs and a repeatable script that writes every PNG plus icon.ico/icns, with the hand-cut 16 to 24px art in the small sizes.
2. Swap the files above and replace TransferOrb as the logo in the three Vue files.
3. Add the mark to the tab bar and dock if Guy wants it (neither has an app mark today).
4. Adversarial review, local checks, merge, restart dev build.

Note: Windows caches icons, so a new exe icon may lag until the shortcut is recreated.
