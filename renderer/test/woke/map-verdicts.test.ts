// Verdicts must not say "safe" by accident: reworded mods keep their rating,
// and a map with mods that can't be read is never a plain RUN.
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { loadGameData } from '../helpers/game-data'
import { allAreaMods } from '@/web/woke/map-mods/data'
import { PRESETS, carryRewordedRatings, deadRatings, defaultProfile, rateMods } from '@/web/woke/map-mods/rules'
import type { ModRating } from '@/web/woke/map-mods/rules'
import { isUnsure } from '@/web/woke/map-mods/check'

vi.mock('@/web/Config', () => ({ AppConfig: () => ({ widgets: [] }), pushHostConfig: () => {} }))

const THORNS = 'Rare Monsters have Physical Thorns reflecting # Physical Damage'
const ELE_THORNS = 'Rare Monsters have Elemental Thorns reflecting # Elemental Damage'
const MELEE = '#% of Melee Physical Damage taken reflected to Attacker'
const OLD = 'Monsters reflect #% of Physical Damage'

beforeAll(async () => { await loadGameData() })

describe('reflect in the default profile', () => {
  it('rates mods the game really has', () => {
    expect(deadRatings(defaultProfile().ratings, allAreaMods())).toEqual([])
  })

  it('flags both kinds of Thorns', () => {
    for (const matcher of [THORNS, ELE_THORNS, MELEE]) {
      expect(rateMods([{ matcher, roll: 200 }], defaultProfile()).verdict).toBe('careful')
    }
  })

  it('no preset names a mod the game no longer has', () => {
    const known = new Set(allAreaMods())
    expect(PRESETS.flatMap(p => p.matchers).filter(m => !known.has(m))).toEqual([])
  })
})

describe('rating reworded mods', () => {
  it('moves a rating to the new wording', () => {
    const ratings: Record<string, ModRating> = { [OLD]: 'deadly' }
    carryRewordedRatings(ratings)
    expect(ratings).toEqual({ [THORNS]: 'deadly', [MELEE]: 'deadly' })
  })

  it("keeps the player's own rating on the new wording", () => {
    const ratings: Record<string, ModRating> = { [OLD]: 'deadly', [THORNS]: 'good' }
    carryRewordedRatings(ratings)
    expect(ratings[THORNS]).toBe('good')
    expect(ratings[MELEE]).toBe('deadly')
  })

  it('stays gone once removed', () => {
    const ratings: Record<string, ModRating> = { [OLD]: 'deadly' }
    carryRewordedRatings(ratings)
    delete ratings[THORNS]
    carryRewordedRatings(ratings)
    expect(ratings[THORNS]).toBeUndefined()
  })

  it('lists ratings on mods that no longer exist', () => {
    expect(deadRatings({ [THORNS]: 'warn', 'No such mod': 'deadly' }, allAreaMods())).toEqual(['No such mod'])
  })
})

describe('unsure maps', () => {
  const profile = defaultProfile()
  const clean = rateMods([{ matcher: 'Area contains two Unique Bosses' }], profile)
  const risky = rateMods([{ matcher: THORNS, roll: 100 }], profile)

  it('a RUN with an unreadable mod is unsure', () => {
    expect(isUnsure({ unidentified: false, unknown: ['Strange new mod'], verdict: clean })).toBe(true)
  })

  it('a clean read is a plain RUN', () => {
    expect(isUnsure({ unidentified: false, unknown: [], verdict: clean })).toBe(false)
  })

  it('a warning still shows even with an unreadable mod', () => {
    expect(isUnsure({ unidentified: false, unknown: ['Strange new mod'], verdict: risky })).toBe(false)
  })

  it('an unidentified map is always unsure', () => {
    expect(isUnsure({ unidentified: true, unknown: [], verdict: rateMods([], profile) })).toBe(true)
  })
})
