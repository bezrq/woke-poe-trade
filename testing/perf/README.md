# Performance checks

`perf.spec.ts` runs the toolkit with **every module on** against the fake game
(see ../README.md) and measures:

| Area | What | Kind |
| --- | --- | --- |
| Bundle | JS loaded at startup, all JS | size |
| Startup | bundle evaluated, app on screen, page load → hotkeys registered | time |
| In a map (mouse still, then moving at 125 Hz) | timer callbacks, animation frames, messages between app and overlay, layouts, style recalcs, overlay main-thread time | count (time for CPU) |
| Opening the overlay (Shift+Space) | main-thread work, style + layout | time |
| Price check | item text → panel drawn (median of 5) | time |
| Memory | OCR workers loaded before any scan, overlay JS heap after GC, DOM nodes, event listeners | count / size |

Counts and sizes are the same on any machine, so going over `budgets.json`
fails the run. Times depend on the machine, so their budgets are loose (3x)
and going over is a warning on the PR, not a failure.

```sh
cd renderer && npx vite build
cd ../testing && npm run test:perf
```

Results: `perf-results/perf.md` (the table, also in the GitHub job summary)
and `perf-results/perf.json` (plus details: startup marks, timings, which
intervals ticked, DOM elements per widget).

## Over budget?

- **A new timer or message while playing** (`map.*.wakeups`, `messages`):
  something now ticks or talks while you play. Tick only while the thing is
  on screen (`useVisibleClock`, `tickWhile`) or react to an event instead.
  `perf.json` → `details["map.still"].intervalsByDelay` shows the interval's
  delay, which usually finds it.
- **An OCR worker before any scan**: something loads opencv + tesseract
  (100-200 MB) at startup. Load it on first use.
- **Heap, DOM nodes, bundle**: expected to grow a little with features.
  When the growth is intended, refresh the budgets and commit them:

```sh
WOKE_PERF_UPDATE=1 npm run test:perf   # rewrites perf/budgets.json (+15%, times 3x)
```
