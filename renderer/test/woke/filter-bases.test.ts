// Every base type NeverSink names must be reachable: an item of that base,
// copied in game, has to read back as exactly the name the filter uses. A name
// that differs ("Map" vs "Map (Tier 16)") makes rules and edits silently miss.
import { describe, it, expect, beforeAll } from 'vitest'
import { parseFilter } from '@/web/woke/loot-filter/parse'
import { itemFacts } from '@/web/woke/loot-filter/item-facts'
import { matchItem } from '@/web/woke/loot-filter/match'
import { parseClipboard } from '@/parser'
import { loadGameData } from '../helpers/game-data'
import { neverSink } from '../helpers/neversink'

beforeAll(loadGameData)

const RARITY_LINE: Record<string, string> = {
  'Stackable Currency': 'Currency',
  'Delve Stackable Socketable Currency': 'Currency',
  'Divination Cards': 'Divination Card',
  'Skill Gems': 'Gem',
  'Support Gems': 'Gem'
}

function copyOf (base: string, itemClass: string, rarity: string): string {
  const shown = RARITY_LINE[itemClass] ?? rarity
  const name = shown === 'Unique' || shown === 'Rare' ? 'Some Name\n' : ''
  return `Item Class: ${itemClass}\nRarity: ${shown}\n${name}${base}\n--------\nItem Level: 84\n--------\n`
}

// Every (base, class, rarity) a block in the file lists.
function listed (): Array<{ base: string, itemClass: string, rarity: string, line: number }> {
  const out = new Map<string, { base: string, itemClass: string, rarity: string, line: number }>()
  for (const b of parseFilter(neverSink('1-REGULAR')).blocks) {
    const bases = b.conditions.find(c => c.key === 'BaseType' && c.op === '==')
    if (!bases) continue
    const cls = b.conditions.find(c => c.key === 'Class')?.values[0] ?? 'Stackable Currency'
    const rarities = b.conditions.find(c => c.key === 'Rarity')
    const rarity = rarities && rarities.op === '' ? rarities.values[0] : 'Normal'
    for (const base of bases.values) {
      if (!out.has(base)) out.set(base, { base, itemClass: cls, rarity, line: b.line })
    }
  }
  return [...out.values()]
}

describe('every base NeverSink lists', () => {
  it('reads back under the same name from a copy', () => {
    const wrong: string[] = []
    const noClass: string[] = []
    const all = listed()
    for (const it of all) {
      const text = copyOf(it.base, it.itemClass, it.rarity)
      const res = parseClipboard(text)
      const facts = itemFacts(text, res.isOk() ? res.value : null)
      if (facts.baseType !== it.base) wrong.push(`${it.base} (${it.itemClass}, line ${it.line}) read as ${facts.baseType ?? '(nothing)'}${res.isOk() ? '' : ` [parser: ${res.error}]`}`)
      if (facts.itemClass !== it.itemClass) noClass.push(it.base)
    }
    expect(all.length).toBeGreaterThan(500)
    expect(wrong).toEqual([])
    expect(noClass).toEqual([])
  })

  it('finds a rule for each', () => {
    const doc = parseFilter(neverSink('1-REGULAR'))
    const none: string[] = []
    for (const it of listed()) {
      const text = copyOf(it.base, it.itemClass, it.rarity)
      const res = parseClipboard(text)
      const m = matchItem(doc, { ...itemFacts(text, res.isOk() ? res.value : null), areaLevel: 83 })
      if (!m.final) none.push(it.base)
    }
    expect(none).toEqual([])
  })
})
