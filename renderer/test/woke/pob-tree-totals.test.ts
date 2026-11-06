// What a passive tree adds up to, on made-up nodes shaped like the real data.
import { describe, expect, it } from 'vitest'
import { filterTotals, groupTotals, matchingNodes, treeTotals } from '@/web/woke/pob-builds/tree-totals'
import type { NodeKind, TreeNode } from '@/web/woke/pob-builds/passive-tree'

const node = (id: number, stats: string[], kind: NodeKind = 'small', name = ''): TreeNode =>
  ({ id, x: 0, y: 0, kind, name, stats, out: [], icon: '', group: 0, radius: 0, angle: 0 })

const nodes = new Map([
  node(1, ['10% increased maximum Life']),
  node(2, ['+30 to maximum Life', '10% increased maximum Life'], 'notable', 'Discipline and Training'),
  node(3, ['+12% to all Elemental Resistances', '24% increased Elemental Damage'], 'notable', 'Holy Dominion'),
  node(4, ['Enemies you Kill Explode\nfor 10% of their Life']),
  node(5, ['10% reduced Mana Cost of Skills'], 'asc', 'Ascendant'),
  node(6, ['-5% to Chaos Resistance']),
  node(7, ['-5% to Chaos Resistance'])
].map(n => [n.id, n]))

describe('treeTotals', () => {
  const totals = treeTotals(nodes, [1, 2, 3, 4, 5, 6, 7, 999])
  const row = (text: string) => totals.find(t => t.text === text)

  it('adds lines that differ only by their number', () => {
    expect(row('increased maximum Life')).toMatchObject({ amount: '20%', ids: [1, 2] })
    expect(row('maximum Life')).toMatchObject({ amount: '+30' })
  })

  it('keeps negative rolls negative', () => {
    expect(row('Chaos Resistance')).toMatchObject({ amount: '-10%' })
  })

  it('lists lines with no number as they are, and leaves ascendancy out', () => {
    expect(row('Enemies you Kill Explode')?.amount).toBe('')
    expect(totals.some(t => t.text.includes('Mana Cost'))).toBe(false)
  })

  it('groups in a fixed order, largest first', () => {
    const groups = groupTotals(totals)
    expect(groups[0].name).toBe('Attributes and pools')
    expect(groups[0].rows.map(r => r.text)).toEqual(['maximum Life', 'increased maximum Life'])
    expect(groups.find(g => g.name === 'Resistances')?.rows.map(r => r.amount)).toEqual(['+12%', '-10%'])
    expect(groups.find(g => g.name === 'Damage')?.rows[0].text).toBe('increased Elemental Damage')
  })
})

describe('search', () => {
  const totals = treeTotals(nodes, [1, 2, 3])

  it('filters the totals, ignoring case', () => {
    expect(filterTotals(totals, 'LIFE').map(t => t.text)).toEqual(['maximum Life', 'increased maximum Life'])
    expect(filterTotals(totals, '  ')).toHaveLength(totals.length)
  })

  it('finds nodes by name and by text, on the whole tree', () => {
    expect(matchingNodes(nodes.values(), 'dominion')).toEqual([3])
    expect(matchingNodes(nodes.values(), 'life')).toEqual([1, 2, 4])
  })

  it('waits for two letters, and leaves out what is not drawn', () => {
    expect(matchingNodes(nodes.values(), 'l')).toEqual([])
    expect(matchingNodes(nodes.values(), 'mana')).toEqual([])
  })
})
