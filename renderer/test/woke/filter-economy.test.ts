// Loot filter: re-tiering price groups from poe.ninja, the safety net that
// shows valuable hidden items, and the syntax check run before every save.
import { describe, it, expect } from 'vitest'
import { parseFilter, serializeFilter } from '@/web/woke/loot-filter/parse'
import { ECONOMY_GROUPS, applyPriceMoves, lockKey, mergeMoves, planRetier, priceLookup, tierRank } from '@/web/woke/loot-filter/economy'
import type { PriceLookup } from '@/web/woke/loot-filter/economy'
import { applyEdits } from '@/web/woke/loot-filter/edits'
import { auditBases, safetyBases, safetyBlocks, SAFETY_RULE_TYPE } from '@/web/woke/loot-filter/safety'
import { insertBuildBlocks } from '@/web/woke/loot-filter/build-rules'
import { matchItem } from '@/web/woke/loot-filter/match'
import { validateFilter } from '@/web/woke/loot-filter/validate'
import type { PriceItem } from '@/web/woke/market/types'

const block = (vis: string, type: string, tier: string, bases: string[], extra = '') => [
  `${vis} # %H1 $type->${type} $tier->${tier}`,
  '\tClass == "Divination Cards"',
  `\tBaseType == ${bases.map(b => `"${b}"`).join(' ')}`,
  extra ? `\t${extra}` : null,
  '\tSetFontSize 40',
  ''
].filter(x => x != null).join('\n')

const FILTER = [
  '# NeverSink test filter',
  block('Show', 'divination', 't1', ['The Apothecary', 'House of Mirrors']),
  block('Show', 'divination', 't2', ['The Fiend', 'Brother\'s Gift', 'Unrequited Love']),
  block('Show', 'divination', 't3', ['The Wolf', 'Lucky Connections', 'The Saint\'s Treasure']),
  block('Show', 'divination', 'tnew', ['New Card']),
  block('Show', 'divination', 't4', ['Rain of Chaos', 'The Gambler', 'Her Mask', 'Lantador\'s Lost Love']),
  block('Hide', 'divination', 't5', ['The Carrion Crow', 'Rain Tempter', 'Hidden Gem']),
  ''
].join('\n')

const DIV = ECONOMY_GROUPS.find(g => g.type === 'divination')!

function card (name: string, chaos: number, gaps = 0): PriceItem {
  return { type: 'DivinationCard', name, variant: '', chaos, gaps }
}

const PRICES: PriceItem[] = [
  card('The Apothecary', 30000), card('House of Mirrors', 60000),
  card('The Fiend', 900), card('Unrequited Love', 600),
  card('Brother\'s Gift', 30), // fell from t2 to t3 money
  card('The Wolf', 40), card('Lucky Connections', 25), card('The Saint\'s Treasure', 50),
  card('Rain of Chaos', 1), card('The Gambler', 2), card('Her Mask', 1.5), card('Lantador\'s Lost Love', 2.5),
  card('The Carrion Crow', 0.1), card('Rain Tempter', 0.2),
  card('Hidden Gem', 2000, 0), // hidden, but worth a lot
  card('New Card', 5000)
]

const noUniques = () => []
const lookup = () => priceLookup(PRICES, noUniques)

describe('tier ranks', () => {
  it('reads tN, suffixed currency tiers, and skips special ones', () => {
    expect(tierRank('t1', ['t1', 't2'])).toBe(1)
    expect(tierRank('t3annul', ['t3annul', 't4chaos'])).toBe(3)
    expect(tierRank('t4c', ['t4', 't4c'])).toBeNull()
    expect(tierRank('t3stackedex', ['t3'])).toBeNull()
    expect(tierRank('tnew', [])).toBeNull()
    expect(tierRank('restex', [])).toBeNull()
    expect(tierRank('hideable', [], ECONOMY_GROUPS.find(g => g.unique))).toBe(4)
  })
})

