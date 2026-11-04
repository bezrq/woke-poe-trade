// Immortal Syndicate safehouse rewards, transcribed from the 3.24 cheat sheet
// APT ships (renderer/public/images/syndicate.jpg). Users can override any
// slot's text in the widget, so a patch change does not need a release.

import type { PriceItem } from '../market/types'
import { priceGroup } from './data'
import { isThin } from '../market/types'
import type { PriceGroup } from './data'

export const DIVISIONS = ['Transportation', 'Fortification', 'Research', 'Intervention'] as const
export type Division = typeof DIVISIONS[number]

export const MEMBERS = [
  'Aisling', 'Cameria', 'Elreon', 'Gravicius', 'Guff', 'Haku', 'Hillock', 'It That Fled',
  'Janus', 'Jorgin', 'Korell', 'Leo', 'Riker', 'Rin', 'Tora', 'Vagan', 'Vorici'
] as const

// [Transportation, Fortification, Research, Intervention]
export const REWARDS: Record<string, [string, string, string, string]> = {
  'Aisling': ['Veiled weapons and jewellery', 'Veiled armour and jewellery', 'Beyond Scarabs', 'Torment Scarabs'],
  'Cameria': ['League-specific uniques', 'Harbinger Orbs', 'Orb of Unmaking', 'Sulphite Scarabs'],
  'Elreon': ['Unique weapon', 'Unique armour', 'Unique jewellery', 'Reliquary Scarabs'],
  'Gravicius': ['Full stack of divination cards', 'Random divination cards', 'Swap a divination card', 'Divination Scarabs'],
  'Guff': ['Crafting bench: currency spam', 'Crafting bench: essence spam', 'Crafting bench: annul/exalt spam', 'Incursion Scarabs'],
  'Haku': ['Rare items', 'Random strongbox', 'Rare items with quality', 'Ambush Scarabs'],
  'Hillock': ['Essence Scarabs', 'Scarabs (trapped stash)', 'Anarchy Scarabs', 'Abyss Scarabs'],
  'It That Fled': ['Breach splinters', 'Enchanted maps (extra breach)', 'Map device option for Breachstones', 'Breach Scarabs'],
  'Janus': ['Quality currency', 'Currency shards', 'Expedition currency', 'Expedition Scarabs'],
  'Jorgin': ['Talismans', 'Items with Bestiary affixes', 'Ritual Scarabs', 'Bestiary Scarabs'],
  'Korell': ['Essences', 'Map fragments', 'Fossils', 'Influencing Scarabs'],
  'Leo': ['Catalysts', 'Random currency', 'Trapped stash (pick one)', 'Ultimatum Scarabs'],
  'Riker': ['Take one currency', 'Take one unique', 'Take one currency, fossil, splinter or catalyst', 'Blight Scarabs'],
  'Rin': ['Normal maps', 'Rare maps', 'Unique maps', 'Cartography Scarabs'],
  'Tora': ['Take one gem', 'Gems with quality', 'Gem experience', 'Harbinger Scarabs'],
  'Vagan': ['Legion splinters', 'Legion chests', 'Incubators', 'Legion Scarabs'],
  'Vorici': ['Reforge colours, sockets or links (×50)', 'Socket currency', 'Harvest Scarabs', 'Delirium Scarabs']
}

// How to price a reward: the best poe.ninja item that matches.
function pricing (reward: string): PriceGroup | null {
  const scarab = /^(\w+) Scarabs$/.exec(reward)
  if (scarab) return { label: reward, types: ['Scarab'], match: new RegExp(`\\b${scarab[1]}\\b`) }
  switch (reward) {
    case 'Fossils': return { label: reward, types: ['Fossil'] }
    case 'Essences': return { label: reward, types: ['Essence'] }
    case 'Incubators': return { label: reward, types: ['Incubator'] }
    case 'Catalysts': return { label: reward, types: ['Currency'], match: /Catalyst$/ }
    case 'Harbinger Orbs': return { label: reward, types: ['Currency'], match: /^Harbinger's Orb$/ }
    case 'Orb of Unmaking': return { label: reward, types: ['Currency'], match: /^Orb of Unmaking$/ }
    case 'Breach splinters': return { label: reward, types: ['Fragment'], match: /^Splinter of / }
    case 'Legion splinters': return { label: reward, types: ['Fragment'], match: /^Timeless .*Splinter$/ }
    case 'Expedition currency': return { label: reward, types: ['Currency'], match: /^(Exotic Coinage|Scrap Metal|Astragali|Burial Medallion)$/ }
    case 'Map fragments': return { label: reward, types: ['Fragment'] }
    default: return null
  }
}

export interface PricedReward {
  // Best matching item and its price, if poe.ninja has one.
  bestName?: string
  // Typical value (median of the possible items).
  chaos?: number
  // Most valuable possible item.
  upTo?: number
  count?: number
}

// A reward like "Fossils" gives one of many items, so it's worth what the
// typical one sells for (median, thin markets left out), not the best one.
// The best is kept as an "up to".
export function priceReward (reward: string, items: PriceItem[]): PricedReward {
  const group = pricing(reward)
  if (!group) return {}
  const rows = priceGroup({ ...group, limit: 500 }, items)
  if (!rows.length) return {}
  const solid = rows.filter(r => !isThin(r.item))
  const pool = (solid.length ? solid : rows).map(r => r.chaos).sort((a, b) => a - b)
  const mid = pool.length >> 1
  const median = pool.length % 2 ? pool[mid] : (pool[mid - 1] + pool[mid]) / 2
  return { bestName: rows[0].item.name, upTo: rows[0].chaos, chaos: median, count: rows.length }
}

export function slotKey (member: string, division: number): string {
  return `${member}|${division}`
}

// ---- Goals: starred slots, and what to do with whoever you meet ----

export interface BetrayalGoal { member: string, di: number }

export function goalsFromStars (stars: string[]): BetrayalGoal[] {
  const out: BetrayalGoal[] = []
  for (const key of stars) {
    const [member, di] = key.split('|')
    const n = Number(di)
    if (member && Number.isInteger(n) && !out.some(g => g.member === member)) out.push({ member, di: n })
  }
  return out
}

export type AdviceKind = 'move' | 'keep' | 'execute' | 'any'

export interface Advice { kind: AdviceKind, text: string }

// `at`: where each member is now (division index), as the player last set it.
export function adviceFor (member: string, goals: BetrayalGoal[], at: Record<string, number>): Advice {
  const goal = goals.find(g => g.member === member)
  const now = at[member]
  if (goal) {
    if (now === goal.di) return { kind: 'keep', text: 'Keep: pick the option that raises their rank, otherwise Interrogate.' }
    return { kind: 'move', text: `Move: pick the option that sends them to ${DIVISIONS[goal.di]}, otherwise Interrogate.` }
  }
  if (now != null) {
    const blocked = goals.find(g => g.di === now && at[g.member] !== g.di)
    if (blocked) return { kind: 'execute', text: `Execute: frees a ${DIVISIONS[now]} slot for ${blocked.member}.` }
  }
  return { kind: 'any', text: 'Not part of a goal: Interrogate, or take whatever pays most now.' }
}
