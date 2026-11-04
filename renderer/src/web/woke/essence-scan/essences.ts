// Essence scan: essence names and turning OCR'd monolith label lines into
// essences. OCR is noisy, so lines are matched to real names by similarity.
import { similarity } from '../map-mods/tooltip-parse'

export const ESSENCE_TIERS = ['Whispering', 'Muttering', 'Weeping', 'Wailing', 'Screaming', 'Shrieking', 'Deafening'] as const

export const ESSENCE_TYPES = [
  'Greed', 'Contempt', 'Hatred', 'Woe', 'Fear', 'Anger', 'Torment', 'Sorrow',
  'Rage', 'Suffering', 'Wrath', 'Doubt', 'Loathing', 'Zeal', 'Anguish', 'Spite',
  'Scorn', 'Envy', 'Misery', 'Dread'
] as const

// Only come from corrupting a monolith, and have no tier.
export const CORRUPTION_ONLY = ['Insanity', 'Horror', 'Delirium', 'Hysteria'] as const

// The usual "always corrupt" set.
export const MEDS = ['Misery', 'Envy', 'Dread', 'Scorn']

export interface Essence {
  // Full item name, as poe.ninja lists it.
  name: string
  type: string
  tier: string | null
}

export const ALL_ESSENCES: Essence[] = [
  ...ESSENCE_TYPES.flatMap(type => ESSENCE_TIERS.map(tier => ({ name: `${tier} Essence of ${type}`, type, tier }))),
  ...CORRUPTION_ONLY.map(type => ({ name: `Essence of ${type}`, type, tier: null }))
]

export interface ScannedMonolith {
  essences: Essence[]
  // The label says the monolith is corrupted, or it holds an essence that
  // only corrupting gives.
  corrupted: boolean
}

function simplify (s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
}

const SIMPLE = ALL_ESSENCES.map(e => ({ e, s: simplify(e.name) }))
const MIN_SIMILARITY = 0.78

// Best essence match for one OCR line, or null.
export function matchEssence (line: string): Essence | null {
  const s = simplify(line)
  // Cheap filter: an essence line has "ess..." or "...ence of" somewhere.
  if (!/ess|ence|of [a-z]/.test(s)) return null
  let best: Essence | null = null
  let bestScore = 0
  for (const cand of SIMPLE) {
    // Compare against a window of the line as long as the name, since OCR
    // may glue stray characters before or after it.
    const score = windowSimilarity(s, cand.s)
    if (score > bestScore) { bestScore = score; best = cand.e }
  }
  return bestScore >= MIN_SIMILARITY ? best : null
}

function windowSimilarity (line: string, name: string): number {
  if (line.length <= name.length + 2) return similarity(line, name)
  let best = 0
  for (let i = 0; i + name.length <= line.length + 2; i += 2) {
    best = Math.max(best, similarity(line.slice(i, i + name.length), name))
  }
  return best
}

export function parseMonolith (lines: string[]): ScannedMonolith | null {
  const essences: Essence[] = []
  let corruptedWord = false
  for (const line of lines) {
    if (/corrupt/i.test(line)) corruptedWord = true
    const e = matchEssence(line)
    if (e) essences.push(e)
  }
  if (!essences.length) return null
  const corrupted = corruptedWord || essences.some(e => e.tier === null)
  return { essences, corrupted }
}

export function nextTierName (e: Essence): string | null {
  if (!e.tier) return null
  const i = ESSENCE_TIERS.indexOf(e.tier as typeof ESSENCE_TIERS[number])
  if (i < 0 || i === ESSENCE_TIERS.length - 1) return null
  return `${ESSENCE_TIERS[i + 1]} Essence of ${e.type}`
}

export type EssenceVerdict = 'corrupt' | 'open' | 'done'

export interface PricedMonolith {
  verdict: EssenceVerdict
  // Flagged essence types found, e.g. ['Misery'].
  flagged: string[]
  rows: Array<{ essence: Essence, chaos: number | null, flagged: boolean, nextName: string | null, nextChaos: number | null }>
  totalChaos: number
}

// Corrupt when any flagged type is present and the monolith isn't corrupted
// yet. `price` looks up an essence's chaos price by full name.
export function rateMonolith (m: ScannedMonolith, flagTypes: string[], price: (name: string) => number | null): PricedMonolith {
  const flagSet = new Set(flagTypes.map(t => t.toLowerCase()))
  const rows = m.essences.map(essence => {
    const nextName = nextTierName(essence)
    const flagged = flagSet.has(essence.type.toLowerCase())
    return {
      essence,
      chaos: price(essence.name),
      flagged,
      nextName,
      nextChaos: flagged && nextName ? price(nextName) : null
    }
  })
  const flagged = [...new Set(rows.filter(r => r.flagged).map(r => r.essence.type))]
  const totalChaos = rows.reduce((sum, r) => sum + (r.chaos ?? 0), 0)
  const verdict: EssenceVerdict = m.corrupted ? 'done' : flagged.length ? 'corrupt' : 'open'
  return { verdict, flagged, rows, totalChaos }
}

export function shortEssenceName (e: Essence): string {
  return e.tier ? `${e.tier.slice(0, 3)}. ${e.type}` : e.type
}
