// Campaign run timer: times a run from the Twilight Strand to the Epilogue,
// with one split per act, driven by the Client.txt lines in log-parse.ts.
// Pure functions only, so the rules are easy to follow and to test.

import type { Widget, Anchor } from '@/web/overlay/widgets'
import type { LogEvent } from './log-parse'
import { actFromAreaId } from './log-parse'

export const RUN_TIMER_TYPE = 'woke-run-timer'

// Acts with a split. Entering act 11 (the Epilogue, after Kitava) ends the run.
export const LAST_ACT = 10
export const START_AREA_ID = '1_1_1' // The Twilight Strand
export const HISTORY_LIMIT = 30

export interface RunSplit {
  act: number
  // Run time when the act was finished (the first entry into the next act).
  totalMs: number
  level: number | null
}

export interface CampaignRun {
  id: number
  startedAt: number
  // Run time banked before the last resume; see runElapsed().
  elapsedMs: number
  runningSince: number | null
  act: number
  zone: string
  // Run time when the current zone was entered.
  zoneSinceMs: number
  charName: string
  className: string
  level: number | null
  splits: RunSplit[]
  finished: boolean
  endedAt: number | null
}

export interface RunTimerWidget extends Widget {
  anchor: Anchor
  // Start a run on entering the Twilight Strand.
  autoStart: boolean
  // Only follow this character's level-ups ('' = any).
  charName: string
  // Show the splits panel under the strip.
  expanded: boolean
  // Run to race against; null = personal best.
  compareTo: number | null
  run: CampaignRun | null
  history: CampaignRun[]
}

export function newRun (now: number): CampaignRun {
  return {
    id: now,
    startedAt: now,
    elapsedMs: 0,
    runningSince: now,
    act: 1,
    zone: '',
    zoneSinceMs: 0,
    charName: '',
    className: '',
    level: null,
    splits: [],
    finished: false,
    endedAt: null
  }
}

export function runElapsed (run: CampaignRun, now: number): number {
  return run.elapsedMs + (run.runningSince != null ? Math.max(0, now - run.runningSince) : 0)
}

export function isRunning (run: CampaignRun | null): boolean {
  return run != null && !run.finished && run.runningSince != null
}

export function pauseRun (run: CampaignRun, now: number) {
  if (run.runningSince == null) return
  run.elapsedMs = runElapsed(run, now)
  run.runningSince = null
}

export function resumeRun (run: CampaignRun, now: number) {
  if (run.runningSince != null || run.finished) return
  run.runningSince = now
}

export function finishRun (run: CampaignRun, now: number) {
  pauseRun(run, now)
  run.finished = true
  run.endedAt = now
}

// Total run time of a finished run (the time of its last split).
export function runTotal (run: CampaignRun): number | null {
  if (!run.finished) return null
  const last = run.splits[run.splits.length - 1]
  return last?.act === LAST_ACT ? last.totalMs : null
}

export function isComplete (run: CampaignRun): boolean {
  return runTotal(run) != null
}

function saveToHistory (w: Pick<RunTimerWidget, 'history'>, run: CampaignRun) {
  w.history = [run, ...w.history.filter(r => r.id !== run.id)].slice(0, HISTORY_LIMIT)
}

// Ends the current run by hand. In act 10 this counts as finishing the
// campaign (for when the Epilogue isn't seen in the log).
export function endRun (w: Pick<RunTimerWidget, 'run' | 'history'>, now: number) {
  const run = w.run
  if (!run || run.finished) return
  if (run.act === LAST_ACT && !splitAt(run, LAST_ACT)) {
    run.splits.push({ act: LAST_ACT, totalMs: runElapsed(run, now), level: run.level })
  }
  finishRun(run, now)
  if (run.splits.length === 0 && run.elapsedMs < 60_000) {
    // A run that never left act 1 in its first minute is noise.
    w.run = null
    return
  }
  saveToHistory(w, run)
}

// Ends the current run (if any) and clears it.
export function archiveRun (w: Pick<RunTimerWidget, 'run' | 'history'>, now: number) {
  endRun(w, now)
  w.run = null
}

export function startRun (w: Pick<RunTimerWidget, 'run' | 'history'>, now: number) {
  archiveRun(w, now)
  w.run = newRun(now)
}

// Applies one Client.txt event. Returns true when anything changed.
export function applyRunEvent (
  w: Pick<RunTimerWidget, 'run' | 'history' | 'autoStart' | 'charName'>,
  ev: LogEvent,
  now: number
): boolean {
  if (ev.kind === 'area') {
    // A new character starts on the Twilight Strand. Coming back to it in the
    // same run (before reaching act 2) keeps the run going.
    if (ev.areaId === START_AREA_ID && w.autoStart &&
      (!w.run || w.run.finished || w.run.splits.length > 0)) {
      startRun(w, now)
      return true
    }
    const run = w.run
    if (!run || run.finished) return false
    const act = actFromAreaId(ev.areaId)
    if (act == null || act <= run.act) return false
    const at = runElapsed(run, now)
    for (let a = run.act; a < act && a <= LAST_ACT; a++) {
      run.splits.push({ act: a, totalMs: at, level: run.level })
    }
    run.act = Math.min(act, LAST_ACT)
    if (act > LAST_ACT) {
      finishRun(run, now)
      saveToHistory(w, run)
    }
    return true
  }

  const run = w.run
  if (!run || run.finished) return false

  if (ev.kind === 'zone') {
    run.zone = ev.name
    run.zoneSinceMs = runElapsed(run, now)
    return true
  }
  if (ev.kind === 'level') {
    const wanted = w.charName.trim()
    if (wanted && wanted !== ev.charName) return false
    // Follow the first character that levels during this run.
    if (!wanted && run.charName && run.charName !== ev.charName) return false
    run.charName = ev.charName
    run.className = ev.className
    run.level = ev.level
    return true
  }
  return false
}

