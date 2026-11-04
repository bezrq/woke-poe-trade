// "Never hide value": the safety net rule and the filter health list.
//
// The safety net is one rule at the top of the saved filter that shows any
// base worth more than your line (poe.ninja) that the filter would otherwise
// hide. Only hidden bases are listed, so items NeverSink already shows keep
// their usual look.
import type { FilterBlock, FilterDoc } from './parse'
import type { StylePatch } from './edits'
import { readStyle } from './edits'
import type { EconomyGroup, PriceLookup } from './economy'
import { ECONOMY_GROUPS } from './economy'
import { evalCondition } from './match'
import type { ItemFacts } from './item-facts'

export const SAFETY_RULE_TYPE = 'woke->safety'

export interface SafetyNet {
  on: boolean
  // Chaos value from which an item always shows.
  minChaos: number
}

export const DEFAULT_SAFETY_NET: SafetyNet = { on: true, minChaos: 20 }

// The look of an item the safety net catches: big, white on dark red, a
// temporary red beam and a red minimap diamond. Distinct from NeverSink's
// tiers so you can tell the net caught it.
export const SAFETY_LOOK: StylePatch = {
  fontSize: 42,
  text: [255, 255, 255, 255],
  border: [255, 255, 255, 255],
  background: [140, 20, 20, 255],
  effect: { color: 'Red', temp: true },
  icon: { size: 1, color: 'Red', shape: 'Diamond' }
}

export type ItemState = 'hidden' | 'small' | 'ok'

export interface BaseVerdict {
  group: EconomyGroup
  base: string
  chaos: number
  thin: boolean
  note?: string
  // The first rule of the group that lists the base.
  block: FilterBlock | null
  state: ItemState
}

const SMALL_FONT = 30

function stateOf (b: FilterBlock | null): ItemState {
  if (!b) return 'ok'
  if (b.visibility === 'Hide') return 'hidden'
  const s = readStyle(b.actions)
  return (s.fontSize ?? 32) < SMALL_FONT && !s.sound ? 'small' : 'ok'
}

// Area level the net and the health list judge by: an end-game map.
const MAP_AREA_LEVEL = 83

// woke: a rule for stacks only (StackSize >= 6) or for the acts (AreaLevel
// <= 67) says nothing about one item dropping in a map. Strict filters show
// stacks of an orb they hide one at a time, and the audit used to take the
// stack rule's word for it, so the net left the single drop hidden.
function catchesSingleMapDrop (b: FilterBlock): boolean {
  const single = { stackSize: 1, areaLevel: MAP_AREA_LEVEL } as ItemFacts
  return b.conditions.every(c => (c.key !== 'StackSize' && c.key !== 'AreaLevel') || evalCondition(c, single) !== false)
}

// Every priced base of the price groups with where the filter puts it.
// `safety` blocks are skipped, so the result says what NeverSink (plus your
// edits) would do without the net.
export function auditBases (doc: FilterDoc, lookup: PriceLookup, minChaos: number, groups = ECONOMY_GROUPS): BaseVerdict[] {
  const out: BaseVerdict[] = []
  for (const group of groups) {
    const seen = new Set<string>()
    for (const b of doc.blocks) {
      if (b.disabled || b.type == null || b.type === SAFETY_RULE_TYPE) continue
      if (b.type !== group.type && !b.type.startsWith(group.type + '->') && !b.type.startsWith('woke->')) continue
      if (!catchesSingleMapDrop(b)) continue
      for (const c of b.conditions) {
        if (c.key !== 'BaseType' || c.op !== '==') continue
        for (const base of c.values) {
          if (seen.has(base)) continue
          // Own and build rules count for every group; only keep them for
          // bases this group prices.
          const price = lookup(group, base)
          if (b.type.startsWith('woke->') && !price) continue
          seen.add(base)
          if (!price || price.chaos < minChaos) continue
          out.push({ group, base, chaos: price.chaos, thin: price.thin, note: price.note, block: b, state: stateOf(b) })
        }
      }
    }
  }
  return out.sort((a, b) => b.chaos - a.chaos)
}

// Items worth at least `minChaos` that the filter hides.
export function safetyBases (doc: FilterDoc, lookup: PriceLookup, minChaos: number): { plain: string[], unique: string[] } {
  const plain = new Set<string>()
  const unique = new Set<string>()
  for (const v of auditBases(doc, lookup, minChaos)) {
    if (v.state !== 'hidden' || v.thin) continue
    ;(v.group.unique ? unique : plain).add(v.base)
  }
  return { plain: [...plain].sort(), unique: [...unique].sort() }
}

function rgba (c: [number, number, number, number]): string[] {
  return c.map(String)
}

function block (tier: string, conditions: FilterBlock['conditions']): FilterBlock {
  const s = SAFETY_LOOK
  return {
    kind: 'block',
    index: -1,
    line: 1,
    visibility: 'Show',
    disabled: false,
    comment: `$type->${SAFETY_RULE_TYPE} $tier->${tier} woke: safety net, worth more than your line on poe.ninja`,
    type: SAFETY_RULE_TYPE,
    tier,
    conditions,
    actions: [
      { key: 'SetFontSize', args: [String(s.fontSize)] },
      { key: 'SetTextColor', args: rgba(s.text!) },
      { key: 'SetBorderColor', args: rgba(s.border!) },
      { key: 'SetBackgroundColor', args: rgba(s.background!) },
      { key: 'PlayEffect', args: [s.effect!.color, 'Temp'] },
      { key: 'MinimapIcon', args: [String(s.icon!.size), s.icon!.color, s.icon!.shape] }
    ],
    continue: false,
    section: 'Safety net',
    subsection: '',
    raw: [],
    dirty: true,
    added: true
  }
}

// The net's rules (0-2): currency-like bases (cards, scarabs... never
// unique), and unique bases with `Rarity Unique` so a valuable unique's base
// doesn't light up every white and rare copy.
export function safetyBlocks (bases: { plain: string[], unique: string[] }): FilterBlock[] {
  const out: FilterBlock[] = []
  if (bases.plain.length) {
    out.push(block('items', [
      { key: 'BaseType', op: '==', count: null, values: bases.plain }
    ]))
  }
  if (bases.unique.length) {
    out.push(block('uniques', [
      { key: 'Rarity', op: '==', count: null, values: ['Unique'] },
      { key: 'BaseType', op: '==', count: null, values: bases.unique }
    ]))
  }
  return out
}
