// One-click presets: common changes players make by hand, kept across
// NeverSink updates. Some add rules at the top (cheap currency, chaos recipe,
// 6-sockets); the others adjust NeverSink's own rules after your edits
// (quiet mode, bigger labels, colour-blind beams and icons). Your own rules are
// never touched; the safety net only takes the colour-blind colours.
import type { FilterBlock, FilterDoc } from './parse'
import { ECONOMY_GROUPS } from './economy'
import type { PriceLookup } from './economy'
import { addedBlock } from './rules'

export const PRESET_TYPE = 'woke->preset'

export interface Presets {
  // Hide currency worth less than `chaos` once you're in maps.
  cheapCurrency: { on: boolean, chaos: number }
  // Unidentified ilvl 60-74 rares for the chaos recipe, per slot (a full
  // slot can be switched off).
  chaosRecipe: { on: boolean, slots: string[] }
  // Alert sounds only for the top tiers (t1..tN).
  quiet: { on: boolean, keepTiers: number }
  // Every shown label at least this font size.
  bigger: { on: boolean, size: number }
  // Beams and minimap icons in colours that stay apart for red-green
  // colour blindness.
  colourBlind: { on: boolean }
  // 6-socket items for the vendor (7 jeweller's orbs).
  sixSockets: { on: boolean }
}

export function defaultPresets (): Presets {
  return {
    cheapCurrency: { on: false, chaos: 1 },
    chaosRecipe: { on: false, slots: RECIPE_SLOTS.map(s => s.key) },
    quiet: { on: false, keepTiers: 2 },
    bigger: { on: false, size: 36 },
    colourBlind: { on: false },
    sixSockets: { on: false }
  }
}

