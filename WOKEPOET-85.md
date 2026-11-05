---
id: WOKEPOET-85
title: 'Run timer: stop other characters from faking splits and the PB'
status: Done
priority: High
effort: None
assignee: unassigned
tags:
  - bug
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T10:54:19.532Z'
    comment: Created ticket.
    id: a-2026-11-05t10-54-19-532z
  - type: activity
    user: Agent
    date: '2026-11-05T12:02:38.128Z'
    comment: Updated implementation link.
    id: a-2026-11-05t12-02-38-128z
  - type: comment
    user: Agent
    comment: >-
      PR #170 also covers WOKEPOET-84 and WOKEPOET-86. Known limit: an alt
      entering exactly the next act still counts; that's WOKEPOET-90.
    date: '2026-11-05T12:02:38.185Z'
    selfAttested: true
    id: c-2026-11-05t12-02-38-185z
  - type: comment
    user: Agent
    comment: 'Merged in PR #170.'
    date: '2026-11-05T12:29:17.980Z'
    completionComment: true
    id: c-2026-11-05t12-29-17-980z
  - type: status_change
    from: Grooming
    to: Done
    user: Agent
    date: '2026-11-05T12:29:17.980Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/170'
needsAction: null
---
Step 3 of the [gameplay helpers critique](https://claude.ai/artifact/NjdEZhrQZBmKwRB56yTsoj). No new UI.

Replay of the real log: PB 2.2 minutes, and 12 of 24 finished runs have zero-length acts.

- Ignore a jump of more than one act.
- End a run at the Epilogue only from act 10.
- Leave broken runs out of PB and sum of best.
- Keep the PB when the 30-run history fills up.
