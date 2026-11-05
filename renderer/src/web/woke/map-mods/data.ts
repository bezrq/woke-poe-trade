import { ITEMS_ITERATOR, STATS_ITERATOR } from '@/assets/data'
import { buildMapRegex, buildTrimmedMapRegex } from './regex'
import type { MapRegexResult } from './regex'
import { modPriority } from './rules'
import type { MapModProfile } from './rules'

let areaMods: string[] | null = null
let t17Mods: Set<string> | null = null
let mapNames: string[] | null = null
let heist: string[] | null = null

// The Map mods tabs. Ratings live in one list per profile, keyed by mod text,
// so a mod that rolls in several modes has one rating everywhere.
export type ModMode = 'maps' | 'heist' | 'charts'

// Chart mods (poedb's Deep Water chart table) that the stat data can read. The
// data doesn't tag them: they share lines with maps. Its "adjacent Areas" and
// "all Voyage Areas" lines aren't in the data, so a card can't rate them.
const CHART_MODS = [
  '#% Monster Chaos Resistance',
  '#% Monster Elemental Resistances',
  '#% Monster Physical Damage Reduction',
  '#% increased Monster Attack Speed',
  '#% increased Monster Cast Speed',
  '#% increased Monster Damage',
  '#% increased Monster Movement Speed',
  '#% less effect of Curses on Monsters',
  '#% more Monster Life',
  '#% to Monster Critical Strike Multiplier',
  'Area has patches of Chilled Ground',
  'Area has patches of Shocked Ground which increase Damage taken by #%',
  'Monster Damage Penetrates #% Elemental Resistances',
  'Monsters Blind on Hit',
  'Monsters Hinder on Hit with Spells',
  'Monsters Inflict Withered for 2 seconds on Hit',
  'Monsters Maim on Hit with Attacks',
  'Monsters Poison on Hit',
  "Monsters' Action Speed cannot be modified to below Base Value",
  "Monsters' Movement Speed cannot be modified to below Base Value",
  "Monsters' skills Chain # additional times",
  'Monsters are Hexproof',
  'Monsters cannot be Stunned',
  'Monsters cannot be Taunted',
  'Monsters deal #% extra Physical Damage as Cold',
  'Monsters deal #% extra Physical Damage as Fire',
  'Monsters deal #% extra Physical Damage as Lightning',
  'Monsters fire # additional Projectiles',
  'Monsters gain #% of Maximum Life as Extra Maximum Energy Shield',
  'Monsters gain #% of their Physical Damage as Extra Chaos Damage',
  'Monsters gain #% of their Physical Damage as Extra Damage of a random Element',
  'Monsters gain a Frenzy Charge on Hit',
  'Monsters gain a Power Charge on Hit',
  'Monsters gain an Endurance Charge on Hit',
  'Monsters have #% chance to Avoid Elemental Ailments',
  'Monsters have #% chance to Suppress Spell Damage',
  'Monsters have #% chance to gain a Frenzy Charge on Hit',
  'Monsters have #% chance to gain a Power Charge on Hit',
  'Monsters have #% chance to gain an Endurance Charge on Hit',
  'Monsters have #% increased Area of Effect',
  'Monsters have #% increased Critical Strike Chance',
  'Monsters have a #% chance to avoid Poison, Impale, and Bleeding',
  'Monsters inflict # Grasping Vines on Hit',
  'Monsters steal Power, Frenzy and Endurance charges on Hit',
  'Monsters take #% reduced Extra Damage from Critical Strikes',
  'Players have #% to all maximum Resistances'
]

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

// Mods that only roll on tier 17 (Nightmare) maps.
export function tier17Mods (): Set<string> {
  if (t17Mods) return t17Mods
  t17Mods = new Set()
  for (const stat of STATS_ITERATOR('AreaMods')) {
    if (stat.fromAreaMods !== 'ubermap_exclusive') continue
    for (const m of stat.matchers) t17Mods.add(m.string)
  }
  return t17Mods
}

// Mods that only roll on heist contracts and blueprints, minus any wording a
// map mod also uses.
export function heistMods (): string[] {
  if (heist) return heist
  const maps = new Set(allAreaMods())
  const out = new Set<string>()
  for (const stat of STATS_ITERATOR('AreaMods')) {
    if (stat.fromAreaMods !== 'heist_exclusive') continue
    for (const m of stat.matchers) if (!maps.has(m.string)) out.add(m.string)
  }
  heist = [...out].sort((a, b) => a.localeCompare(b))
  return heist
}

export function chartMods (): string[] {
  const known = new Set(allAreaMods())
  return CHART_MODS.filter(m => known.has(m))
}

// The list one tab shows. On Maps, mods rated under a wording a patch has since
// renamed stay visible, and the T17 switch takes T17 mods out.
export function modsForMode (mode: ModMode, profile: MapModProfile): string[] {
  if (mode === 'heist') return heistMods()
  if (mode === 'charts') return chartMods()
  const hide = new Set(heistMods())
  if (profile.hideT17) tier17Mods().forEach(m => hide.add(m))
  return [...new Set([...allAreaMods(), ...Object.keys(profile.ratings)])].filter(m => !hide.has(m))
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
// Heist mods never roll on maps, and with the T17 switch off T17 picks stay out
// so they don't use up the search's characters. They keep their ratings.
export function profileRegex (profile: MapModProfile): MapRegexResult {
  const avoid: string[] = []
  const want: string[] = []
  const skip = new Set(heistMods())
  if (profile.hideT17) tier17Mods().forEach(m => skip.add(m))
  for (const [m, r] of Object.entries(profile.ratings)) {
    if (skip.has(m)) continue
    if (r === 'deadly') avoid.push(m)
    else if (r === 'good') want.push(m)
  }
  const input = { avoid, want, mins: profile.mins, highlight: profile.highlight, minsAny: profile.minsAny }
  return profile.autoTrim
    ? buildTrimmedMapRegex(input, allAreaMods(), allMapNames(), modPriority)
    : buildMapRegex(input, allAreaMods(), allMapNames())
}
