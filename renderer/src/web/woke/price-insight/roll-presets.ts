import type { StatFilter, FilterOrGroup } from '@/web/price-check/filters/interfaces'

// Low / Approx / High shortcuts for the price check, for all mods or just one.
// Only ticked mods with a variable roll are touched.

export type RollPreset = 'low' | 'current' | 'high'

// Share of the tier range kept on each side of the item's roll by "Approx".
const CURRENT_WINDOW = 0.1
// Share of the tier range "High" searches, from the best end.
const HIGH_SHARE = 0.25

// Map and heist properties have no tiers: their bounds run up to a
// MAX_SAFE_INTEGER placeholder, which must never reach the trade site.
const OPEN_BOUND = Number.MAX_SAFE_INTEGER / 2

// Map and heist stats use MAX_SAFE_INTEGER for "no upper bound"; the trade
// site rejects it, so an open bound becomes an empty box.
export function isOpenBound (n: number): boolean {
  return Math.abs(n) >= OPEN_BOUND
}

type Roll = NonNullable<StatFilter['roll']>

function rollable (filters: FilterOrGroup[]): StatFilter[] {
  const out: StatFilter[] = []
  for (const f of filters) {
    if (f.group === 'not') continue
    const list = f.group ? f.stats : [f]
    for (const s of list) {
      if (!s.disabled && s.roll && s.roll.bounds && s.roll.better) out.push(s)
    }
  }
  return out
}

function round (value: number, dp: boolean, method: (n: number) => number) {
  const k = dp ? 100 : 1
  // strip float noise (0.6 + 0.04 = 0.64000000001) before floor/ceil
  return method(Math.round(value * k * 1e6) / 1e6) / k
}

function presetRange (roll: Roll, preset: RollPreset): { min: number | undefined, max: number | undefined } {
  const bounds = roll.bounds!
  if (preset === 'low') {
    // Worst roll of the tier and up: positive mods keep only a min, "lower is better" mods only a max.
    return roll.better === 1
      ? { min: isOpenBound(bounds.min) ? undefined : bounds.min, max: undefined }
      : { min: undefined, max: isOpenBound(bounds.max) ? undefined : bounds.max }
  }
  if (isOpenBound(bounds.min) || isOpenBound(bounds.max)) {
    // No tier to take a window of: this roll or better.
    return roll.better === 1
      ? { min: roll.value, max: undefined }
      : { min: undefined, max: roll.value }
  }
  if (preset === 'high') {
    const span = (bounds.max - bounds.min) * HIGH_SHARE
    return roll.better === 1
      ? { min: Math.min(bounds.max, round(bounds.max - span, roll.dp, Math.ceil)), max: undefined }
      : { min: undefined, max: Math.max(bounds.min, round(bounds.min + span, roll.dp, Math.floor)) }
  }
  const step = roll.dp ? 0.01 : 1
  const delta = Math.max((bounds.max - bounds.min) * CURRENT_WINDOW, step)
  return {
    min: Math.max(bounds.min, round(roll.value - delta, roll.dp, Math.floor)),
    max: Math.min(bounds.max, round(roll.value + delta, roll.dp, Math.ceil))
  }
}

/** True when this one mod can take a preset: a variable roll with a known better direction. */
export function canPickRoll (filter: StatFilter): boolean {
  const bounds = filter.roll?.bounds
  return Boolean(bounds && filter.roll!.better && !isOpenBound(bounds.min) && !isOpenBound(bounds.max))
}

export function applyRollToFilter (filter: StatFilter, preset: RollPreset) {
  const r = presetRange(filter.roll!, preset)
  filter.roll!.min = r.min
  filter.roll!.max = r.max
  filter.disabled = false
}

function rollMatches (roll: Roll, preset: RollPreset): boolean {
  const r = presetRange(roll, preset)
  const min = (typeof roll.min === 'number') ? roll.min : undefined
  const max = (typeof roll.max === 'number') ? roll.max : undefined
  return min === r.min && max === r.max
}

const PRESETS = ['low', 'current', 'high'] as const

/** Which preset this one mod's min and max match, if any. */
export function activeRollOf (filter: StatFilter): RollPreset | '' {
  if (filter.disabled || !canPickRoll(filter)) return ''
  return PRESETS.find(p => rollMatches(filter.roll!, p)) ?? ''
}

export function canUseRollPresets (filters: FilterOrGroup[]): boolean {
  return rollable(filters).length > 0
}

export function applyRollPreset (filters: FilterOrGroup[], preset: RollPreset) {
  for (const s of rollable(filters)) {
    const r = presetRange(s.roll!, preset)
    s.roll!.min = r.min
    s.roll!.max = r.max
  }
}

// Which preset the current min/max match, if any (so editing a box clears the highlight).
export function activeRollPreset (filters: FilterOrGroup[]): RollPreset | '' {
  const list = rollable(filters)
  if (!list.length) return ''
  return PRESETS.find(p => list.every(s => rollMatches(s.roll!, p))) ?? ''
}
