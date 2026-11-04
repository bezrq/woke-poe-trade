// Gem shopping list for a build while levelling: when each gem can be used
// and where to get it in the campaign, for the character's class.
// Data: gem-sources.json, generated from exile-leveling (MIT, see
// LICENSE-exile-leveling.txt): { name: { l: required level, s: sources } },
// source = [act, quest, npc, 'q' (quest reward) | 'v' (vendor), class mask].
import raw from './gem-sources.json'
import type { PobDetails } from './widget'

type Source = [number, string, string, string, string]
const DATA = raw as unknown as Record<string, { l: number, s: Source[] }>
const CLASSES = ['Duelist', 'Marauder', 'Ranger', 'Scion', 'Shadow', 'Templar', 'Witch']

// Ascendancies map to their base class.
const ASCENDANCY_CLASS: Record<string, string> = {
  Slayer: 'Duelist',
  Gladiator: 'Duelist',
  Champion: 'Duelist',
  Juggernaut: 'Marauder',
  Berserker: 'Marauder',
  Chieftain: 'Marauder',
  Deadeye: 'Ranger',
  Raider: 'Ranger',
  Pathfinder: 'Ranger',
  Warden: 'Ranger',
  Ascendant: 'Scion',
  Reliquarian: 'Scion',
  Assassin: 'Shadow',
  Saboteur: 'Shadow',
  Trickster: 'Shadow',
  Inquisitor: 'Templar',
  Hierophant: 'Templar',
  Guardian: 'Templar',
  Necromancer: 'Witch',
  Occultist: 'Witch',
  Elementalist: 'Witch'
}

export function baseClass (name: string): string {
  return CLASSES.includes(name) ? name : ASCENDANCY_CLASS[name] ?? ''
}

export interface NextGem {
  name: string
  requiredLevel: number
  // Cheapest way to get it: quest reward first, then the first vendor.
  source: string | null
  // Usable now (required level reached), soon (within 6 levels) or later.
  when: 'now' | 'soon' | 'later'
}

function sourceFor (name: string, cls: string): string | null {
  const entry = DATA[name] ?? DATA[`${name} Support`]
  if (!entry) return null
  const idx = CLASSES.indexOf(cls)
  const fits = entry.s.filter(s => idx < 0 || s[4][idx] === '1')
  const pick = fits.find(s => s[3] === 'q') ?? fits.sort((a, b) => a[0] - b[0])[0]
  if (!pick) return null
  return `${pick[3] === 'q' ? 'Reward' : 'Buy from ' + pick[2]}: ${pick[1]} (Act ${pick[0]})`
}

export function requiredLevel (name: string): number | null {
  return (DATA[name] ?? DATA[`${name} Support`])?.l ?? null
}

// Every enabled gem in the build, ordered by when you can use it.
export function nextGems (details: PobDetails, charLevel: number | null, className: string): NextGem[] {
  const cls = baseClass(className || details.className)
  const level = charLevel ?? 1
  const seen = new Set<string>()
  const out: NextGem[] = []
  for (const group of details.skills) {
    if (!group.enabled) continue
    for (const gem of group.gems) {
      if (!gem.enabled || seen.has(gem.name)) continue
      seen.add(gem.name)
      const req = requiredLevel(gem.name)
      if (req == null) continue
      out.push({
        name: gem.name,
        requiredLevel: req,
        source: sourceFor(gem.name, cls),
        when: req <= level ? 'now' : req <= level + 6 ? 'soon' : 'later'
      })
    }
  }
  return out.sort((a, b) => a.requiredLevel - b.requiredLevel || a.name.localeCompare(b.name))
}
