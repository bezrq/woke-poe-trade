// Turns the flat block list into the editor's tree:
// section (NeverSink's [[0000]] chapters) → group ($type) → tier ($tier).
import { EDITOR_GROUPS, UNTAGGED_PREFIX } from './parse'
import { groupLabel, sectionLabel } from './names'
import type { FilterBlock, FilterDoc, Visibility } from './parse'
import { OWN_RULE_TYPE } from './edits'
import { BUILD_RULE_TYPE } from './build-rules'
import { SAFETY_RULE_TYPE } from './safety'

// Rule groups the editor adds on top of NeverSink's, by display name.
const OWN_GROUPS: Record<string, string> = {
  [OWN_RULE_TYPE]: EDITOR_GROUPS[OWN_RULE_TYPE],
  [BUILD_RULE_TYPE]: EDITOR_GROUPS[BUILD_RULE_TYPE],
  [SAFETY_RULE_TYPE]: EDITOR_GROUPS[SAFETY_RULE_TYPE]
}

export interface TierNode {
  tier: string
  blocks: FilterBlock[]
  // Base types listed by `BaseType ==` across the tier's blocks.
  bases: string[]
  visibility: Visibility
  // Every block of the tier is commented out.
  disabled: boolean
}

export interface GroupNode {
  type: string
  section: string
  tiers: TierNode[]
  blockCount: number
  hidden: boolean
}

export interface SectionNode {
  title: string
  groups: GroupNode[]
}

export function groupName (type: string | null): string {
  if (!type) return 'Untagged'
  if (type.startsWith(UNTAGGED_PREFIX)) return type.slice(UNTAGGED_PREFIX.length) || 'Untagged'
  if (OWN_GROUPS[type]) return OWN_GROUPS[type]
  return groupLabel(type)
}

export function buildTree (doc: FilterDoc): SectionNode[] {
  const sections: SectionNode[] = []
  const groups = new Map<string, GroupNode>()
  for (const b of doc.blocks) {
    const type = b.type ?? `${UNTAGGED_PREFIX}${b.section}`
    let g = groups.get(type)
    if (!g) {
      const own = b.type != null && OWN_GROUPS[b.type] != null
      const title = own ? OWN_GROUPS[b.type!] : (b.section ? sectionLabel(b.section) : 'Other')
      let sec = sections.find(s => s.title === title)
      if (!sec) {
        sec = { title, groups: [] }
        if (own) sections.unshift(sec)
        else sections.push(sec)
      }
      g = { type, section: title, tiers: [], blockCount: 0, hidden: true }
      groups.set(type, g)
      sec.groups.push(g)
    }
    g.blockCount++
    if (b.visibility !== 'Hide' && !b.disabled) g.hidden = false
    const tierKey = b.tier ?? `#${b.line}`
    let t = g.tiers.find(x => x.tier === tierKey)
    if (!t) {
      t = { tier: tierKey, blocks: [], bases: [], visibility: b.visibility, disabled: true }
      g.tiers.push(t)
    }
    t.blocks.push(b)
    if (!b.disabled) {
      t.disabled = false
      t.visibility = b.visibility
    }
    for (const c of b.conditions) {
      if (c.key === 'BaseType' && c.op === '==') {
        for (const v of c.values) if (!t.bases.includes(v)) t.bases.push(v)
      }
    }
  }
  return sections
}

// Where a base type appears: group + tier, for the editor's search box.
export function findBase (doc: FilterDoc, query: string): Array<{ base: string, type: string, tier: string, block: FilterBlock }> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const out: Array<{ base: string, type: string, tier: string, block: FilterBlock }> = []
  for (const b of doc.blocks) {
    if (b.disabled || !b.type) continue
    for (const c of b.conditions) {
      if (c.key !== 'BaseType') continue
      for (const v of c.values) {
        if (v.toLowerCase().includes(q) && !out.some(o => o.base === v && o.type === b.type && o.tier === b.tier)) {
          out.push({ base: v, type: b.type, tier: b.tier ?? '', block: b })
        }
      }
    }
    if (out.length >= 60) break
  }
  return out
}

export interface AddResult {
  base: string
  // The first live rule that lists it now, for its look and where it is.
  block: FilterBlock | null
  // Listed in another tier of this group, so it moves; otherwise it's added.
  sameGroup: boolean
  // That rule comes before this tier, so it would still catch the item first.
  caughtEarlier: boolean
}

// The add-item box: bases matching the text, best first, without what the tier
// already lists. `extra` is every base in the game, for ones no rule names yet.
export function addSearch (doc: FilterDoc, type: string, tier: string, query: string, extra: string[] = [], limit = 8): AddResult[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const here = doc.blocks.filter(b => b.type === type && b.tier === tier)
  const inTier = new Set(here.flatMap(b => b.conditions.filter(c => c.key === 'BaseType' && c.op === '==').flatMap(c => c.values)))
  const firstHere = Math.min(...here.map(b => b.index))
  const found = new Map<string, FilterBlock | null>()
  const inGroup = new Set<string>()
  for (const b of doc.blocks) {
    if (b.disabled) continue
    for (const c of b.conditions) {
      if (c.key !== 'BaseType' || c.op !== '==') continue
      for (const v of c.values) {
        if (inTier.has(v) || !v.toLowerCase().includes(q)) continue
        if (!found.get(v)) found.set(v, b)
        if (b.type === type) inGroup.add(v)
      }
    }
  }
  for (const v of extra) {
    if (!inTier.has(v) && !found.has(v) && v.toLowerCase().includes(q)) found.set(v, null)
  }
  const score = (name: string) => {
    const n = name.toLowerCase()
    if (n === q) return 0
    if (n.startsWith(q)) return 1
    return n.split(/\s+/).some(w => w.startsWith(q)) ? 2 : 3
  }
  return [...found.entries()]
    .sort(([a, x], [b, y]) => score(a) - score(b) || Number(!x) - Number(!y) || a.localeCompare(b))
    .slice(0, limit)
    .map(([base, block]) => ({
      base,
      block,
      sameGroup: inGroup.has(base),
      caughtEarlier: Boolean(block && !inGroup.has(base) && block.index < firstHere)
    }))
}
