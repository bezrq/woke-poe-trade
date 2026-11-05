// Map mods tabs: which mods each one lists, the T17 switch, the sorted list, and
// the verdict on heist items and charts. The chart is real item text from the game.
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { fixture, loadGameData, parseItem } from '../helpers/game-data'
import { allAreaMods, chartMods, heistMods, modsForMode, profileRegex, tier17Mods } from '@/web/woke/map-mods/data'
import { defaultProfile, modListRows } from '@/web/woke/map-mods/rules'
import type { MapModProfile } from '@/web/woke/map-mods/rules'
import { DEFAULT_JUICE_WEIGHTS } from '@/web/woke/map-mods/rules'
import { checkMap, isMapLike } from '@/web/woke/map-mods/check'
import { importAptOnce } from '@/web/woke/map-mods/widget'
import type { MapModsWidget } from '@/web/woke/map-mods/widget'

const config = vi.hoisted(() => ({ widgets: [] as unknown[] }))
vi.mock('@/web/Config', () => ({ AppConfig: () => config, pushHostConfig: () => {} }))

const DROWNING = 'Area contains Drowning Orbs'
const GUARDS = 'Guards deal #% increased Damage'

function profile (ratings: MapModProfile['ratings'], extra: Partial<MapModProfile> = {}): MapModProfile {
  return { ...defaultProfile(), ratings, ...extra }
}

function widget (p: MapModProfile, extra: Partial<MapModsWidget> = {}): MapModsWidget {
  return { activeProfile: p.id, profiles: [p], weights: { ...DEFAULT_JUICE_WEIGHTS }, ...extra } as MapModsWidget
}

beforeAll(loadGameData)

describe('mods per tab', () => {
  it('every chart mod is one the stat data can read', () => {
    expect(chartMods()).toHaveLength(46)
    expect(chartMods()).toContain('Monsters fire # additional Projectiles')
  })

  it('heist mods are their own list and stay out of Maps, even when rated', () => {
    expect(heistMods()).toContain(GUARDS)
    expect(allAreaMods()).not.toContain(GUARDS)
    const maps = modsForMode('maps', profile({ [GUARDS]: 'deadly' }))
    expect(maps).not.toContain(GUARDS)
    expect(modsForMode('heist', profile({}))).toContain(GUARDS)
  })

  it('the T17 switch takes T17 mods out of Maps only', () => {
    expect(tier17Mods().has(DROWNING)).toBe(true)
    expect(modsForMode('maps', profile({}))).toContain(DROWNING)
    expect(modsForMode('maps', profile({}, { hideT17: true }))).not.toContain(DROWNING)
    expect(modsForMode('maps', profile({ [DROWNING]: 'deadly' }, { hideT17: true }))).not.toContain(DROWNING)
    // Charts roll this T17 line too; the switch is about maps.
    expect(modsForMode('charts', profile({}, { hideT17: true })))
      .toContain("Monsters' Action Speed cannot be modified to below Base Value")
  })

  it('a rated mod under an old wording stays visible on Maps', () => {
    expect(modsForMode('maps', profile({ 'Old patch wording': 'deadly' }))).toContain('Old patch wording')
  })
})

describe('map search', () => {
  it('leaves out T17 picks with the switch off, and keeps their ratings', () => {
    const p = profile({ [DROWNING]: 'deadly' })
    expect(profileRegex(p).tokens[DROWNING]).toBeTruthy()
    p.hideT17 = true
    expect(profileRegex(p).tokens[DROWNING]).toBeUndefined()
    expect(profileRegex(p).text).toBe('')
    expect(p.ratings[DROWNING]).toBe('deadly')
  })

  it('never includes heist picks', () => {
    const res = profileRegex(profile({ [GUARDS]: 'deadly' }))
    expect(res.tokens[GUARDS]).toBeUndefined()
    expect(res.missing).toEqual([])
    expect(res.text).toBe('')
  })
})

