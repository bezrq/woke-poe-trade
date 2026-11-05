// The Prices tab's "valuable items your filter hides" list, and the dock card.
import { describe, it, expect } from 'vitest'
import { gradeItems, healthKey, isDismissed, priceBar, priceGrade, showEffect, trashCount } from '@/web/woke/loot-filter/health'
import { canTurnOff, markSeen, visibleNotices } from '@/web/woke/loot-filter/notices'
import type { Notice } from '@/web/woke/loot-filter/notices'
import { ECONOMY_GROUPS, priceBreakdown, priceLookup } from '@/web/woke/loot-filter/economy'
import { applyEdits, conditionSignature } from '@/web/woke/loot-filter/edits'
import { matchItem } from '@/web/woke/loot-filter/match'
import { parseFilter, serializeFilter } from '@/web/woke/loot-filter/parse'
import { SAFETY_LOOK } from '@/web/woke/loot-filter/safety'
import type { BaseVerdict } from '@/web/woke/loot-filter/safety'
import type { ItemFacts } from '@/web/woke/loot-filter/item-facts'
import type { PriceItem } from '@/web/woke/market/types'

const uniques = ECONOMY_GROUPS.find(g => g.unique)!
const cards = ECONOMY_GROUPS.find(g => g.type === 'divination')!

function priced (name: string, chaos: number, type = 'UniqueWeapon', variant = ''): PriceItem {
  return { type, name, chaos, variant, sparkline: [1, 1, 1, 1, 1, 1, 1] } as unknown as PriceItem
}

const SOURCE = 'Hide # $type->uniques $tier->hideable\n\tRarity Unique\n\tBaseType == "Despot Axe"\n\nShow # $type->gear $tier->all\n\tBaseType == "Despot Axe"\n'

function verdict (over: Partial<BaseVerdict> = {}): BaseVerdict {
  return { group: uniques, base: 'Despot Axe', chaos: 91, thin: false, block: parseFilter(SOURCE).blocks[0], state: 'hidden', mine: false, ...over }
}

describe('price grades', () => {
  it('reads against your safety net line and the trash line', () => {
    expect(priceGrade(91, 20)).toBe('high')
    expect(priceGrade(20, 20)).toBe('high')
    expect(priceGrade(19, 20)).toBe('mid')
    expect(priceGrade(5, 20)).toBe('mid')
    expect(priceGrade(4.9, 20)).toBe('trash')
    expect(priceGrade(1, 20)).toBe('trash')
    expect(priceGrade(null, 20)).toBe('unknown')
    // A line under the trash line: a 3c item above your line isn't trash.
    expect(priceGrade(3, 2)).toBe('high')
  })

  it('sorts the best first, no price last, and counts the trash', () => {
    const items = gradeItems([
      { name: 'Unpriced', chaos: null, thin: false },
      { name: 'Debeon', chaos: 1, thin: false },
      { name: 'Kingmaker', chaos: 91, thin: false }
    ], 20)
    expect(items.map(i => i.name)).toEqual(['Kingmaker', 'Debeon', 'Unpriced'])
    expect(trashCount(items)).toBe(1)
  })

  it('draws bars that stay readable and in bounds', () => {
    expect(priceBar(100, 100)).toBe(100)
    expect(priceBar(1, 1000)).toBeGreaterThanOrEqual(4)
    expect(priceBar(1, 1000)).toBeLessThan(priceBar(50, 1000))
    expect(priceBar(null, 100)).toBe(0)
    expect(priceBar(5, 0)).toBe(0)
  })
})

describe('what a base can be', () => {
  const axes = (base: string) => base === 'Despot Axe' ? ['Kingmaker', "Debeon's Dirge", 'Replica Kingmaker', 'Unlisted Axe'] : []
  const items = [priced('Kingmaker', 91), priced("Debeon's Dirge", 1), priced('Replica Kingmaker', 900), priced('Kingmaker', 500, 'UniqueWeapon', '6L')]

  it('lists every unique on the base with its plain price, and no replicas', () => {
    expect(priceBreakdown(items, axes)(uniques, 'Despot Axe')).toEqual([
      { name: 'Kingmaker', chaos: 91, thin: false },
      { name: "Debeon's Dirge", chaos: 1, thin: false },
      { name: 'Unlisted Axe', chaos: null, thin: false }
    ])
  })

  it('agrees with the price the base is judged by', () => {
    const lookup = priceLookup(items, axes)
    const list = gradeItems(priceBreakdown(items, axes)(uniques, 'Despot Axe'), 20)
    expect(lookup(uniques, 'Despot Axe')?.chaos).toBe(list[0].chaos)
  })

  it('a card is just itself', () => {
    expect(priceBreakdown([priced('The Fishmonger', 10, 'DivinationCard')], axes)(cards, 'The Fishmonger')).toEqual([{ name: 'The Fishmonger', chaos: 10, thin: false }])
  })
})

