// Immortal Syndicate safehouse rewards, transcribed from the 3.24 cheat sheet
// APT ships (renderer/public/images/syndicate.jpg). Users can override any
// slot's text in the widget, so a patch change does not need a release.

import type { PriceItem } from '../market/types'
import { priceGroup } from './data'
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
  chaos?: number
}

export function priceReward (reward: string, items: PriceItem[]): PricedReward {
  const group = pricing(reward)
  if (!group) return {}
  const [best] = priceGroup({ ...group, limit: 1 }, items)
  return best ? { bestName: best.item.name, chaos: best.chaos } : {}
}

export function slotKey (member: string, division: number): string {
  return `${member}|${division}`
}
