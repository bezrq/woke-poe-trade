// Whether a search can price this rare at all. A rare's value is in its mods,
// so listings found without them say nothing about it. Pure functions.

import { ItemRarity, ParsedItem } from '@/parser'
import { FilterTag } from '@/web/price-check/filters/interfaces'
import type { FilterOrGroup, ItemFilters } from '@/web/price-check/filters/interfaces'
import { isTopTierFilter } from '@/web/price-check/filters/create-stat-filters'

/** A rare with mods to tick, searched with only its name or category: any rare would match. */
export function isBlankRareSearch (item: ParsedItem, filters: ItemFilters, stats: FilterOrGroup[]): boolean {
  if (item.rarity !== ItemRarity.Rare || item.isUnidentified) return false
  // Beasts, invitations and the like are priced by name: they have nothing to tick.
  if (!stats.some(s => s.group || !s.hidden)) return false
  if (stats.some(s => s.group ? !s.meta.disabled : !s.disabled)) return false
  // These narrow a search as much as a mod does, as when pricing a crafting base.
  return !(
    filters.mapTier != null ||
    filters.areaLevel != null ||
    filters.sentinelCharge != null ||
    (filters.itemLevel && !filters.itemLevel.disabled) ||
    (filters.linkedSockets && !filters.linkedSockets.disabled) ||
    (filters.quality && !filters.quality.disabled) ||
    (filters.veiled && !filters.veiled.disabled) ||
    filters.influences?.some(i => !i.disabled)
  )
}

/**
 * Whether poe.ninja's price covers what this search looks for. Its unique
 * prices are for any roll, uncorrupted and without a Foulborn mod.
 */
export function ninjaFitsSearch (item: ParsedItem, stats: FilterOrGroup[]): boolean {
  if (item.rarity !== ItemRarity.Unique) return true
  if (item.isCorrupted || item.isFoulborn) return false
  return !stats.some(s => {
    if (s.group || s.disabled || s.hidden || s.tag === FilterTag.Property) return false
    const { roll } = s
    if (!roll?.bounds) return false
    return (typeof roll.min === 'number' && roll.min > roll.bounds.min) ||
      (typeof roll.max === 'number' && roll.max < roll.bounds.max)
  })
}

/** A rare searched without one of its T1 or T2 mods: too low a bar to call it worthless. */
export function skipsTopMods (item: ParsedItem, stats: FilterOrGroup[]): boolean {
  if (item.rarity !== ItemRarity.Rare || item.isVeiled) return false
  return stats.some(s => !s.group && s.disabled && !s.hidden && isTopTierFilter(s, item))
}
