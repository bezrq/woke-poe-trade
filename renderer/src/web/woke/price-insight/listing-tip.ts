// A trade listing's item, in the shape the shared game tooltip draws. The trade
// site already sends all of this with each listing, so showing it costs no
// extra requests. Pure functions.

import type { PobItem, PobRarity } from '../pob-builds/widget'

export interface ListingItem {
  name?: string
  typeLine?: string
  baseType?: string
  frameType?: number
  ilvl?: number
  corrupted?: boolean
  mirrored?: boolean
  influences?: Record<string, boolean>
  implicitMods?: string[]
  enchantMods?: string[]
  fracturedMods?: string[]
  explicitMods?: string[]
  craftedMods?: string[]
  sockets?: Array<{ group: number, sColour: string }>
  properties?: Array<{ name?: string, type?: number, values: Array<[string, number]> }>
}

const RARITY: Record<number, PobRarity> = { 0: 'NORMAL', 1: 'MAGIC', 2: 'RARE', 3: 'UNIQUE', 9: 'RELIC' }

function socketsText (sockets: ListingItem['sockets']): string {
  const groups = new Map<number, string[]>()
  for (const s of sockets ?? []) {
    groups.set(s.group, [...(groups.get(s.group) ?? []), s.sColour])
  }
  return Array.from(groups.values(), g => g.join('-')).join(' ')
}

function propNumber (item: ListingItem, name: string): number | undefined {
  const raw = item.properties?.find(p => p.name === name)?.values[0]?.[0]
  if (raw == null) return undefined
  const n = Number(raw.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function capitalize (s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Null for what has no mods to show: gems, currency and the like. */
export function listingTipItem (item: ListingItem): PobItem | null {
  const rarity = RARITY[item.frameType ?? -1]
  if (!rarity) return null

  const fractured = item.fracturedMods ?? []
  const explicit = item.explicitMods ?? []
  const crafted = item.craftedMods ?? []
  const implicits = [...(item.enchantMods ?? []), ...(item.implicitMods ?? [])]
  const mods = [...fractured, ...explicit, ...crafted]
  if (!mods.length && !implicits.length) return null

  return {
    rarity,
    name: item.name ?? '',
    base: item.typeLine ?? item.baseType ?? '',
    sockets: socketsText(item.sockets),
    implicits,
    mods,
    modKinds: [
      ...fractured.map(() => 'fractured' as const),
      ...explicit.map(() => '' as const),
      ...crafted.map(() => 'crafted' as const)
    ],
    quality: propNumber(item, 'Quality'),
    armour: propNumber(item, 'Armour'),
    evasion: propNumber(item, 'Evasion Rating'),
    energyShield: propNumber(item, 'Energy Shield'),
    ward: propNumber(item, 'Ward'),
    itemLevel: item.ilvl,
    corrupted: item.corrupted,
    mirrored: item.mirrored,
    influences: Object.keys(item.influences ?? {}).map(capitalize)
  }
}
