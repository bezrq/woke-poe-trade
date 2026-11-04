// Campaign run timer: times a run from the Twilight Strand to the Epilogue,
// with one split per act, driven by the Client.txt lines in log-parse.ts.
// Pure functions only, so the rules are easy to follow and to test.

import type { Widget, Anchor } from '@/web/overlay/widgets'
import type { LogEvent } from './log-parse'
import { actFromAreaId } from './log-parse'
import { formatClock } from '../ui/format'

export const RUN_TIMER_TYPE = 'woke-run-timer'

// Acts with a split. Entering act 11 (the Epilogue, after Kitava) ends the run.
export const LAST_ACT = 10
export const START_AREA_ID = '1_1_1' // The Twilight Strand
export const HISTORY_LIMIT = 30

// A boss or key zone inside an act, timed on the first entry into its zone.
export interface SubSplitDef {
  id: string
  act: number
  label: string
  // "You have entered …" zone names that count as reaching it.
  zones: string[]
}

export const SUB_SPLITS: SubSplitDef[] = [
  { id: 'brutus', act: 1, label: 'Brutus', zones: ["The Warden's Quarters"] },
  { id: 'merveil', act: 1, label: 'Merveil', zones: ["Merveil's Lair"] },
  { id: 'weaver', act: 2, label: 'The Weaver', zones: ["The Weaver's Nest"] },
  { id: 'oversoul', act: 2, label: 'Vaal Oversoul', zones: ['Pyramid Apex'] },
  { id: 'dominus', act: 3, label: 'Dominus', zones: ['Tower Rooftop'] },
  { id: 'kaom', act: 4, label: 'Kaom', zones: ['Caldera of the King'] },
  { id: 'daresso', act: 4, label: 'Daresso', zones: ['The Ring of Blades'] },
  { id: 'malachai', act: 4, label: 'Malachai', zones: ['The Black Core'] },
  { id: 'avarius', act: 5, label: 'Avarius', zones: ['Sanctum of Innocence'] },
  { id: 'kitava5', act: 5, label: 'Kitava', zones: ['Cathedral Apex'] },
  { id: 'tukohama', act: 6, label: 'Tukohama', zones: ["Tukohama's Keep"] },
  { id: 'brine-king', act: 6, label: 'Brine King', zones: ["The Brine King's Throne", "The Bring King's Throne"] },
  { id: 'arakaali', act: 7, label: 'Arakaali', zones: ["Arakaali's Web"] },
  { id: 'doedre8', act: 8, label: 'Doedre', zones: ['The Cauldron'] },
  { id: 'shakari', act: 9, label: 'Shakari', zones: ['The Sand Pit'] },
  { id: 'garukhan', act: 9, label: 'Garukhan', zones: ['Shrine of the Winds'] },
  { id: 'trinity', act: 9, label: 'Depraved Trinity', zones: ['The Black Heart'] },
  { id: 'kitava10', act: 10, label: 'Kitava', zones: ['Altar of Hunger'] }
]

export interface RunMark {
  id: string
  totalMs: number
}

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
  // Sub-splits reached so far (missing on runs saved before sub-splits).
  marks?: RunMark[]
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
  // Time bosses and key zones inside each act.
  subSplits: boolean
  hotkeyPause: string | null
  hotkeySplits: string | null
  // Time of the last Client.txt line applied, to catch up after a restart.
  lastLogAt: number
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
    marks: [],
    finished: false,
    endedAt: null
  }
}

// Fills settings added after the widget was first placed.
export function migrateRunTimer (w: RunTimerWidget) {
  if (w.subSplits === undefined) w.subSplits = true
  if (w.hotkeyPause === undefined) w.hotkeyPause = null
  if (w.hotkeySplits === undefined) w.hotkeySplits = null
}

export function hotkeyTarget (wmId: number, action: 'pause' | 'splits'): string {
  return `woke-run-timer:${wmId}:${action}`
}

export function parseHotkeyTarget (target: string): { wmId: number, action: 'pause' | 'splits' } | null {
  const m = /^woke-run-timer:(\d+):(pause|splits)$/.exec(target)
  return m ? { wmId: Number(m[1]), action: m[2] as 'pause' | 'splits' } : null
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
  w: Pick<RunTimerWidget, 'run' | 'history' | 'autoStart' | 'charName'> & { subSplits?: boolean },
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
    if (w.subSplits !== false) {
      const def = SUB_SPLITS.find(d => d.act === run.act && d.zones.includes(ev.name))
      if (def && !markAt(run, def.id)) {
        run.marks = [...(run.marks ?? []), { id: def.id, totalMs: run.zoneSinceMs }]
      }
    }
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

export function markAt (run: CampaignRun, id: string): RunMark | undefined {
  return run.marks?.find(m => m.id === id)
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

export interface MarkRow {
  id: string
  label: string
  totalMs: number | null
  cmpTotalMs: number | null
  deltaMs: number | null
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
  // Sub-splits in this act that this run or the comparison run reached.
  marks: MarkRow[]
}

function markRows (run: CampaignRun | null, cmp: CampaignRun | null, act: number): MarkRow[] {
  const rows: MarkRow[] = []
  for (const def of SUB_SPLITS) {
    if (def.act !== act) continue
    const mine = run ? markAt(run, def.id) : undefined
    const theirs = cmp ? markAt(cmp, def.id) : undefined
    if (!mine && !theirs) continue
    rows.push({
      id: def.id,
      label: def.label,
      totalMs: mine?.totalMs ?? null,
      cmpTotalMs: theirs?.totalMs ?? null,
      deltaMs: mine && theirs ? mine.totalMs - theirs.totalMs : null
    })
  }
  return rows
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
        gold: seg != null && prevBest != null && seg < prevBest,
        marks: markRows(run, cmp, act)
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
        gold: false,
        marks: markRows(run, cmp, act)
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
        gold: false,
        marks: markRows(null, cmp, act)
      })
    }
  }
  return rows
}

// Delta shown on the strip: live when you're behind on the current act,
// then the last sub-split reached in this act, otherwise the delta at the
// last finished act.
export function headlineDelta (rows: SplitRow[]): number | null {
  const current = rows.find(r => r.state === 'current')
  if (current?.deltaMs != null) return current.deltaMs
  // The latest boss reached in this act is fresher than the last act split.
  const mark = current?.marks.filter(m => m.deltaMs != null).pop()
  if (mark) return mark.deltaMs
  const done = rows.filter(r => r.state === 'done' && r.deltaMs != null)
  return done.length ? done[done.length - 1].deltaMs : null
}

// ---- formatting ----

// 1:12:04 over an hour, 14:31 under.

// −0:42 (ahead) / +1:05 (behind).
export function formatDelta (ms: number): string {
  const sign = ms < 0 ? '−' : '+'
  return sign + formatClock(Math.abs(ms))
}
