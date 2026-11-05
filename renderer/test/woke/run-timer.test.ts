// The run timer against what Client.txt really writes: the area ids, speakers
// and character mix-ups below all come from a real log.
import { describe, it, expect } from 'vitest'
import { parseLogLine } from '@/web/woke/campaign/log-parse'
import {
  HISTORY_LIMIT, SUB_SPLITS, applyBossSpeech, applyRunEvent, bestSegments, endRun, isCleanRun, newRun, personalBest, startRun, sumOfBest
} from '@/web/woke/campaign/run-timer'
import type { CampaignRun, RunTimerWidget } from '@/web/woke/campaign/run-timer'

type W = Pick<RunTimerWidget, 'run' | 'history' | 'autoStart' | 'charName' | 'subSplits'>

function widget (): W {
  return { run: null, history: [], autoStart: true, charName: '', subSplits: true }
}

const MIN = 60_000
const area = (id: string) => `2026/11/05 10:00:00 1 abc [DEBUG Client 1] Generating level 10 area "${id}" with seed 1`
const say = (who: string) => `2026/11/05 10:00:00 1 abc [INFO Client 1] ${who}: Some line.`

function enter (w: W, id: string, at: number) {
  applyRunEvent(w, parseLogLine(area(id))!, at)
}

// A finished run with `actMin` minutes in each of the 10 acts.
function finished (id: number, actMin: number[]): CampaignRun {
  const run = newRun(id)
  let total = 0
  run.splits = actMin.map((m, i) => { total += m * MIN; return { act: i + 1, totalMs: total, level: 50 } })
  run.act = 10
  run.finished = true
  return run
}

describe('run timer and other characters', () => {
  it('an alt entering a later act moves nothing', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    enter(w, '1_2_town', 10 * MIN)
    enter(w, '2_9_town', 11 * MIN)
    expect(w.run!.act).toBe(2)
    expect(w.run!.splits.map(s => s.act)).toEqual([1])
  })

  it('the Epilogue finishes a run only from act 10', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    enter(w, '1_2_town', 10 * MIN)
    enter(w, '2_11_endless', 12 * MIN)
    expect(w.run!.finished).toBe(false)
    expect(w.history).toEqual([])
  })

  it('walking the acts in order still splits each and finishes', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    const acts = ['1_2_town', '1_3_town', '1_4_town', '1_5_town', '2_6_town', '2_7_town', '2_8_town', '2_9_town', '2_10_town', '2_11_endless']
    acts.forEach((id, i) => { enter(w, id, (i + 1) * 10 * MIN) })
    expect(w.run!.finished).toBe(true)
    expect(w.run!.splits.map(s => s.act)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(personalBest(w.history)?.id).toBe(w.run!.id)
  })
})

describe('personal best with broken runs saved earlier', () => {
  const clean = finished(1, Array<number>(10).fill(30))
  // What an alt used to cause: 8 acts in the same instant, a 2-minute "PB".
  const broken = finished(2, [1, 1, 0, 0, 0, 0, 0, 0, 0, 0])

  it('tells them apart', () => {
    expect(isCleanRun(clean)).toBe(true)
    expect(isCleanRun(broken)).toBe(false)
  })

  it('leaves broken runs out of PB and sum of best', () => {
    expect(personalBest([broken, clean])?.id).toBe(1)
    expect(bestSegments([broken, clean]).get(3)).toBe(30 * MIN)
    expect(sumOfBest([broken, clean])).toBe(300 * MIN)
  })

  it('keeps the PB when newer runs fill the history', () => {
    const w = widget()
    w.history = [finished(1, Array<number>(10).fill(30))]
    for (let i = 0; i <= HISTORY_LIMIT; i++) {
      startRun(w, 1000 + i * 2 * MIN)
      w.run!.elapsedMs = 2 * MIN
      w.run!.runningSince = null
      w.run!.splits = [{ act: 1, totalMs: 2 * MIN, level: 5 }]
      endRun(w, 1000 + i * 2 * MIN)
    }
    expect(w.history.length).toBe(HISTORY_LIMIT)
    expect(personalBest(w.history)?.id).toBe(1)
  })
})

describe('boss sub-splits', () => {
  it('every boss sits in an area of its own act', () => {
    for (const def of SUB_SPLITS) {
      expect(Number(/^\d+_(\d+)_/.exec(def.areaId)?.[1])).toBe(def.act)
    }
  })

  it('a boss that speaks is timed by its first line in its area', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    enter(w, '1_1_7_2', 5 * MIN)
    expect(w.run!.marks).toEqual([])
    expect(applyBossSpeech(w, say('Brutus, the Warden'), 7 * MIN)).toBe(true)
    expect(applyBossSpeech(w, say('Brutus, the Warden'), 8 * MIN)).toBe(false)
    expect(w.run!.marks).toEqual([{ id: 'brutus', totalMs: expect.any(Number) }])
    expect(w.run!.marks![0].totalMs).toBe(w.run!.elapsedMs + 7 * MIN - w.run!.runningSince!)
  })

  it('the same words anywhere else count for nothing', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    enter(w, '1_1_6', MIN)
    expect(applyBossSpeech(w, say('Brutus, the Warden'), 2 * MIN)).toBe(false)
    expect(applyBossSpeech(w, say('Merveil'), 2 * MIN)).toBe(false)
  })

  it('player chat never counts', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    enter(w, '1_1_7_2', MIN)
    expect(applyBossSpeech(w, say('#Brutus, the Warden'), 2 * MIN)).toBe(false)
  })

  it('a boss that stays silent is timed on entering its area', () => {
    const w = widget()
    enter(w, '1_1_1', 0)
    enter(w, '1_2_town', MIN)
    enter(w, '1_2_10', 2 * MIN)
    expect(w.run!.marks!.map(m => m.id)).toEqual(['weaver'])
  })

  it('stay off when the setting is off', () => {
    const w = widget()
    w.subSplits = false
    enter(w, '1_1_1', 0)
    enter(w, '1_1_7_2', MIN)
    expect(applyBossSpeech(w, say('Brutus, the Warden'), 2 * MIN)).toBe(false)
    expect(w.run!.marks).toEqual([])
  })
})
