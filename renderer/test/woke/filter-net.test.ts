// The safety net against NeverSink's real filters: whatever it promises to show
// has to show when the rules are walked the way the game walks them.
import { describe, it, expect } from 'vitest'
import { parseFilter } from '@/web/woke/loot-filter/parse'
import { ECONOMY_GROUPS, planRetier, priceBreakdown, priceLookup, safetyLookup } from '@/web/woke/loot-filter/economy'
import type { PriceLookup } from '@/web/woke/loot-filter/economy'
import { auditBases, lastNetList, safetyBases, safetyBlocks, SAFETY_RULE_TYPE } from '@/web/woke/loot-filter/safety'
import { insertBuildBlocks } from '@/web/woke/loot-filter/build-rules'
import { applyEdits } from '@/web/woke/loot-filter/edits'
import { matchItem } from '@/web/woke/loot-filter/match'
import type { ItemFacts } from '@/web/woke/loot-filter/item-facts'
import type { PriceItem } from '@/web/woke/market/types'
import { LEVELS, neverSink } from '../helpers/neversink'

const everything: PriceLookup = () => ({ chaos: 100, thin: false })
const UNIQUES = ECONOMY_GROUPS.find(g => g.type === 'uniques')!

function uniqueDrop (base: string): ItemFacts {
  return { name: base, baseType: base, rarity: 'Unique', areaLevel: 83, stackSize: 1, itemLevel: 83, quality: 0, identified: false, corrupted: false, replica: false, foulborn: false, mirrored: false, fractured: false, synthesised: false, socketGroups: [], influences: [], explicitModNames: [] }
}

describe('walking the real filters', () => {
  it.each(LEVELS)('%s: with the net on, no valuable plain drop stays hidden', (level) => {
    const doc = parseFilter(neverSink(level))
    const verdicts = auditBases(doc, everything, 20)
    insertBuildBlocks(doc, safetyBlocks(safetyBases(doc, everything, 20)))
    const left = verdicts.filter(v => v.group.unique && matchItem(doc, uniqueDrop(v.base)).visibility === 'Hide')
    expect(left.map(v => v.base)).toEqual([])
  })

  it('Soft hides no uniques, so the net has none to catch', () => {
    expect(safetyBases(parseFilter(neverSink('0-SOFT')), everything, 20).unique).toEqual([])
  })

  it('a Replica or Foulborn rule for a base says nothing about the plain unique', () => {
    const doc = parseFilter(neverSink('4-VERY-STRICT'))
    expect(matchItem(doc, uniqueDrop('Death Bow')).visibility).toBe('Hide')
    expect(auditBases(doc, everything, 20).find(v => v.group.unique && v.base === 'Death Bow')?.state).toBe('hidden')
    insertBuildBlocks(doc, safetyBlocks(safetyBases(doc, everything, 20)))
    expect(matchItem(doc, uniqueDrop('Death Bow')).final?.block.type).toBe(SAFETY_RULE_TYPE)
  })

  it('stays quick on the strictest filter with everything priced', () => {
    const doc = parseFilter(neverSink('6-UBER-PLUS-STRICT'))
    const start = performance.now()
    auditBases(doc, everything, 20)
    expect(performance.now() - start).toBeLessThan(1500)
  })
})

const FILTER = [
  'Show # $type->divination $tier->t1',
  '\tClass == "Divination Cards"',
  '\tBaseType == "The Doctor" "Top Card"',
  '\tSetFontSize 45',
  '',
  'Hide # $type->divination $tier->t5',
  '\tClass == "Divination Cards"',
  '\tBaseType == "Hidden Gem" "Low Card"',
  ''
].join('\n')

