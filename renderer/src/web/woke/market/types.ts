// poe.ninja category slugs (as used by APT's dense overview) mapped to the
// overview "type" names, which are also the Type column of poe.ninja's
// per-league data dumps.
export const CATEGORY_TYPES: Record<string, string> = {
  'currency': 'Currency',
  'fragments': 'Fragment',
  'delirium-orbs': 'DeliriumOrb',
  'scarabs': 'Scarab',
  'artifacts': 'Artifact',
  'base-types': 'BaseType',
  'fossils': 'Fossil',
  'resonators': 'Resonator',
  'incubators': 'Incubator',
  'oils': 'Oil',
  'vials': 'Vial',
  'invitations': 'Invitation',
  'blighted-maps': 'BlightedMap',
  'blight-ravaged-maps': 'BlightRavagedMap',
  'essences': 'Essence',
  'maps': 'Map',
  'tattoos': 'Tattoo',
  'omens': 'Omen',
  'coffins': 'Coffin',
  'allflame-embers': 'AllflameEmber',
  'djinn-coins': 'DjinnCoin',
  'astrolabes': 'Astrolabe',
  'runegrafts': 'Runegraft',
  'ducats': 'Ducat',
  'enshrouding-crystals': 'EnshroudingCrystal',
  'corpses': 'Corpse',
  'divination-cards': 'DivinationCard',
  'beasts': 'Beast',
  'unique-jewels': 'UniqueJewel',
  'unique-flasks': 'UniqueFlask',
  'unique-weapons': 'UniqueWeapon',
  'unique-armours': 'UniqueArmour',
  'unique-accessories': 'UniqueAccessory',
  'unique-maps': 'UniqueMap',
  'unique-relics': 'UniqueRelic',
  'unique-tinctures': 'UniqueTincture',
  'skill-gems': 'SkillGem'
}

// Base types are tens of thousands of rows (item level x influence) and not
// useful for flipping, so they are not stored.
export const SKIPPED_TYPES = new Set(['BaseType'])

export interface PriceItem {
  type: string
  name: string
  // '' when the item has no variant (gem level/quality, links, etc.)
  variant: string
  chaos: number
  // Days out of poe.ninja's last 7 with no price (null or missing graph
  // points). The dense feed has no listing counts, so this is the best
  // available sign of a thin, easily price-fixed market. Missing on
  // snapshots saved before it was recorded.
  gaps?: number
}

// Thin market: poe.ninja had no price on 3+ of the last 7 days.
export const THIN_GAPS = 3

export function isThin (item: { gaps?: number }): boolean {
  return (item.gaps ?? 0) >= THIN_GAPS
}

export function thinTitle (item: { gaps?: number }): string {
  return `Thin market: poe.ninja recorded no price on ${item.gaps ?? 0} of the last 7 days, so this price is easy to fake.`
}

// One collected snapshot (kept for a couple of days for short-term movers).
export interface Snapshot {
  league: string
  ts: number
  divine: number | null
  items: PriceItem[]
}

// One row per item per UTC day; the latest snapshot of the day wins.
// Field names mirror poe.ninja's league dumps so the two can be joined.
export interface DailyRow {
  league: string
  date: string // YYYY-MM-DD, UTC
  type: string
  name: string
  variant: string
  chaos: number
  gaps?: number
  // Divine Orb price in chaos on that day, for converting.
  divine: number | null
  ts: number
}

export function itemKey (item: { type: string, name: string, variant: string }): string {
  return `${item.type}\u0000${item.name}\u0000${item.variant}`
}

export function utcDate (ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}
