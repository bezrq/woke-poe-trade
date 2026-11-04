// Game art for anything that exists in PoE (P18). Item, gem and currency art
// comes from APT's bundled item data (web.poecdn.com URLs, kept by Chromium's
// HTTP cache across restarts); a few icons ship in /images. Generic Font
// Awesome icons are only for UI actions the game has no art for.
import { ITEM_BY_REF } from '@/assets/data'
import type { BaseType } from '@/assets/data/interfaces'

type Ns = BaseType['namespace']

const cache = new Map<string, string | null>()

// Art for an item by its English name, or null if the data has none.
export function gameIcon (name: string, ns: Ns = 'ITEM'): string | null {
  const key = `${ns}:${name}`
  let icon = cache.get(key)
  if (icon === undefined) {
    icon = ITEM_BY_REF(ns, name)?.[0]?.icon || null
    cache.set(key, icon)
  }
  return icon
}

// Currency shipped with the app, so prices draw instantly and offline.
export const CURRENCY_ICONS: Record<string, string> = {
  chaos: '/images/chaos.png',
  divine: '/images/divine.png',
  exalted: '/images/exa.png',
  wisdom: '/images/wisdom.png',
  dust: '/images/dust.png'
}

// League mechanics: a bundled image where we have one, otherwise the item that
// players associate with the mechanic. `fa` is the fallback if neither loads.
export const MECHANIC_ICONS: Record<string, { src?: string, item?: string, fa: string }> = {
  essence: { src: '/images/essence.png', fa: 'fas fa-gem' },
  delve: { src: '/images/delve.png', fa: 'fas fa-mountain' },
  incursion: { src: '/images/incursion.png', fa: 'fas fa-dungeon' },
  betrayal: { src: '/images/veiled.png', fa: 'fas fa-user-secret' },
  maven: { src: '/images/maven-witness.png', fa: 'fas fa-eye' },
  ritual: { item: 'Ritual Splinter', fa: 'fas fa-circle-notch' },
  expedition: { item: 'Exotic Coinage', fa: 'fas fa-compass' },
  delirium: { item: 'Simulacrum Splinter', fa: 'fas fa-cloud' },
  blight: { item: 'Clear Oil', fa: 'fas fa-tint' },
  harvest: { item: 'Wild Crystallised Lifeforce', fa: 'fas fa-seedling' },
  legion: { item: 'Timeless Karui Splinter', fa: 'fas fa-shield-alt' },
  breach: { item: 'Splinter of Xoph', fa: 'fas fa-hand-paper' },
  heist: { item: "Rogue's Marker", fa: 'fas fa-mask' },
  lab: { item: 'Offering to the Goddess', fa: 'fas fa-dungeon' },
  sanctum: { item: 'Forbidden Tome', fa: 'fas fa-book' },
  map: { src: '/images/maps/normal.png', fa: 'fas fa-map' },
  stash: { src: '/images/stash.png', fa: 'fas fa-box' }
}

export function mechanicIcon (id: string): { src: string | null, fa: string } {
  const m = MECHANIC_ICONS[id]
  if (!m) return { src: null, fa: 'fas fa-circle' }
  return { src: m.src ?? (m.item ? gameIcon(m.item) : null), fa: m.fa }
}

// Art for a poe.ninja row ("UniqueArmour", "SkillGem", "DivinationCard",
// "Currency", "Scarab"…) by name.
export function ninjaIcon (type: string, name: string): string | null {
  if (name === 'Chaos Orb') return CURRENCY_ICONS.chaos
  if (name === 'Divine Orb') return CURRENCY_ICONS.divine
  const ns: Ns = /^Unique/.test(type) ? 'UNIQUE' : /Gem/.test(type) ? 'GEM' : type === 'DivinationCard' ? 'DIVINATION_CARD' : 'ITEM'
  return gameIcon(name, ns)
}
