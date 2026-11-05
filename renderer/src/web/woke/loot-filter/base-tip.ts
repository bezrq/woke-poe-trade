// The item tooltip for a base in the filter editor. A base in a unique tier is
// really the uniques it can drop as, so the tooltip lists those with their
// prices, graded as the Prices tab grades them.
import { ECONOMY_GROUPS } from './economy'
import type { EconomyGroup } from './economy'
import { GRADE_LABEL, gradeItems } from './health'
import type { PricedName } from './health'

type Breakdown = (group: EconomyGroup, base: string) => PricedName[]

export function baseTipRef (breakdown: Breakdown, line: number, type: string, base: string) {
  const group = ECONOMY_GROUPS.find(g => g.type === type)
  if (!group?.unique) return { name: base }
  return {
    name: base,
    uniques: () => gradeItems(breakdown(group, base), line)
      .map(i => ({ ...i, label: GRADE_LABEL[i.grade] }))
  }
}
