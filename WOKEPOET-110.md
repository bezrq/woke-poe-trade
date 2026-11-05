---
id: WOKEPOET-110
title: 'Flips: outline flippable items in open stash tabs by flip-worthiness'
status: Grooming
priority: None
effort: None
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T13:27:00.768Z'
    comment: Created ticket.
    id: a-2026-11-05t13-27-00-768z
  - type: comment
    user: Agent
    comment: >-
      Feasibility check on Guy's real 2560x1440 stash screenshots
      (screenshot-0000, 0007, 0016). No code in the repo changed.


      Method: opencv template matching of poe.ninja/poecdn icons (the URLs in
      items.ndjson) against each slot, with alpha masks, TM_CCOEFF_NORMED, icons
      scaled to 56-64px. Prototype scripts are in the scratchpad only.


      Results on the General currency tab, 33 occupied slots against 1,132
      currency and map icons. Judged by eye; there is no labelled ground truth:

      - Scores 0.7+ all looked right (Portal Scroll, Bauble, Annulment, Exalted,
      Blessed, Scouring, Tempering).

      - 0.4-0.7 is mixed: many right (Chaos, Regal, Chromatic, Vaal, Ducats),
      some wrong (Focal Stone over Alteration). A threshold plus limiting to
      Flips families should help, untested.

      - Count digits on top of icons did not break matching.

      - Whole-screen search gave false positives on the stash banner, so match
      known cells only.

      - Speed: about 4s per slot brute force over 3,400 templates in Python, far
      too slow as is. Needs a prefilter or fixed-slot tabs.


      Not tested: any flippable item (no screenshot has scarabs etc.), quad tabs
      where icons are small, other resolutions, the app's own opencv.js worker,
      stash-open and tab-change detection.


      Proposed design: fixed-slot tabs (Fragment, Currency, Delirium, Essence,
      Blight) need only tab detection and an occupied check; plain and quad tabs
      need per-cell matching. Trigger by hotkey or only while a stash is
      detected, so nothing polls in maps. Reads the screen and sends no keys.
      Whether GGG's rules allow this is not checked; map scan already reads the
      screen.


      Next: Guy provides a screenshot of a tab with scarabs, then re-test and
      make mockups on it.
    date: '2026-11-05T14:13:21.014Z'
    selfAttested: true
    id: c-2026-11-05t14-13-21-014z
  - type: comment
    user: Agent
    comment: >-
      Guy: please open a stash tab with scarabs (and a catalyst or delirium tab
      if you have one) and press PrintScreen in game. I need it to test on real
      flippable items and to make the mockups.
    date: '2026-11-05T14:13:22.308Z'
    id: c-2026-11-05t14-13-22-308z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T14:13:22.308Z'
    comment: >-
      Guy: please open a stash tab with scarabs (and a catalyst or delirium tab
      if you have one) and press PrintScreen in game. I need it to test on real
      flippable items and to make the mockups.
  - type: comment
    user: Agent
    comment: >-
      Retested on Guy's new screenshots 0027-0034. Scarab sub-tab (0028): icons
      render at exactly 48px at 1440p. Family per row plus unique names assigned
      113 of 115 lit slots; ghost (empty) slots separate by brightness.
      Spot-checked by eye, no ground truth. Conclusion: ship a fixed slot table
      per tab rather than matching at runtime. Quick oil test on Blight (0034)
      matched only 4, so other tabs are unproven. Mockups: outline styles 1-3
      under "Stash outlines" at
      https://claude.ai/artifact/HZ3QdC95eYt4ZZY6CPyygs. Waiting on Guy's pick
      (recommended 2). Prototype scripts are in the session scratchpad only.
    date: '2026-11-05T14:23:54.146Z'
    selfAttested: true
    pin: true
    id: c-2026-11-05t14-23-54-146z
  - type: comment
    user: Agent
    comment: >-
      Guy picked outline style 2 and asked for it to be snappy, clear easily on
      tab swaps, and run on demand. Proposed: one shortcut press takes one
      screenshot; a fixed slot table plus tab and lit-slot pixel checks with no
      OCR worker, target under about 200ms, to be measured. Clears on any click
      or Ctrl+scroll, the shortcut, Esc, zone change, or a timeout; need to
      confirm the hook sees clicks in game. Shortcut unset by default.
      Unsupported tab: a brief note on the Flips dock icon, no popup. Waiting on
      Guy's go, scarab tab first.
    date: '2026-11-05T14:28:37.599Z'
    selfAttested: true
    pin: true
    id: c-2026-11-05t14-28-37-599z
  - type: comment
    user: Agent
    comment: >-
      Guy's fourth requirement: the stash panel can sit in different screen
      positions, for example with Faustus open. Proposed: locate the panel by a
      fixed marker (Stash banner or frame) on each press, place slots relative
      to it, and draw nothing if it isn't found. Untested; asked for a
      screenshot with Faustus and the scarab tab open.
    date: '2026-11-05T14:29:02.395Z'
    selfAttested: true
    pin: true
    id: c-2026-11-05t14-29-02-395z
  - type: comment
    user: Agent
    comment: >-
      Guy asked about reading stack counts to show a per-stack total. Untested.
      Plan: try digit matching on screenshot-0028 in the first build, with no
      OCR worker. Show the total only if reads are reliable, counting full sets
      of 3; otherwise keep Profit each. Totals overstate what the market can
      absorb.
    date: '2026-11-05T14:39:40.918Z'
    selfAttested: true
    id: c-2026-11-05t14-39-40-918z
  - type: comment
    user: Agent
    comment: >-
      Guy asked for graded hues from light to bright green. Added mock Outlines
      2b: pale to bright green scaled across the open tab, profit each written
      on the slot, amber near break-even. Waiting on his go.
    date: '2026-11-05T14:40:56.462Z'
    selfAttested: true
    id: c-2026-11-05t14-40-56-462z
  - type: comment
    user: Agent
    comment: >-
      Guy confirmed: colour grade by per-item profit, not stack total. Mock 2b
      already does this.
    date: '2026-11-05T14:41:05.281Z'
    selfAttested: true
    id: c-2026-11-05t14-41-05-281z
swimlane: require-input
needsAction: null
---
> **TL;DR:** When Flips is enabled and a stash tab is open, draw a coloured outline on each flippable item showing how worth flipping it is. Ticketed for later: mockups first, no build yet.

## Guy's ask

"can we add for flips if it is enabled, an overlay on screen on stash tabs to mark the flippable items and give them outline of color of flipworthiness"

## Constraints

- Stash API reading is blocked (GGG OAuth closed), so this likely needs OCR or screen detection of the stash grid. Feasibility is not yet tested.
- Mockups with options go to Guy before any build.
- No popups over PoE. The outlines should only appear with a stash tab open and Flips enabled, and need to be drawn in-place rather than as a window.

## To work out in grooming

- How to detect that a stash tab is open, and which items are in which cells, from the screen alone.
- Which tabs to support first. Scarabs, catalysts, delirium orbs, fossils, essences, oils and runegrafts often sit in special tabs, so check whether their fixed slot layouts make this easier than a plain grid. Unverified idea.
- What the colours mean, using the existing per-item Flips profit: for example worth flipping, close to break-even, keep and sell, and rare and cheap.
- Which method a colour reflects where a family has two (catalysts: vendor or Harvest; essences: Harvest or tier upgrade).
- Screen-reading cost, since the OCR worker is heavy; it should only run while a tab is open.

Depends on Flips in `renderer/src/web/woke/scarab-flip`, whose `priceFlip` gives each item's profit. Its numbers rest on old weights for some families, so colours inherit that uncertainty.
