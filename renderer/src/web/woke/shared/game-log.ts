// Client.txt lines for every module: one listener on APT's log stream, each
// line parsed once (parseLogLine), handed to every subscriber. Modules that
// need what happened while the app was closed use followGameLog, which
// replays the start-up tail first and holds live lines until it's done.
import { getCurrentScope, onScopeDispose } from 'vue'
import { Host } from '@/web/background/IPC'
import { parseLogLine } from '../campaign/log-parse'
import type { LogEvent } from '../campaign/log-parse'
import { lineTime, logTail } from '../campaign/log-tail'
import type { LogTail } from '../campaign/log-tail'

export interface LogLine {
  line: string
  // ms: arrival time for live lines, the log's own timestamp for replayed ones.
  at: number
  // Area / zone / level event, when the line is one.
  ev: LogEvent | null
}

type Batch = (lines: LogLine[]) => void

const subscribers = new Set<Batch>()
let listening = false

function listen () {
  if (listening) return
  listening = true
  Host.onEvent('MAIN->CLIENT::game-log', (e) => {
    if (!subscribers.size) return
    const at = Date.now()
    const batch = e.lines.map(line => ({ line, at, ev: parseLogLine(line) }))
    for (const sub of [...subscribers]) sub(batch)
  })
}

// Stops with the calling component (or effect scope), or with the returned function.
function autoStop (stop: () => void): () => void {
  if (getCurrentScope()) onScopeDispose(stop)
  return stop
}

// Live lines, as they're written.
export function onGameLog (cb: Batch): () => void {
  listen()
  subscribers.add(cb)
  return autoStop(() => { subscribers.delete(cb) })
}

// Live lines, after replaying the start-up tail. `since()` (ms) picks which
// tail lines replay: only those written after it (null: none). `onTail` sees
// the tail (path null: Client.txt wasn't found).
export function followGameLog (opts: {
  since: () => number | null
  onLines: (lines: LogLine[], live: boolean) => void
  onTail?: (tail: LogTail) => void
}): () => void {
  let caughtUp = false
  let stopped = false
  const queued: LogLine[][] = []
  const stop = onGameLog((lines) => {
    if (caughtUp) opts.onLines(lines, true)
    else queued.push(lines)
  })
  logTail().then(tail => {
    if (stopped) return
    opts.onTail?.(tail)
    const since = opts.since()
    if (since == null) return
    const sinceSec = Math.floor(since / 1000) * 1000
    const replay: LogLine[] = []
    for (const line of tail.lines) {
      const at = lineTime(line)
      if (at != null && at > sinceSec) replay.push({ line, at, ev: parseLogLine(line) })
    }
    if (replay.length) opts.onLines(replay, false)
  }).catch(() => {}).finally(() => {
    caughtUp = true
    if (stopped) return
    for (const lines of queued.splice(0)) opts.onLines(lines, true)
  })
  return autoStop(() => { stopped = true; stop() })
}