describe('re-tier from prices', () => {
  it('moves items whose price left their tier, keeping unpriced and special tiers alone', () => {
    const plan = planRetier(parseFilter(FILTER), lookup(), { groups: [DIV] })
    const moves = Object.fromEntries(plan.moves.map(m => [m.base, `${m.from}->${m.to}`]))
    expect(moves['Brother\'s Gift']).toBe('t2->t3')
    expect(moves['Hidden Gem']).toBe('t5->t2')
    // tnew isn't a price tier: its card is never moved.
    expect(moves['New Card']).toBeUndefined()
    // Items comfortably inside their band stay.
    expect(moves['The Fiend']).toBeUndefined()
    expect(moves['Rain of Chaos']).toBeUndefined()
  })

  it('needs the price to clear a boundary by the buffer before moving', () => {
    const doc = parseFilter(FILTER)
    const report = planRetier(doc, lookup(), { groups: [DIV] }).groups[0]
    const t3 = report.bands.find(b => b.tier === 't3')!.median!
    const t4 = report.bands.find(b => b.tier === 't4')!.median!
    const line = Math.sqrt(t3 * t4)
    const near: PriceItem[] = [...PRICES.filter(p => p.name !== 'Her Mask'), card('Her Mask', line * 1.1)]
    const plan = planRetier(doc, priceLookup(near, noUniques), { groups: [DIV] })
    expect(plan.moves.find(m => m.base === 'Her Mask')).toBeUndefined()
    // (Her Mask is in t4, so its own price shifts t4's median; t3's median is clear of any line.)
    const far: PriceItem[] = [...PRICES.filter(p => p.name !== 'Her Mask'), card('Her Mask', t3)]
    expect(planRetier(doc, priceLookup(far, noUniques), { groups: [DIV] }).moves.find(m => m.base === 'Her Mask')?.to).toBe('t3')
  })

  it('never moves thin-market or hand-placed items, and says why', () => {
    const thin = [...PRICES.filter(p => p.name !== 'Hidden Gem'), card('Hidden Gem', 2000, 4)]
    const plan = planRetier(parseFilter(FILTER), priceLookup(thin, noUniques), { groups: [DIV], locked: new Set([lockKey('divination', 'Brother\'s Gift')]) })
    expect(plan.moves.map(m => m.base)).not.toContain('Hidden Gem')
    expect(plan.moves.map(m => m.base)).not.toContain('Brother\'s Gift')
    expect(plan.skipped).toEqual(expect.arrayContaining([
      expect.objectContaining({ base: 'Hidden Gem', reason: 'thin' }),
      expect.objectContaining({ base: 'Brother\'s Gift', reason: 'locked' })
    ]))
  })

  it('applies stored moves to a fresh parse and is stable on the next plan', () => {
    const plan = planRetier(parseFilter(FILTER), lookup(), { groups: [DIV] })
    const doc = parseFilter(FILTER)
    expect(applyPriceMoves(doc, plan.moves)).toBe(plan.moves.length)
    const gem = matchItem(doc, { name: 'Hidden Gem', baseType: 'Hidden Gem', itemClass: 'Divination Cards', influences: [] } as any)
    expect(gem.final?.block.tier).toBe('t2')
    expect(gem.visibility).toBe('Show')
    // Prices unchanged: nothing more to do.
    expect(planRetier(doc, lookup(), { groups: [DIV] }).moves).toEqual([])
    // Output still parses and keeps the untouched blocks byte for byte.
    const text = serializeFilter(doc)
    expect(text).toContain('"Hidden Gem"')
    expect(parseFilter(text).blocks).toHaveLength(parseFilter(FILTER).blocks.length)
  })

  it('folds repeated moves and drops one that returns home', () => {
    const a = { type: 'divination', base: 'X', from: 't3', to: 't2', chaos: 1 }
    const merged = mergeMoves([a], [{ ...a, from: 't2', to: 't1' }])
    expect(merged).toEqual([{ ...a, from: 't3', to: 't1' }])
    expect(mergeMoves(merged, [{ ...a, from: 't1', to: 't3' }])).toEqual([])
  })

  it('prices a unique base by its best unique', () => {
    const uniques: PriceItem[] = [
      { type: 'UniqueArmour', name: 'Junk Robe', variant: '', chaos: 1 },
      { type: 'UniqueArmour', name: 'Great Robe', variant: '', chaos: 400 },
      { type: 'UniqueArmour', name: 'Great Robe', variant: '6L', chaos: 9000 }
    ]
    const on = (base: string) => base === 'Silk Robe' ? ['Junk Robe', 'Great Robe'] : []
    const group = ECONOMY_GROUPS.find(g => g.unique)!
    expect(priceLookup(uniques, on, 'max')(group, 'Silk Robe')?.chaos).toBe(400)
    expect(priceLookup(uniques, on, 'min')(group, 'Silk Robe')?.chaos).toBe(1)
  })
})

describe('safety net', () => {
  it('shows valuable items the filter hides, and only those', () => {
    const doc = parseFilter(FILTER)
    const look: PriceLookup = lookup()
    const bases = safetyBases(doc, look, 20)
    expect(bases.plain).toEqual(['Hidden Gem'])
    insertBuildBlocks(doc, safetyBlocks(bases))
    const gem = matchItem(doc, { name: 'Hidden Gem', baseType: 'Hidden Gem', itemClass: 'Divination Cards', influences: [] } as any)
    expect(gem.final?.block.type).toBe(SAFETY_RULE_TYPE)
    expect(gem.visibility).toBe('Show')
    const crow = matchItem(doc, { name: 'The Carrion Crow', baseType: 'The Carrion Crow', itemClass: 'Divination Cards', influences: [] } as any)
    expect(crow.visibility).toBe('Hide')
  })

  it('lists hidden valuable items in the health audit', () => {
    const audit = auditBases(parseFilter(FILTER), lookup(), 10)
    expect(audit.find(v => v.base === 'Hidden Gem')?.state).toBe('hidden')
    expect(audit.find(v => v.base === 'The Fiend')?.state).toBe('ok')
  })
})

describe('syntax check', () => {
  it('passes an edited filter and names a broken rule', () => {
    const doc = parseFilter(FILTER)
    applyEdits(doc, [{ id: 1, kind: 'style', type: 'divination', tier: 't1', patch: { fontSize: 45, sound: { id: '6', volume: 300 } } }])
    expect(validateFilter(doc)).toEqual([])
    applyEdits(doc, [{ id: 2, kind: 'style', type: 'divination', tier: 't2', patch: { fontSize: 99, icon: { size: 1, color: 'Teal', shape: 'Star' } } }])
    const problems = validateFilter(doc).map(p => p.message)
    expect(problems).toEqual(expect.arrayContaining([expect.stringMatching(/font size 99/), expect.stringMatching(/minimap colour "Teal"/)]))
  })

  it('accepts the safety net rules it writes', () => {
    const doc = parseFilter(FILTER)
    insertBuildBlocks(doc, safetyBlocks({ plain: ['Hidden Gem'], unique: ['Silk Robe'] }))
    expect(validateFilter(doc)).toEqual([])
  })
})
