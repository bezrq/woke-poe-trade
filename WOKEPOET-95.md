---
id: WOKEPOET-95
title: Merge the Gear and Setups tabs in the build panel
status: In Progress
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
swimlane: null
needsAction: null
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
