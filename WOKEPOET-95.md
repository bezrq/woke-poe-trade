---
id: WOKEPOET-95
title: Merge the Gear and Setups tabs in the build panel
status: Done
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
    date: '2026-11-05T11:08:37.999Z'
    comment: Created ticket.
    id: a-2026-11-05t11-08-37-999z
  - type: comment
    user: Agent
    comment: >-
      Which layout: A (everything open), B (gem icon strip) or C (links first,
      recommended)? Mocks: https://claude.ai/artifact/6HE8EvsEftsfzPEDcUVdVC
    date: '2026-11-05T11:09:08.767Z'
    id: c-2026-11-05t11-09-08-767z
  - type: swimlane_change
    swimlane: require-input
    action: set
    user: Agent
    date: '2026-11-05T11:09:08.767Z'
    comment: >-
      Which layout: A (everything open), B (gem icon strip) or C (links first,
      recommended)? Mocks: https://claude.ai/artifact/6HE8EvsEftsfzPEDcUVdVC
  - type: comment
    user: Agent
    comment: >-
      Guy asked for gems shown in linked socket groupings. Added options D
      (socket path), E (vertical chain), F (inline chain). Links are drawn per
      PoB gem group; PoB doesn't record which socket holds which gem, so gem
      colours can disagree with the item's socket dots (Svalinn is R-R-R with
      three blue gems). Waiting on his pick.
    date: '2026-11-05T11:20:31.457Z'
    selfAttested: true
    id: c-2026-11-05t11-20-31-457z
  - type: comment
    user: Agent
    comment: >-
      Guy: drop the link-colour regex from the Gear tab, since it's redundant
      after the last patch's colouring changes. Removed from all mock options.
      When building, remove the regex row, its hint and its Save button from
      this tab; check whether socketRegex still has other callers before
      deleting it.
    date: '2026-11-05T11:21:12.051Z'
    selfAttested: true
    id: c-2026-11-05t11-21-12-051z
  - type: comment
    user: Agent
    comment: >-
      Guy picked E (vertical chain with icons, level/quality): "E seems much
      more readable". No regex.
    date: '2026-11-05T11:24:26.182Z'
    id: c-2026-11-05t11-24-26-182z
  - type: swimlane_change
    swimlane: require-input
    action: cleared
    user: Agent
    date: '2026-11-05T11:24:26.182Z'
    comment: >-
      Guy picked E (vertical chain with icons, level/quality): "E seems much
      more readable". No regex.
  - type: status_change
    from: Grooming
    to: In Progress
    user: Agent
    date: '2026-11-05T11:24:26.235Z'
  - type: activity
    user: Agent
    date: '2026-11-05T11:54:44.451Z'
    comment: >-
      PR #167 reviewed adversarially. Fixed: main skill granted with no slot,
      group labels on item rows, double-dimmed gems in disabled groups, chip
      keys, missing-art fallback. Left as is: in the shared chip row a pick
      moves both sets; picking an item set alone needs differing sets. Local
      checks pass on c98ae82d. Asked the coordinator to merge.
    id: a-2026-11-05t11-54-44-451z
  - type: activity
    user: Agent
    date: '2026-11-05T12:03:08.937Z'
    comment: Updated implementation link.
    id: a-2026-11-05t12-03-08-937z
  - type: comment
    user: Agent
    comment: >-
      **Merged as b36264c (PR #167).** The Gear tab shows gems as linked chains
      under each item, Guy's option E; Setups and the link colour regex are
      gone. Local checks and adversarial review passed. Remaining: check the
      build panel once the shared dev update lands, then finish. No docs needed:
      no reference docs cover this panel.
    date: '2026-11-05T12:03:10.363Z'
    completionComment: true
    id: c-2026-11-05t12-03-10-363z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T12:03:10.363Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as b36264c and live in the dev copy at 9a3784a1. The dev server
      serves the new Gear tab with no build errors in its log; the panel itself
      was checked headlessly on poghoag, not on the live overlay. No docs
      needed: no reference docs cover this panel.
    completionComment: true
    date: '2026-11-05T12:17:05.869Z'
    id: c-2026-11-05t12-17-05-869z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T12:17:06.366Z'
swimlane: null
needsAction: null
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/167'
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
diffSummary:
  - file: docs/.vitepress/theme/landing/Landing.vue
    additions: 363
    deletions: 131
  - file: docs/.vitepress/theme/landing/content.js
    additions: 65
    deletions: 23
  - file: docs/public/shots/hero.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/readme-banner.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-essence.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-loot.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-maps.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/story-price.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-boss-runs.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-boss.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-campaign-chip.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-campaign.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-filter-prices.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-filter-rules.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-map-mods.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-market.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-pob.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-regex.webp
    additions: 0
    deletions: 0
  - file: docs/public/shots/tour-trade.webp
    additions: 0
    deletions: 0
  - file: testing/e2e/landing-shots.spec.ts
    additions: 211
    deletions: 4
---
> **TL;DR:** Show each item's gems on its Gear row and drop the Setups tab. Mocks are up; waiting on Guy's pick. No code yet.

Mocks: https://claude.ai/artifact/6HE8EvsEftsfzPEDcUVdVC

What the merge has to handle (from 25 of Guy's PoB files):
- 225 of 318 enabled gem groups (71%) name a gear slot. Imported characters are near 100%, guide-style builds are not (andyglad 6 of 44, zizworb 21 of 57). Unslotted groups need their own section.
- `isGearSlot` hides weapon swap, but swap sockets hold gems (Enlighten, Empower), so the swap row has to come back.
- A slot can hold two groups (lumi merc lance, MidGame boots).
- A skill set can have an empty item set (Lvl 35 RF + Merc): draw the slot with no item.
- Setups shows all skill sets at once; the merged tab shows the picked set, so set chips must cover both kinds.
- Passive tree links move to the toolbar.
- Item-granted skills (Lost Unity, Circle of Anguish) show on the ring row.
- The row hover shows the item tooltip; hovering a gem inside it must show the gem tooltip instead.