// ---- comparisons ----

export function splitAt (run: CampaignRun, act: number): RunSplit | undefined {
  return run.splits.find(s => s.act === act)
}

// Time spent in one act (segment), or null if the run has no split for it.
export function segmentMs (run: CampaignRun, act: number): number | null {
  const s = splitAt(run, act)
  if (!s) return null
  if (act === 1) return s.totalMs
  const prev = splitAt(run, act - 1)
  return prev ? s.totalMs - prev.totalMs : null
}

export function personalBest (history: CampaignRun[]): CampaignRun | null {
  let best: CampaignRun | null = null
  for (const run of history) {
    const total = runTotal(run)
    if (total != null && (best == null || total < runTotal(best)!)) best = run
  }
  return best
}

// The run to race: the picked one, else the PB. Never the current run itself.
export function comparisonRun (w: Pick<RunTimerWidget, 'compareTo' | 'history' | 'run'>): CampaignRun | null {
  const others = w.run ? w.history.filter(r => r.id !== w.run!.id) : w.history
  if (w.compareTo != null) {
    const picked = others.find(r => r.id === w.compareTo)
    if (picked) return picked
  }
  return personalBest(others)
}

// Fastest time for each act across the given runs.
export function bestSegments (runs: CampaignRun[]): Map<number, number> {
  const best = new Map<number, number>()
  for (const run of runs) {
    for (const s of run.splits) {
      const seg = segmentMs(run, s.act)
      if (seg == null) continue
      const cur = best.get(s.act)
      if (cur == null || seg < cur) best.set(s.act, seg)
    }
  }
  return best
}

// Sum of the best act times; null until every act has been finished at least once.
export function sumOfBest (runs: CampaignRun[]): number | null {
  const best = bestSegments(runs)
  let total = 0
  for (let act = 1; act <= LAST_ACT; act++) {
    const seg = best.get(act)
    if (seg == null) return null
    total += seg
  }
  return total
}

export interface SplitRow {
  act: number
  state: 'done' | 'current' | 'todo'
  segmentMs: number | null
  totalMs: number | null
  level: number | null
  // Comparison run's totals at the end of this act.
  cmpTotalMs: number | null
  cmpSegmentMs: number | null
  deltaMs: number | null
  // Faster than this act's best time in every earlier run.
  gold: boolean
}

export function splitRows (run: CampaignRun | null, cmp: CampaignRun | null, history: CampaignRun[], now: number): SplitRow[] {
  const others = run ? history.filter(r => r.id !== run.id) : history
  const best = bestSegments(others)
  const rows: SplitRow[] = []
  for (let act = 1; act <= LAST_ACT; act++) {
    const s = run ? splitAt(run, act) : undefined
    const cmpSplit = cmp ? splitAt(cmp, act) : undefined
    const cmpSeg = cmp ? segmentMs(cmp, act) : null
    if (run && s) {
      const seg = segmentMs(run, act)
      const prevBest = best.get(act)
      rows.push({
        act,
        state: 'done',
        segmentMs: seg,
        totalMs: s.totalMs,
        level: s.level,
        cmpTotalMs: cmpSplit?.totalMs ?? null,
        cmpSegmentMs: cmpSeg,
        deltaMs: cmpSplit ? s.totalMs - cmpSplit.totalMs : null,
        gold: seg != null && prevBest != null && seg < prevBest
      })
    } else if (run && !run.finished && act === run.act) {
      const total = runElapsed(run, now)
      const prev = act > 1 ? splitAt(run, act - 1) : undefined
      rows.push({
        act,
        state: 'current',
        segmentMs: total - (prev?.totalMs ?? 0),
        totalMs: null,
        level: run.level,
        cmpTotalMs: cmpSplit?.totalMs ?? null,
        cmpSegmentMs: cmpSeg,
        // Only show a live delta once you're already behind the comparison.
        deltaMs: cmpSplit && total > cmpSplit.totalMs ? total - cmpSplit.totalMs : null,
        gold: false
      })
    } else {
      rows.push({
        act,
        state: 'todo',
        segmentMs: null,
        totalMs: null,
        level: null,
        cmpTotalMs: cmpSplit?.totalMs ?? null,
        cmpSegmentMs: cmpSeg,
        deltaMs: null,
        gold: false
      })
    }
  }
  return rows
}

// Delta shown on the strip: live when you're behind on the current act,
// otherwise the delta at the last finished act.
export function headlineDelta (rows: SplitRow[]): number | null {
  const current = rows.find(r => r.state === 'current')
  if (current?.deltaMs != null) return current.deltaMs
  const done = rows.filter(r => r.state === 'done' && r.deltaMs != null)
  return done.length ? done[done.length - 1].deltaMs : null
}

// ---- formatting ----

// 1:12:04 over an hour, 14:31 under.
export function formatRunTime (ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

// −0:42 (ahead) / +1:05 (behind).
export function formatDelta (ms: number): string {
  const sign = ms < 0 ? '−' : '+'
  return sign + formatRunTime(Math.abs(ms))
}
