// "Never hide value": the safety net rule and the filter health list.
//
// The safety net is one rule at the top of the saved filter that shows any
// base worth more than your line (poe.ninja) that the filter would otherwise
// hide. Only hidden bases are listed, so items NeverSink already shows keep
// their usual look.
import type { FilterAction, FilterBlock, FilterDoc } from './parse'
import type { StylePatch } from './edits'
import { readStyle } from './edits'
import type { EconomyGroup, PriceLookup } from './economy'
import { ECONOMY_GROUPS } from './economy'
import { matchItem } from './match'
import type { ItemFacts } from './item-facts'
import { BASE_FACTS } from './base-facts'

export const SAFETY_RULE_TYPE = 'woke->safety'

export interface SafetyNet {
  on: boolean
  // Chaos value from which an item always shows.
  minChaos: number
  // The list at the last rebuild with prices, for when there are none.
  last?: NetList
}

export interface NetList {
  plain: string[]
  unique: string[]
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
  // The rule that decides this drop.
  block: FilterBlock | null
  state: ItemState
  // Decided by your own rule, a preset or your build, not by NeverSink.
  mine: boolean
}

const SMALL_FONT = 30

function stateOf (visibility: string, actions: FilterAction[]): ItemState {
  if (visibility === 'Hide') return 'hidden'
  const s = readStyle(actions)
  return (s.fontSize ?? 32) < SMALL_FONT && !s.sound ? 'small' : 'ok'
}

// Area level the net and the health list judge by: an end-game map.
const MAP_AREA_LEVEL = 83

// The drop the net is about: one item, straight off a monster in a map, with
// nothing special about it.
function plainDrop (group: EconomyGroup, base: string, itemClass: string | undefined): ItemFacts {
  const known = BASE_FACTS[base]
  return {
    name: base,
    baseType: base,
    itemClass,
    rarity: group.unique ? 'Unique' : 'Normal',
    itemLevel: MAP_AREA_LEVEL,
    dropLevel: known?.[0],
    width: known?.[1],
    height: known?.[2],
    areaLevel: MAP_AREA_LEVEL,
    quality: 0,
    stackSize: 1,
    memoryStrands: 0,
    socketGroups: [],
    identified: !group.unique,
    corrupted: false,
    mirrored: false,
    fractured: false,
    synthesised: false,
    replica: false,
    foulborn: false,
    vestigial: false,
    transfigured: false,
    imbued: false,
    zanaMemory: false,
    exceptional: false,
    crucibleTree: false,
    blightedMap: false,
    uberBlightedMap: false,
    anyEnchantment: false,
    hasImplicitMod: false,
    exarchTier: 0,
    eaterTier: 0,
    corruptedMods: 0,
    enchantmentPassiveNum: 0,
    enchantPassiveNodes: [],
    enchantments: [],
    influences: [],
    explicitModNames: []
  }
}

// woke: what the game really does with that drop, walking the rules in order.
// Taking the first rule that listed a base read every Replica and Foulborn rule
// as "this base shows", and the net left the plain unique hidden. A hide the
// walk can't rule out counts as hidden: a false alarm costs one click.
function verdictOf (doc: FilterDoc, drop: ItemFacts): { block: FilterBlock | null, state: ItemState, mine: boolean } {
  const m = matchItem(doc, drop)
  // The copy of a rule that names this very base is what matters: a class-wide
  // rule we can't judge without the item's class says nothing about it.
  const names = (b: FilterBlock) => b.conditions.some(c => c.key === 'BaseType' && c.values.includes(drop.baseType!))
  const unsure = m.visibility !== 'Hide' ? m.uncertain.find(u => u.block.visibility === 'Hide' && names(u.block)) : undefined
  const block = unsure?.block ?? m.final?.block ?? null
  return {
    block,
    state: unsure ? 'hidden' : stateOf(m.visibility, m.actions),
    // Your own rules, presets and build rules: you chose this.
    mine: Boolean(block?.type?.startsWith('woke->'))
  }
}

// Every priced base of the price groups with what the filter does to it.
// `safety` blocks are skipped, so the result says what NeverSink (plus your
// edits) would do without the net.
export function auditBases (doc: FilterDoc, lookup: PriceLookup, minChaos: number, groups = ECONOMY_GROUPS): BaseVerdict[] {
  const out: BaseVerdict[] = []
  const walked: FilterDoc = doc.blocks.some(b => b.type === SAFETY_RULE_TYPE)
    ? { ...doc, blocks: doc.blocks.filter(b => b.type !== SAFETY_RULE_TYPE) }
    : doc
  for (const group of groups) {
    // A base and the Class of a rule that lists it. A tier this level has
    // commented out still names the base, which then falls to a later rule.
    const bases = new Map<string, string | undefined>()
    for (const b of walked.blocks) {
      if (b.type == null) continue
      if (b.type !== group.type && !b.type.startsWith(group.type + '->') && !b.type.startsWith('woke->')) continue
      const itemClass = b.conditions.find(c => c.key === 'Class')?.values[0]
      for (const c of b.conditions) {
        if (c.key !== 'BaseType' || c.op !== '==') continue
        // Own and build rules count for every group; only keep them for bases
        // this group prices.
        for (const base of c.values) {
          if (b.type.startsWith('woke->') && !lookup(group, base)) continue
          if (!bases.has(base) || (bases.get(base) == null && itemClass)) bases.set(base, itemClass)
        }
      }
    }
    for (const [base, itemClass] of bases) {
      const price = lookup(group, base)
      if (!price || price.chaos < minChaos) continue
      out.push({ group, base, chaos: price.chaos, thin: price.thin, note: price.note, ...verdictOf(walked, plainDrop(group, base, itemClass)) })
    }
  }
  return out.sort((a, b) => b.chaos - a.chaos)
}

// Items worth at least `minChaos` that the filter hides. A thin market counts:
// showing a junk price costs a click, and hiding a rare one costs the item.
// What you hid yourself, or said isn't for you, stays hidden.
export function safetyBases (doc: FilterDoc, lookup: PriceLookup, minChaos: number, skip?: (v: BaseVerdict) => boolean): NetList {
  const plain = new Set<string>()
  const unique = new Set<string>()
  for (const v of auditBases(doc, lookup, minChaos)) {
    if (v.state !== 'hidden' || v.mine || skip?.(v)) continue
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

// The last list, for a filter with no prices to judge by: only names this
// filter still lists, since the game refuses a base it doesn't know.
export function lastNetList (doc: FilterDoc, last: NetList | undefined): NetList {
  if (!last) return { plain: [], unique: [] }
  const known = new Set<string>()
  for (const b of doc.blocks) {
    for (const c of b.conditions) if (c.key === 'BaseType') for (const v of c.values) known.add(v)
  }
  return { plain: last.plain.filter(b => known.has(b)), unique: last.unique.filter(b => known.has(b)) }
}

// The net's rules (0-2): currency-like bases (cards, scarabs... never
// unique), and unique bases with `Rarity Unique` so a valuable unique's base
// doesn't light up every white and rare copy.
export function safetyBlocks (bases: NetList): FilterBlock[] {
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
