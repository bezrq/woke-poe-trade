---
id: WOKEPOET-121
title: Release build splits files across two draft releases
status: Grooming
priority: Medium
effort: S
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-06T02:01:17.856Z'
    comment: Created ticket.
---
> **TL;DR:** The release build for v0.1.0 made two drafts for one tag, so one file landed in the wrong draft. Fix this before the next release, because a misplaced `latest.yml` or installer would break updates.

Seen in run 42147088430: the nsis and portable targets upload at the same time, and each created a draft for v0.1.0. Draft 436003962 got only the installer's blockmap; 436003964 got everything else. I copied the blockmap across by hand before publishing.

Likely fix: in `.github/workflows/release.yml`, create the draft first and let electron-builder upload into it, or publish the two targets one after the other. Confirm with a throwaway tag.

Stray draft 436003962 is still on GitHub, visible only to repo collaborators. It's safe for Guy to delete.
