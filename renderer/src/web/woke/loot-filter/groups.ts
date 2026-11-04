// Turns the flat block list into the editor's tree:
// section (NeverSink's [[0000]] chapters) → group ($type) → tier ($tier).
import type { FilterBlock, FilterDoc, Visibility } from './parse'
import { OWN_RULE_TYPE } from './edits'
import { BUILD_RULE_TYPE } from './build-rules'
import { SAFETY_RULE_TYPE } from './safety'

// Rule groups the editor adds on top of NeverSink's, by display name.
const OWN_GROUPS: Record<string, string> = {
  [OWN_RULE_TYPE]: 'Your own rules',
  [BUILD_RULE_TYPE]: 'Your build',
  [SAFETY_RULE_TYPE]: 'Safety net'
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
  if (OWN_GROUPS[type]) return OWN_GROUPS[type]
  return type.split('->').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' › ')
}

export function buildTree (doc: FilterDoc): SectionNode[] {
  const sections: SectionNode[] = []
  const groups = new Map<string, GroupNode>()
  for (const b of doc.blocks) {
    const type = b.type ?? `untagged:${b.section}`
    let g = groups.get(type)
    if (!g) {
      const own = b.type != null && OWN_GROUPS[b.type] != null
      const title = own ? OWN_GROUPS[b.type!] : (b.section || 'Other')
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
