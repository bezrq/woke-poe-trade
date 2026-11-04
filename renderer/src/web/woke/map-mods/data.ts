import { ITEMS_ITERATOR, STATS_ITERATOR } from '@/assets/data'
import { buildMapRegex, buildTrimmedMapRegex } from './regex'
import type { MapRegexResult } from './regex'
import { modPriority } from './rules'
import type { MapModProfile } from './rules'

let areaMods: string[] | null = null
let t17Mods: Set<string> | null = null
let mapNames: string[] | null = null

// Every map mod line (all wordings), from APT's stat data.
export function allAreaMods (): string[] {
  if (areaMods) return areaMods
  const out = new Set<string>()
  for (const stat of STATS_ITERATOR('AreaMods')) {
    if (!stat.fromAreaMods || stat.fromAreaMods === 'heist_exclusive') continue
    for (const m of stat.matchers) out.add(m.string)
  }
  areaMods = [...out].sort((a, b) => a.localeCompare(b))
  return areaMods
}

// Mods that only roll on tier 17 maps.
export function tier17Mods (): Set<string> {
  if (t17Mods) return t17Mods
  t17Mods = new Set()
  for (const stat of STATS_ITERATOR('AreaMods')) {
    if (stat.fromAreaMods !== 'ubermap_exclusive') continue
    for (const m of stat.matchers) t17Mods.add(m.string)
  }
  return t17Mods
}

// Map names ("Strand Map"), so mod tokens don't also match a map's name.
export function allMapNames (): string[] {
  if (mapNames) return mapNames
  const out: string[] = []
  for (const area of ITEMS_ITERATOR('"namespace":"AREA"')) {
    out.push(`${area.name} Map`)
  }
  mapNames = out
  return mapNames
}

// Profile -> stash regex: "can't run" mods are avoided, "juice" mods wanted.
export function profileRegex (profile: MapModProfile): MapRegexResult {
  const avoid: string[] = []
  const want: string[] = []
  for (const [m, r] of Object.entries(profile.ratings)) {
    if (r === 'deadly') avoid.push(m)
    else if (r === 'good') want.push(m)
  }
  const input = { avoid, want, mins: profile.mins, highlight: profile.highlight, minsAny: profile.minsAny }
  return profile.autoTrim
    ? buildTrimmedMapRegex(input, allAreaMods(), allMapNames(), modPriority)
    : buildMapRegex(input, allAreaMods(), allMapNames())
}