describe('who gets the net', () => {
  it('counts a thin market: a junk price costs a click, a miss costs the item', () => {
    const thin: PriceLookup = (_, base) => base === 'Hidden Gem' ? { chaos: 500, thin: true } : null
    expect(safetyBases(parseFilter(FILTER), thin, 20).plain).toEqual(['Hidden Gem'])
  })

  it('leaves what you hid yourself alone', () => {
    const doc = parseFilter(FILTER)
    applyEdits(doc, [{ id: 1, kind: 'item', type: 'divination', tier: 't1', base: 'The Doctor', visibility: 'Hide', patch: {}, pin: true }])
    const v = auditBases(doc, everything, 20).find(x => x.base === 'The Doctor')
    expect(v?.state).toBe('hidden')
    expect(v?.mine).toBe(true)
    expect(safetyBases(doc, everything, 20).plain).not.toContain('The Doctor')
  })

  it('leaves out what you said is not for you', () => {
    const list = safetyBases(parseFilter(FILTER), everything, 20, v => v.base === 'Low Card')
    expect(list.plain).toEqual(['Hidden Gem'])
  })

  it('keeps the last list when there are no prices, without names the filter lost', () => {
    const doc = parseFilter(FILTER)
    expect(lastNetList(doc, { plain: ['Hidden Gem', 'Removed Card'], unique: [] })).toEqual({ plain: ['Hidden Gem'], unique: [] })
    expect(lastNetList(doc, undefined)).toEqual({ plain: [], unique: [] })
  })
})

describe('uniques with variants', () => {
  const line = (variant: string, chaos: number, gaps = 0): PriceItem => ({ type: 'UniqueJewel', name: 'Voices', variant, chaos, gaps })
  const voices = [line('1 passives, Large Cluster Jewel', 500000, 5), line('3 passives, Large Cluster Jewel', 4000), line('5 passives, Large Cluster Jewel', 9), line('7 passives, Large Cluster Jewel', 1)]
  const on = () => ['Voices']

  it('never prices a drop by its cheapest variant', () => {
    expect(priceLookup(voices, on)(UNIQUES, 'Large Cluster Jewel')?.chaos).toBe(4000)
  })

  it('moves tiers by the best real market, and guards by the best of all', () => {
    expect(safetyLookup(voices, on)(UNIQUES, 'Large Cluster Jewel')?.chaos).toBe(500000)
    expect(priceBreakdown(voices, on)(UNIQUES, 'Large Cluster Jewel')[0].chaos).toBe(500000)
  })

  it('reads a unique on several bases by the base in question', () => {
    const items: PriceItem[] = [
      { type: 'UniqueAccessory', name: 'Emblem', variant: 'Topaz Ring', chaos: 50, gaps: 0 },
      { type: 'UniqueAccessory', name: 'Emblem', variant: 'Two-Stone Ring', chaos: 900, gaps: 0 }
    ]
    expect(priceLookup(items, () => ['Emblem'])(UNIQUES, 'Topaz Ring')?.chaos).toBe(50)
  })

  it('ignores link and relic lines, and takes a plain line over any variant', () => {
    const items: PriceItem[] = [
      { type: 'UniqueArmour', name: 'Robe', variant: '6L', chaos: 900, gaps: 0 },
      { type: 'UniqueArmour', name: 'Robe', variant: 'Relic', chaos: 800, gaps: 0 },
      { type: 'UniqueArmour', name: 'Robe', variant: 'Corrupted', chaos: 700, gaps: 0 },
      { type: 'UniqueArmour', name: 'Robe', variant: '', chaos: 5, gaps: 0 }
    ]
    expect(priceLookup(items, () => ['Robe'])(UNIQUES, 'Silk Robe')?.chaos).toBe(5)
  })

  it('no longer plans to hide a chase unique on its cheapest line', () => {
    const doc = parseFilter(neverSink('4-VERY-STRICT'))
    const moves = planRetier(doc, priceLookup(voices, on), { groups: [UNIQUES] }).moves
    expect(moves.find(m => m.base === 'Large Cluster Jewel')?.to).not.toBe('hideable')
  })
})