export function normalizePresets (p: Partial<Presets> | undefined): Presets {
  const d = defaultPresets()
  const num = (v: unknown, lo: number, hi: number, dflt: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt
  const on = (v: { on?: unknown } | undefined) => typeof v?.on === 'boolean' ? v.on : false
  return {
    cheapCurrency: { on: on(p?.cheapCurrency), chaos: num(p?.cheapCurrency?.chaos, 0.1, 50, d.cheapCurrency.chaos) },
    chaosRecipe: { on: on(p?.chaosRecipe), slots: Array.isArray(p?.chaosRecipe?.slots) ? p!.chaosRecipe!.slots.filter(s => RECIPE_SLOTS.some(r => r.key === s)) : d.chaosRecipe.slots },
    quiet: { on: on(p?.quiet), keepTiers: Math.round(num(p?.quiet?.keepTiers, 1, 5, d.quiet.keepTiers)) },
    bigger: { on: on(p?.bigger), size: Math.round(num(p?.bigger?.size, 25, 45, d.bigger.size)) },
    colourBlind: { on: on(p?.colourBlind) },
    sixSockets: { on: on(p?.sixSockets) }
  }
}

export const RECIPE_SLOTS = [
  { key: 'body', label: 'Body armours', classes: ['Body Armours'], colour: [255, 80, 80] },
  { key: 'helmet', label: 'Helmets', classes: ['Helmets'], colour: [255, 170, 60] },
  { key: 'gloves', label: 'Gloves', classes: ['Gloves'], colour: [240, 230, 80] },
  { key: 'boots', label: 'Boots', classes: ['Boots'], colour: [90, 220, 90] },
  { key: 'belt', label: 'Belts', classes: ['Belts'], colour: [80, 210, 230] },
  { key: 'amulet', label: 'Amulets', classes: ['Amulets'], colour: [110, 140, 255] },
  { key: 'ring', label: 'Rings', classes: ['Rings'], colour: [200, 110, 255] },
  // Small one-handers fit the stash; two of them make the weapon slot.
  { key: 'weapon', label: 'Small weapons', classes: ['Daggers', 'Rune Daggers', 'Wands', 'Sceptres', 'Claws', 'One Hand Maces'], colour: [230, 230, 230] }
] as const

// Below this, you're still in the campaign.
const MAPS_FROM = 68

// Currency bases cheaper than the line, from the filter's own currency rules.
export function cheapCurrencyBases (doc: FilterDoc, lookup: PriceLookup, chaos: number): string[] {
  const group = ECONOMY_GROUPS.find(g => g.type === 'currency')!
  const out = new Set<string>()
  for (const b of doc.blocks) {
    if (b.disabled || b.type !== 'currency') continue
    const list = b.conditions.find(c => c.key === 'BaseType' && c.op === '==')
    for (const base of list?.values ?? []) {
      const p = lookup(group, base)
      if (p && !p.thin && p.chaos < chaos) out.add(base)
    }
  }
  return [...out].sort((a, z) => a.localeCompare(z))
}

function look (b: FilterBlock, rgb: readonly number[], size: number): FilterBlock {
  b.actions = [
    { key: 'SetFontSize', args: [String(size)] },
    { key: 'SetTextColor', args: [...rgb.map(String), '255'] },
    { key: 'SetBorderColor', args: [...rgb.map(String), '255'] },
    { key: 'SetBackgroundColor', args: ['20', '20', '20', '230'] }
  ]
  return b
}

// Rules the presets add at the top, highest first.
export function presetBlocks (doc: FilterDoc, p: Presets, lookup: PriceLookup | null): FilterBlock[] {
  const out: FilterBlock[] = []
  if (p.sixSockets.on) {
    out.push(look(addedBlock(PRESET_TYPE, 'sixsockets', '6-socket items for the vendor', [
      { key: 'Sockets', op: '>=', count: null, values: ['6'] },
      { key: 'Rarity', op: '<=', count: null, values: ['Rare'] }
    ], 'Show', 'Presets'), [200, 200, 200], 38))
  }
  if (p.chaosRecipe.on) {
    for (const slot of RECIPE_SLOTS) {
      if (!p.chaosRecipe.slots.includes(slot.key)) continue
      const conditions = [
        { key: 'Rarity', op: '==', count: null, values: ['Rare'] },
        { key: 'Identified', op: '', count: null, values: ['False'] },
        { key: 'ItemLevel', op: '>=', count: null, values: ['60'] },
        { key: 'ItemLevel', op: '<=', count: null, values: ['74'] },
        { key: 'Class', op: '==', count: null, values: [...slot.classes] }
      ]
      if (slot.key === 'weapon') conditions.push({ key: 'Height', op: '<=', count: null, values: ['3'] })
      out.push(look(addedBlock(PRESET_TYPE, `recipe${slot.key}`, `chaos recipe: ${slot.label.toLowerCase()}`, conditions, 'Show', 'Presets'), slot.colour, 36))
    }
  }
  if (p.cheapCurrency.on && lookup) {
    const bases = cheapCurrencyBases(doc, lookup, p.cheapCurrency.chaos)
    if (bases.length) {
      out.push(addedBlock(PRESET_TYPE, 'cheapcurrency', `currency under ${p.cheapCurrency.chaos}c once in maps`, [
        { key: 'AreaLevel', op: '>=', count: null, values: [String(MAPS_FROM)] },
        { key: 'Class', op: '==', count: null, values: ['Stackable Currency'] },
        { key: 'BaseType', op: '==', count: null, values: bases }
      ], 'Hide', 'Presets'))
    }
  }
  return out
}

// Red-green safe swaps for beam and minimap colours.
const COLOUR_BLIND: Record<string, string> = { Green: 'Blue', Brown: 'Yellow', Red: 'Orange', Pink: 'Purple' }

// Returns true when it changed a colour.
export function colourBlindActions (b: FilterBlock): boolean {
  let touched = false
  b.actions = b.actions.map(a => {
    if ((a.key === 'PlayEffect' && COLOUR_BLIND[a.args[0]]) || (a.key === 'MinimapIcon' && COLOUR_BLIND[a.args[1]])) {
      touched = true
      const args = [...a.args]
      const i = a.key === 'PlayEffect' ? 0 : 1
      args[i] = COLOUR_BLIND[args[i]]
      return { key: a.key, args }
    }
    return a
  })
  return touched
}
const SOUND_KEYS = ['PlayAlertSound', 'PlayAlertSoundPositional', 'CustomAlertSound', 'CustomAlertSoundOptional']

function tierNumber (tier: string | null): number | null {
  const m = /^t(\d+)/.exec(tier ?? '')
  return m ? Number(m[1]) : null
}

// Adjusts NeverSink's rules in place. Returns how many rules changed.
export function applyPresetChanges (doc: FilterDoc, p: Presets): number {
  let changed = 0
  for (const b of doc.blocks) {
    if (b.disabled || b.type?.startsWith('woke->')) continue
    let touched = false
    if (p.quiet.on) {
      const n = tierNumber(b.tier)
      if (n != null && n > p.quiet.keepTiers && b.actions.some(a => SOUND_KEYS.includes(a.key))) {
        b.actions = b.actions.filter(a => !SOUND_KEYS.includes(a.key))
        touched = true
      }
    }
    if (p.bigger.on && b.visibility !== 'Hide') {
      const at = b.actions.findIndex(a => a.key === 'SetFontSize')
      const size = at >= 0 ? Number(b.actions[at].args[0]) : 32
      if (size < p.bigger.size) {
        if (at >= 0) b.actions[at] = { key: 'SetFontSize', args: [String(p.bigger.size)] }
        else b.actions = [{ key: 'SetFontSize', args: [String(p.bigger.size)] }, ...b.actions]
        touched = true
      }
    }
    if (p.colourBlind.on && colourBlindActions(b)) touched = true
    if (touched) { b.dirty = true; changed++ }
  }
  return changed
}

export function presetsOn (p: Presets): boolean {
  return p.cheapCurrency.on || p.chaosRecipe.on || p.quiet.on || p.bigger.on || p.colourBlind.on || p.sixSockets.on
}
