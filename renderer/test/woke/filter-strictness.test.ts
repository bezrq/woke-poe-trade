// Loot filter strictness: the ladder that follows your maps, and the hotkey
// targets for stepping it.
import { describe, it, expect } from 'vitest'
import { DEFAULT_LADDER, defaultStrictnessAuto, ladderTarget, ladderZone, levelForArea, pushArea, stepLabel, clampLevel } from '@/web/woke/loot-filter/strictness'
import { outputName, parseStrictnessTarget, strictnessHotkeyTarget, NEVERSINK_OUTPUT, normalizeLootFilterWidget } from '@/web/woke/loot-filter/widget'
import type { LootFilterWidget } from '@/web/woke/loot-filter/widget'

describe('strictness ladder', () => {
  it('maps area levels to NeverSink levels', () => {
    expect(levelForArea(DEFAULT_LADDER, 45)).toBe(1) // acts: Regular
    expect(levelForArea(DEFAULT_LADDER, 68)).toBe(2) // T1: Semi-strict
    expect(levelForArea(DEFAULT_LADDER, 81)).toBe(3) // T14: Strict
    expect(levelForArea(DEFAULT_LADDER, 83)).toBe(4) // T16: Very strict
    expect(levelForArea(DEFAULT_LADDER, 86)).toBe(4)
  })

  it('names the steps the way players do', () => {
    expect([0, 1, 2, 3].map(i => stepLabel(DEFAULT_LADDER, i))).toEqual(['Acts', 'T1-T10', 'T11-T15', 'T16+'])
  })

  it('uses the highest of the last few maps, so one low zone does not drop it', () => {
    let recent: number[] = []
    for (const a of [83, 83, 70]) recent = pushArea(recent, a)
    expect(ladderTarget(defaultStrictnessAuto(), recent)).toBe(4)
    for (const a of [70, 70, 70]) recent = pushArea(recent, a)
    expect(recent).toEqual([70, 70, 70])
    expect(ladderTarget(defaultStrictnessAuto(), recent)).toBe(2)
  })

  it('follows maps and the campaign, not the lab, boss arenas or side areas', () => {
    expect(['MapWorldsStrand', '1_2_3', '2_10_1'].every(ladderZone)).toBe(true)
    expect(['3_Labyrinth_boss_3', 'MapWorldsShapersRealm', 'MapSideArea_Vaal', 'Delve_Main', 'HeistDungeon1', 'HideoutCoastal'].some(ladderZone)).toBe(false)
  })

  it('does nothing when off, paused, or before any map', () => {
    expect(ladderTarget({ ...defaultStrictnessAuto(), on: false }, [83])).toBeNull()
    expect(ladderTarget({ ...defaultStrictnessAuto(), paused: true }, [83])).toBeNull()
    expect(ladderTarget(defaultStrictnessAuto(), [])).toBeNull()
    expect(clampLevel(9)).toBe(6)
    expect(clampLevel(-1)).toBe(0)
  })
})

describe('strictness hotkeys and output', () => {
  it('round-trips the hotkey target', () => {
    expect(parseStrictnessTarget(strictnessHotkeyTarget(7, 'stricter'))).toEqual({ wmId: 7, dir: 'stricter' })
    expect(parseStrictnessTarget('woke-loot-filter:7')).toBeNull()
  })

  it('saves NeverSink from GitHub to one fixed file', () => {
    expect(outputName({ sourceName: 'x.filter', saveMode: 'copy', sourceOnline: false, sourceTitle: '', neversink: { on: true } })).toBe(NEVERSINK_OUTPUT)
    expect(outputName({ sourceName: 'x.filter', saveMode: 'copy', sourceOnline: false, sourceTitle: '', neversink: { on: false } })).toBe('x (woke).filter')
  })

  it('fills new settings into an old config', () => {
    const w = { wmId: 1, wmType: 'woke-loot-filter', wmTitle: '', wmWants: 'hide', wmZorder: null, wmFlags: [], edits: [] } as unknown as LootFilterWidget
    normalizeLootFilterWidget(w)
    expect(w.neversink.on).toBe(false)
    expect(w.neversink.level).toBe(1)
    expect(w.strictAuto.ladder).toHaveLength(4)
    expect(w.stricterHotkey).toBe('Alt + BracketRight')
    expect(w.priceTiers.on).toBe(true)
    expect(w.safetyNet.minChaos).toBe(20)
  })
})
