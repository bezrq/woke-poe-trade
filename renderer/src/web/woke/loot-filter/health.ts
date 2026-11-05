// What the "valuable items your filter hides" list tells you before you press
// Show it: every item you would also get on that base, how much each is worth,
// and which rule changes.
import type { BaseVerdict } from './safety'
import { DEFAULT_FONT } from './edits'

export type PriceGrade = 'high' | 'mid' | 'trash' | 'unknown'

// Under this it isn't worth picking up, whatever your safety net line is.
export const TRASH_BELOW = 5

export function priceGrade (chaos: number | null, line: number): PriceGrade {
  if (chaos == null) return 'unknown'
  if (chaos >= line) return 'high'
  return chaos < TRASH_BELOW ? 'trash' : 'mid'
}

export interface PricedName { name: string, chaos: number | null, thin: boolean }

export interface HealthItem extends PricedName {
  grade: PriceGrade
}

// Most valuable first, with no price last.
export function gradeItems (list: PricedName[], line: number): HealthItem[] {
  return list
    .map(i => ({ ...i, grade: priceGrade(i.chaos, line) }))
    .sort((a, b) => (b.chaos ?? -1) - (a.chaos ?? -1))
}

export function trashCount (items: HealthItem[]): number {
  return items.filter(i => i.grade === 'trash').length
}

// The bar's length: a log scale, so 1c and 1000c both stay readable.
export function priceBar (chaos: number | null, most: number): number {
  if (chaos == null || chaos <= 0 || most <= 0) return 0
  return Math.max(4, Math.min(100, Math.round(Math.log(chaos + 1) / Math.log(most + 1) * 100)))
}

// In words, what Show it does to the file (see showIt in PricesTab.vue: an own
// rule pinned above everything, keeping only the source rule's Class and Rarity).
export function showEffect (v: BaseVerdict, items: HealthItem[]): string[] {
  const cond = v.block?.conditions.find(c => c.key === 'Rarity')
  const exact = cond && ['', '=', '=='].includes(cond.op)
  const rarity = exact ? cond.values.join(' or ') : undefined
  // A rarity range like `<= Rare` is kept as it is, so say it as written.
  const who = rarity
    ? `every ${rarity.toLowerCase()} ${v.base}`
    : cond ? `every ${v.base} of rarity ${cond.op} ${cond.values.join(' ')}` : v.base
  const out = [v.state === 'hidden'
    ? `Adds one rule of yours above everything: ${who} shows, white on red with a short red beam and an alert sound.`
    : `Adds one rule of yours above everything: ${who} shows at font size 40 (${DEFAULT_FONT} is the game's default).`]
  if (rarity === 'Unique') {
    out.push(`Normal, magic and rare ${v.base} stay as they are.`)
    const others = items.length - 1
    if (others > 0) out.push(`${others === 1 ? 'The other unique' : `The other ${others} uniques`} on this base show${others === 1 ? 's' : ''} too: the filter only knows the base.`)
  }
  out.push('You can undo it under Changes.')
  return out
}

export function healthKey (v: Pick<BaseVerdict, 'group' | 'base'>): string {
  return `${v.group.type}|${v.base}`
}

// "Not for me" holds until the price doubles from what it was then.
export function isDismissed (dismissed: Record<string, number>, v: Pick<BaseVerdict, 'group' | 'base' | 'chaos'>): boolean {
  const at = dismissed[healthKey(v)]
  return at != null && v.chaos < at * 2
}
