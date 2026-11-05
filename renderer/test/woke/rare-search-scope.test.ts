// A rare's price is in its best mods. Its first search has to include them, and
// a search without any mods must not name a price.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fixture, loadGameData, parseItem } from '../helpers/game-data'

vi.mock('@/web/background/IPC', () => ({ Host: { proxy: async () => new Response('{}') } }))
vi.mock('@/web/Config', () => ({
  AppConfig: () => ({ apiLatencySeconds: 2, accountName: '' }),
  poeWebApi: () => 'www.pathofexile.com'
}))

/* eslint-disable import/first */
import { createPresets } from '@/web/price-check/filters/create-presets'
import { createTradeRequest } from '@/web/price-check/trade/pathofexile-trade'
import { isBlankRareSearch, skipsTopMods } from '@/web/woke/price-insight/search-scope'
import type { ParsedItem } from '@/parser'
import type { StatFilter } from '@/web/price-check/filters/interfaces'
/* eslint-enable import/first */

const OPTS = { league: 'Mirage', merchantOnly: true, currency: null, collapseListings: 'api' as const, activateStockFilter: false, searchStatRange: 10, useEn: false }

function amulet (mods: string, footer = ''): string {
  return `Item Class: Amulets
Rarity: Rare
Gale Beads
Onyx Amulet
--------
Requirements:
Level: 70
--------
Item Level: 86
--------
{ Implicit Modifier — Attribute }
+12(10-16) to all Attributes
--------
${mods}${footer}`
}

const T1_CRIT = '{ Suffix Modifier "of Destruction" (Tier: 1) — Damage, Critical }\n+38(35-38)% to Global Critical Strike Multiplier'
const T1_SPELL = '{ Prefix Modifier "Wizard\'s" (Tier: 1) — Damage, Caster }\n26(23-26)% increased Spell Damage'
const T5_SPELL = '{ Prefix Modifier "Mage\'s" (Tier: 5) — Damage, Caster }\n12(10-13)% increased Spell Damage'

function active (item: ParsedItem) {
  const { presets, active } = createPresets(item, OPTS)
  return presets.find(p => p.id === active)!
}
const ticked = (stats: unknown[]) => (stats as StatFilter[]).filter(f => !f.disabled && !f.hidden).map(f => f.statRef)

describe('rare searches', () => {
  beforeAll(loadGameData)

  it('tick T1 and T2 mods from the start, and they reach the search', () => {
    const preset = active(parseItem(amulet(`${T1_SPELL}\n${T1_CRIT}`)))
    expect(ticked(preset.stats)).toHaveLength(2)
    const body = createTradeRequest(preset.filters, preset.stats)
    expect(body.query.stats[0].filters.filter(f => !f.disabled)).toHaveLength(2)
  })

  it('leave lower tier mods off', () => {
    expect(ticked(active(parseItem(amulet(T5_SPELL))).stats)).toEqual([])
  })

  it('tick no more than 4 mods, best first', () => {
    const ring = parseItem(fixture('items/rare-ring.txt'))
    expect(ticked(active(ring).stats).length).toBeLessThanOrEqual(4)
  })

  it('leave veiled rares alone', () => {
    const item = parseItem(amulet(T1_CRIT))
    const veiled = { ...item, isVeiled: true } as ParsedItem
    expect(ticked(active(veiled).stats)).toEqual([])
  })

  it('leave uniques alone', () => {
    const kaom = parseItem(fixture('items/unique-kaoms-heart.txt'))
    expect(isBlankRareSearch(kaom, active(kaom).filters, [])).toBe(false)
    expect(skipsTopMods(kaom, active(kaom).stats)).toBe(false)
  })
})

describe('verdict scope', () => {
  beforeAll(loadGameData)

  it('calls a rare with nothing ticked blank', () => {
    const item = parseItem(amulet(T5_SPELL))
    const preset = active(item)
    expect(isBlankRareSearch(item, preset.filters, preset.stats)).toBe(true)
  })

  it('does not call a search with a mod ticked blank', () => {
    const item = parseItem(amulet(T1_CRIT))
    const preset = active(item)
    expect(isBlankRareSearch(item, preset.filters, preset.stats)).toBe(false)
  })

  it('does not call a crafting base search blank', () => {
    const item = parseItem(amulet(T5_SPELL, '\n--------\nElder Item'))
    const { presets } = createPresets(item, OPTS)
    const base = presets.find(p => p.id === 'filters.preset_base_item')!
    expect(isBlankRareSearch(item, base.filters, base.stats.map(s => ({ ...s, disabled: true })) as never)).toBe(false)
  })

  it('notices when a top mod gets unticked', () => {
    const item = parseItem(amulet(T1_CRIT))
    const preset = active(item)
    expect(skipsTopMods(item, preset.stats)).toBe(false)
    for (const s of preset.stats as StatFilter[]) s.disabled = true
    expect(skipsTopMods(item, preset.stats)).toBe(true)
    expect(isBlankRareSearch(item, preset.filters, preset.stats)).toBe(true)
  })
})
