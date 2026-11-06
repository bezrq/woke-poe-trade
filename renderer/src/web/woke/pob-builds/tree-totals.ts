// What a passive tree adds up to, and finding nodes by what they say. Only the
// tree itself: gear, jewels, ascendancy and masteries aren't in these sums.
import type { TreeNode } from './passive-tree'

export type TotalGroup = 'Attributes and pools' | 'Resistances' | 'Critical strikes' | 'Speed' | 'Damage' | 'Defence' | 'Other'

const GROUP_ORDER: TotalGroup[] = ['Attributes and pools', 'Resistances', 'Critical strikes', 'Speed', 'Damage', 'Defence', 'Other']

const GROUP_RULES: Array<[RegExp, TotalGroup]> = [
  [/Resistances?\b/, 'Resistances'],
  [/Critical/, 'Critical strikes'],
  [/\b(Strength|Dexterity|Intelligence|Attributes)\b|maximum (Life|Mana|Energy Shield)/, 'Attributes and pools'],
  [/Speed\b/, 'Speed'],
  [/Damage|Penetrat/, 'Damage'],
  [/Armour|Evasion|Block|Recovery|Regeneration|Leech|Recoup/, 'Defence']
]

function groupOf (text: string): TotalGroup {
  return GROUP_RULES.find(([re]) => re.test(text))?.[1] ?? 'Other'
}

export interface TreeTotal {
  // "115%", "+300"; empty for a line with no leading number.
  amount: string
  text: string
  group: TotalGroup
  // The nodes it comes from, to light them.
  ids: number[]
}

// A stat line starting with a number, split into the number and the rest.
const LEADING = /^([+-]?)(\d+(?:\.\d+)?)(%?)\s+(.*)$/

export function treeTotals (nodes: Map<number, TreeNode>, ids: number[]): TreeTotal[] {
  const sums = new Map<string, { plus: boolean, percent: boolean, sum: number, rest: string, ids: number[] }>()
  const plain = new Map<string, number[]>()
  for (const id of new Set(ids)) {
    const n = nodes.get(id)
    // Ascendancy has its own points and text; it would swamp the sums' meaning.
    if (!n || n.kind === 'asc') continue
    for (const stat of n.stats) {
      for (const line of stat.split('\n').map(l => l.trim()).filter(Boolean)) {
        const m = LEADING.exec(line)
        if (!m) {
          plain.set(line, [...plain.get(line) ?? [], id])
          continue
        }
        const key = `${m[1] === '+' ? '+' : ''}${m[3]}|${m[4]}`
        const row = sums.get(key) ?? { plus: m[1] === '+', percent: m[3] === '%', sum: 0, rest: m[4], ids: [] }
        row.sum += (m[1] === '-' ? -1 : 1) * Number(m[2])
        row.ids.push(id)
        sums.set(key, row)
      }
    }
  }
  const numbered = [...sums.values()].sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum)).map(r => {
    const value = Math.round(r.sum * 100) / 100
    return {
      amount: `${r.plus && value > 0 ? '+' : ''}${value}${r.percent ? '%' : ''}`,
      text: r.rest.replace(/^to /, ''),
      group: groupOf(r.rest),
      ids: r.ids
    }
  })
  const lines = [...plain.entries()].map(([text, from]) => ({ amount: '', text, group: groupOf(text), ids: from }))
  return [...numbered, ...lines]
}

export interface TotalsGroup { name: TotalGroup, rows: TreeTotal[] }

export function groupTotals (totals: TreeTotal[]): TotalsGroup[] {
  return GROUP_ORDER
    .map(name => ({ name, rows: totals.filter(t => t.group === name) }))
    .filter(g => g.rows.length)
}

export function filterTotals (totals: TreeTotal[], query: string): TreeTotal[] {
  const q = query.trim().toLowerCase()
  if (!q) return totals
  return totals.filter(t => `${t.amount} ${t.text}`.toLowerCase().includes(q))
}

// Every drawn node on the tree whose name or text matches, to light them. A
// query of one letter would light half the tree, so it waits for two.
export function matchingNodes (nodes: Iterable<TreeNode>, query: string): number[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const out: number[] = []
  for (const n of nodes) {
    if (n.kind === 'asc' || n.kind === 'ascstart' || n.kind === 'start') continue
    if (n.name.toLowerCase().includes(q) || n.stats.some(s => s.toLowerCase().includes(q))) out.push(n.id)
  }
  return out
}
