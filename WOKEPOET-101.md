---
id: WOKEPOET-101
title: Update the About page contact section to Guy's Discord
status: Done
priority: Low
effort: XS
assignee: unassigned
tags: []
createdBy: Agent
updatedBy: Agent
history:
  - type: activity
    user: Agent
    date: '2026-11-05T12:37:10.728Z'
    comment: Created ticket.
    id: a-2026-11-05t12-37-10-728z
  - type: activity
    user: Agent
    date: '2026-11-05T12:41:52.039Z'
    comment: Updated implementation link.
    id: a-2026-11-05t12-41-52-039z
  - type: comment
    user: Agent
    comment: >-
      PR #181: contact section now reads "Contact me on the r/pathofexile
      Discord," with @whec and the r/pathofexile link; TFT link and gif removed;
      en, ko and ru updated. Lint, 2310 unit tests, test typecheck and build
      pass; page rendered from the branch; independent review found no defects.
      Sent to the coordinator to merge. Open point for Guy: whether he is on the
      r/pathofexile server.
    date: '2026-11-05T12:41:53.609Z'
    completionComment: true
    id: c-2026-11-05t12-41-53-609z
  - type: status_change
    from: In Progress
    to: Ready
    user: Agent
    date: '2026-11-05T12:41:53.609Z'
  - type: comment
    user: Agent
    comment: >-
      Merged as ff1fda5. The About page contact section now shows @whec and the
      r/pathofexile link, with the TFT link and gif removed. The dev update is
      handled by another thread. Open point: if Guy isn't on the r/pathofexile
      server, the wording needs a one-line follow-up.
    completionComment: true
    date: '2026-11-05T12:45:27.889Z'
    id: c-2026-11-05t12-45-27-889z
  - type: status_change
    from: Ready
    to: Done
    user: Agent
    date: '2026-11-05T12:45:28.413Z'
implementationLink: 'https://github.com/guybnd/woke-poe-trade/pull/181'
needsAction: null
baselineCommit: ae9d149f9c555d42e467c95e82514624d060baa7
swimlane: null
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
The settings About page still shows the inherited Awakened PoE Trade contact block: the original author's Discord ID and links to The Forbidden Trove and r/pathofexile.

Change it to contact Guy: Discord username @whec, no TFT link. Credit to the original author stays in the credits page.
