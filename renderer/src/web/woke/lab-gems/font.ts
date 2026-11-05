// Divine Font (Labyrinth) maths. The colour-roll expected value follows
// GemCheck's processGems (MIT, https://github.com/Lebedevsd/GemCheck); the
// net-profit and random-variant figures are ours.
import { TRANSFIGURED_GEMS } from './gem-colors'
import { isThin } from '../market/types'
import type { PriceItem } from '../market/types'

export type GemColor = 'r' | 'g' | 'b'

export const GEM_COLORS: GemColor[] = ['r', 'g', 'b']

// The font offers this many gems of the chosen colour; you take one.
export const FONT_DRAWS = 3

// poe.ninja gem variants we let the user compare (level/quality, uncorrupted).
export const GEM_STATES = ['1', '1/20', '20', '20/20'] as const
export type GemState = typeof GEM_STATES[number]

export interface FontGem {
  name: string
  chaos: number | null
}

export interface ColorRoll {
  color: GemColor
  poolSize: number
  listed: number
  // Expected value of the best of FONT_DRAWS random gems from the pool.
  ev: number
  // Chance that one given gem is among the offered ones.
  chanceEach: number
  top: FontGem[]
}

export interface SpecificPick {
  baseName: string
  color: GemColor
  baseChaos: number | null
  variants: FontGem[]
  // Value if you can choose the variant.
  best: number
  // Value if the variant is random (equal chance each).
  average: number
}

export function baseGemName (transfigured: string): string {
  const i = transfigured.lastIndexOf(' of ')
  return i === -1 ? transfigured : transfigured.slice(0, i)
}

// Cheapest uncorrupted price per gem name for one level/quality state.
export function gemPrices (items: PriceItem[], state: GemState): Map<string, number> {
  const out = new Map<string, number>()
  for (const item of items) {
    if (item.type !== 'SkillGem' || item.variant !== state) continue
    const prev = out.get(item.name)
    if (prev == null || item.chaos < prev) out.set(item.name, item.chaos)
  }
  return out
}

// Gem names whose price (the cheapest listing used above) comes from a thin
// market on poe.ninja. Shown with a warning icon, and dropped only when the
// user asks (see withoutThinGems).
export function thinGems (items: PriceItem[], state: GemState): Set<string> {
  const cheapest = new Map<string, PriceItem>()
  for (const item of items) {
    if (item.type !== 'SkillGem' || item.variant !== state) continue
    const prev = cheapest.get(item.name)
    if (!prev || item.chaos < prev.chaos) cheapest.set(item.name, item)
  }
  const out = new Set<string>()
  for (const [name, item] of cheapest) if (isThin(item)) out.add(name)
  return out
}

// Prices without the thin transfigured gems, which then count as unpriced: the
// font can still offer one, so they stay in the pool at 0. Base gems stay, since
// an unknown base price counts as free in pickProfit and would inflate profit.
export function withoutThinGems (prices: Map<string, number>, thin: Set<string>): Map<string, number> {
  const out = new Map(prices)
  for (const color of GEM_COLORS) {
    for (const name of TRANSFIGURED_GEMS[color]) if (thin.has(name)) out.delete(name)
  }
  return out
}

// How many priced gems of a colour's pool come from a thin market.
export function thinInPool (prices: Map<string, number>, thin: Set<string>, color: GemColor): number {
  return TRANSFIGURED_GEMS[color].filter(name => prices.has(name) && thin.has(name)).length
}

// Colour-roll EV for every gem state, to see which level/quality to bring.
export function evByState (items: PriceItem[], skipThin = false): Array<{ state: GemState, ev: Record<GemColor, number> }> {
  return GEM_STATES.map(state => {
    const prices = gemPrices(items, state)
    const rolls = colorRolls(skipThin ? withoutThinGems(prices, thinGems(items, state)) : prices, 1)
    const ev = { r: 0, g: 0, b: 0 } as Record<GemColor, number>
    for (const roll of rolls) ev[roll.color] = roll.ev
    return { state, ev }
  })
}

export function colorRolls (prices: Map<string, number>, topN: number): ColorRoll[] {
  return GEM_COLORS.map(color => {
    const pool: FontGem[] = TRANSFIGURED_GEMS[color].map(name => ({ name, chaos: prices.get(name) ?? null }))
    const n = pool.length
    const sorted = [...pool].sort((a, b) => (b.chaos ?? 0) - (a.chaos ?? 0))
    // Gem at sorted index i is the best of k draws with probability
    // ((n - i) / n)^k - ((n - i - 1) / n)^k. Unlisted gems count as 0.
    let ev = 0
    sorted.forEach((g, i) => {
      const p = Math.pow((n - i) / n, FONT_DRAWS) - Math.pow((n - i - 1) / n, FONT_DRAWS)
      ev += (g.chaos ?? 0) * p
    })
    return {
      color,
      poolSize: n,
      listed: pool.filter(g => g.chaos != null).length,
      ev,
      chanceEach: n ? 1 - Math.pow((n - 1) / n, FONT_DRAWS) : 0,
      top: sorted.filter(g => g.chaos != null).slice(0, topN)
    }
  })
}

export function specificPicks (prices: Map<string, number>): SpecificPick[] {
  const picks: SpecificPick[] = []
  for (const color of GEM_COLORS) {
    const byBase = new Map<string, FontGem[]>()
    for (const name of TRANSFIGURED_GEMS[color]) {
      const base = baseGemName(name)
      const list = byBase.get(base) ?? []
      list.push({ name, chaos: prices.get(name) ?? null })
      byBase.set(base, list)
    }
    for (const [baseName, variants] of byBase) {
      const values = variants.map(v => v.chaos ?? 0)
      picks.push({
        baseName,
        color,
        baseChaos: prices.get(baseName) ?? null,
        variants: [...variants].sort((a, b) => (b.chaos ?? 0) - (a.chaos ?? 0)),
        best: Math.max(...values),
        average: values.reduce((s, v) => s + v, 0) / values.length
      })
    }
  }
  return picks
}

export type SpecificMode = 'choose' | 'random'

export function pickValue (pick: SpecificPick, mode: SpecificMode): number {
  return mode === 'choose' ? pick.best : pick.average
}

// Profit after paying for the base gem (unknown base price counts as free).
export function pickProfit (pick: SpecificPick, mode: SpecificMode): number {
  return pickValue(pick, mode) - (pick.baseChaos ?? 0)
}