describe('sorted list', () => {
  it('puts picks on top by rating, with a heading per group', () => {
    const rows = modListRows(['a', 'b', 'c', 'd'], { d: 'deadly', b: 'good' })
    expect(rows).toEqual([
      { kind: 'head', rating: 'deadly', count: 1 },
      { kind: 'mod', matcher: 'd' },
      { kind: 'head', rating: 'good', count: 1 },
      { kind: 'mod', matcher: 'b' },
      { kind: 'head', rating: 'ok', count: 2 },
      { kind: 'mod', matcher: 'a' },
      { kind: 'mod', matcher: 'c' }
    ])
  })

  it('has no headings when nothing is picked', () => {
    expect(modListRows(['a', 'b'], {})).toEqual([{ kind: 'mod', matcher: 'a' }, { kind: 'mod', matcher: 'b' }])
  })
})

describe('checking a chart', () => {
  const chart = () => parseItem(fixture('items/chart-sandy-seabed.txt'))

  it('reads all four mods, without the unrevealed Voyage line', () => {
    const item = chart()
    expect(isMapLike(item)).toBe(true)
    const res = checkMap(item, widget(profile({})))
    expect(res.verdict.mods.map(m => m.matcher).sort()).toEqual([
      'Area has patches of Shocked Ground which increase Damage taken by #%',
      'Monsters deal #% extra Physical Damage as Cold',
      'Monsters fire # additional Projectiles',
      'Monsters have #% increased Area of Effect'
    ])
    expect(res.unknown).toEqual([])
  })

  it('keeps the juice score from its rarity and pack size', () => {
    const res = checkMap(chart(), widget(profile({})))
    expect(res.props).toEqual([{ label: 'Rarity', value: 60 }, { label: 'Pack', value: 36 }])
    expect(res.juice?.score).toBeGreaterThan(0)
  })

  it('a rating made on any tab decides the verdict', () => {
    const res = checkMap(chart(), widget(profile({ 'Monsters fire # additional Projectiles': 'deadly' })))
    expect(res.verdict.verdict).toBe('skip')
  })
})

describe('checking a heist contract', () => {
  const contract = () => parseItem([
    'Item Class: Contracts',
    'Rarity: Rare',
    'Silent Deal',
    'Contract: Bunker',
    '--------',
    'Client: Example',
    'Heist Target: Enchanted Armaments (Moderate Value)',
    'Area Level: 81',
    'Requires Lockpicking (Level 4)',
    '--------',
    'Item Level: 83',
    '--------',
    '{ Prefix Modifier "Example" (Tier: 1) }',
    'Guards deal 30% increased Damage',
    '{ Suffix Modifier "of Example" (Tier: 1) }',
    'No Travel Cost'
  ].join('\n'))

  it('rates its mods and has no juice score', () => {
    const item = contract()
    expect(isMapLike(item)).toBe(true)
    const res = checkMap(item, widget(profile({ [GUARDS]: 'deadly' })))
    expect(res.verdict.verdict).toBe('skip')
    expect(res.verdict.deadly[0].text).toBe('Guards deal 30% increased Damage')
    expect(res.juice).toBeNull()
  })
})

describe('final import from the old list', () => {
  const itemCheck = (selectedStats: Array<{ matcher: string, decision: string }>) => ({
    wmType: 'item-check',
    maps: { profile: 1, showNewStats: false, selectedStats }
  })

  it('brings over marks made since the first import, once', () => {
    const p = profile({ [GUARDS]: 'warn' })
    const w = widget(p, { aptImported: true })
    config.widgets = [itemCheck([
      { matcher: 'Reward Rooms have #% increased Monsters', decision: 'd--' },
      { matcher: GUARDS, decision: 'd--' }
    ])]
    importAptOnce(w)
    expect(p.ratings['Reward Rooms have #% increased Monsters'] ?? w.profiles[0].ratings['Reward Rooms have #% increased Monsters']).toBe('deadly')
    // Already rated here: keeps it.
    expect(w.profiles[0].ratings[GUARDS]).toBe('warn')

    // A later removal isn't undone.
    w.profiles[0].ratings = {}
    importAptOnce(w)
    expect(w.profiles[0].ratings).toEqual({})
  })
})
