import { describe, it, expect } from 'vitest'
import { LOOT_FILTER_TYPE, seedLootFilterWidget } from '@/web/woke/loot-filter/widget'
import { itemFacts } from '@/web/woke/loot-filter/item-facts'
import type { ParsedItem } from '@/parser'

describe('seedLootFilterWidget', () => {
  it('is ready and hidden, so adding it opens nothing over the game', () => {
    const w = seedLootFilterWidget(7)
    expect(w.wmId).toBe(7)
    expect(w.wmType).toBe(LOOT_FILTER_TYPE)
    expect(w.wmWants).toBe('hide')
    expect(w.wmFlags).not.toContain('uninitialized')
    expect(w.sampleHotkey).toBe('Alt + F')
  })

  it('leaves a key unset when something else already uses it', () => {
    const w = seedLootFilterWidget(1, ['Alt + F'])
    expect(w.sampleHotkey).toBeNull()
    expect(w.editorHotkey).toBe('Alt + Shift + F')
    expect(seedLootFilterWidget(1, ['Shift + Alt + F']).editorHotkey).toBeNull()
  })
})

describe('map base type', () => {
  const copy = [
    'Item Class: Maps', 'Rarity: Unique', "Caer Blaidd, Wolfpack's Den", 'Map (Tier 16)', '--------', 'Map Tier: 16'
  ].join('\r\n')

  it('names a unique map the way filters do, not the parser\'s plain "Map"', () => {
    const parsed = { info: { namespace: 'UNIQUE', refName: "Caer Blaidd, Wolfpack's Den" }, uniqueBase: { refName: 'Map' }, mapTier: 16, influences: [] } as unknown as ParsedItem
    expect(itemFacts(copy, parsed).baseType).toBe('Map (Tier 16)')
  })

  it('reads it from the copy when the parser has nothing', () => {
    expect(itemFacts(copy, null).baseType).toBe('Map (Tier 16)')
  })

  it('leaves other items alone', () => {
    const boots = ['Item Class: Boots', 'Rarity: Rare', 'Dread Tread', 'Wool Shoes'].join('\r\n')
    expect(itemFacts(boots, null).baseType).toBe('Wool Shoes')
  })
})
