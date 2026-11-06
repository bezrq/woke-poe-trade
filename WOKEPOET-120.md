---
id: WOKEPOET-120
title: Publish first public Windows release from master
status: In Progress
priority: High
effort: S
assignee: unassigned
tags:
  - feature
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T01:55:11.935Z'
    comment: Created ticket.
---
> **TL;DR:** Build the Windows installer from current master through release.yml as a draft release, check it without launching over PoE, then publish it.

The repo has no releases or v0.x tags yet, so this is the first one and `main/package.json` stays at 0.1.0. Publishing makes the installer public and starts the auto-update feed.

Steps: confirm CI on master, push tag v0.1.0, inspect the draft's assets (latest.yml hash, app-update.yml feed, version, bundled OCR), write notes, publish after Guy's go.