describe('what Show it says, against what it does', () => {
  const twoUniques = gradeItems([{ name: 'Kingmaker', chaos: 91, thin: false }, { name: "Debeon's Dirge", chaos: 1, thin: false }], 20)

  it('names the base, the rarity, and the other uniques', () => {
    const text = showEffect(verdict(), twoUniques).join(' ')
    expect(text).toContain('every unique Despot Axe shows')
    expect(text).toContain('Normal, magic and rare Despot Axe stay as they are')
    expect(text).toContain('The other unique on this base shows too')
    expect(text).toContain('undo')
  })

  it('does just that in the file', () => {
    const doc = parseFilter(SOURCE)
    const b = doc.blocks[0]
    applyEdits(doc, [{ id: 1, kind: 'item', type: b.type!, tier: b.tier!, base: 'Despot Axe', visibility: 'Show', patch: SAFETY_LOOK, anchor: conditionSignature(b), pin: true }])
    const out = parseFilter(serializeFilter(doc))
    const axe: ItemFacts = { name: 'x', baseType: 'Despot Axe', influences: [], explicitModNames: [] }
    expect(matchItem(out, { ...axe, rarity: 'Unique' }).visibility).toBe('Show')
    expect(matchItem(out, { ...axe, rarity: 'Unique' }).final?.block.type).toBe('woke->own')
    expect(matchItem(out, { ...axe, rarity: 'Rare' }).final?.block.type).toBe('gear')
  })

  it('a card has no others to mention, and no rarity', () => {
    const block = parseFilter('Hide # $type->divination $tier->t4c\n\tClass == "Divination Cards"\n\tBaseType == "The Fishmonger"\n').blocks[0]
    const text = showEffect(verdict({ group: cards, base: 'The Fishmonger', block }), gradeItems([{ name: 'The Fishmonger', chaos: 10, thin: false }], 20)).join(' ')
    expect(text).toContain('The Fishmonger shows')
    expect(text).not.toContain('other')
    expect(text).not.toContain('Normal, magic')
  })

  it('says a rarity range as written, since the rule keeps it', () => {
    const block = parseFilter('Hide # $type->x $tier->y\n\tRarity <= Rare\n\tBaseType == "A"\n').blocks[0]
    expect(showEffect(verdict({ base: 'A', block }), [])[0]).toContain('every A of rarity <= Rare shows')
  })

  it('says bigger, not shown, for a small label', () => {
    expect(showEffect(verdict({ state: 'small' }), twoUniques)[0]).toContain('font size 40')
  })
})

describe('Not for me', () => {
  it('holds until the price doubles', () => {
    const v = verdict()
    const dismissed = { [healthKey(v)]: 91 }
    expect(isDismissed(dismissed, v)).toBe(true)
    expect(isDismissed(dismissed, { ...v, chaos: 181 })).toBe(true)
    expect(isDismissed(dismissed, { ...v, chaos: 182 })).toBe(false)
    expect(isDismissed({}, v)).toBe(false)
    expect(isDismissed(dismissed, { ...v, base: 'Other' })).toBe(false)
  })
})

describe('dock notices', () => {
  const safety: Notice = { id: 'safety', value: 5, text: '' }
  const wrong: Notice = { id: 'wrong', value: 'x', warn: true, text: '' }
  const pending: Notice = { id: 'pending', value: 1, passing: true, text: '' }

  it('Got it holds until the number changes', () => {
    expect(visibleNotices([safety], { off: [], seen: {} })).toEqual([safety])
    expect(visibleNotices([safety], { off: [], seen: { safety: 5 } })).toEqual([])
    expect(visibleNotices([{ ...safety, value: 6 }], { off: [], seen: { safety: 5 } })).toHaveLength(1)
  })

  it('turning a notice off holds for any number', () => {
    expect(visibleNotices([{ ...safety, value: 99 }], { off: ['safety'], seen: {} })).toEqual([])
  })

  it('a warning about the filter not working can\'t be turned off', () => {
    expect(canTurnOff(wrong)).toBe(false)
    expect(canTurnOff(safety)).toBe(true)
    // A new NeverSink version can be put off, not silenced for good.
    expect(canTurnOff({ id: 'update', value: '8.21', text: '' })).toBe(false)
    expect(visibleNotices([wrong], { off: ['wrong'], seen: {} })).toEqual([wrong])
  })

  it('Got it on a warning isn\'t saved, so it returns after a restart', () => {
    const next = markSeen([safety, wrong, pending], {}, {})
    expect(next.saved).toEqual({ safety: 5 })
    expect(next.session).toEqual({ wrong: 'x' })
    expect(visibleNotices([safety, wrong], { off: [], seen: next.saved })).toEqual([wrong])
  })

  it('a passing note stays until it passes', () => {
    expect(visibleNotices([pending], { off: ['pending'], seen: { pending: 1 } })).toEqual([pending])
    expect(canTurnOff(pending)).toBe(false)
  })
})
