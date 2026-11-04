// Turns a parsed map/logbook into a verdict + juice score.
import { isModuleOn } from '../modules'
import { AppConfig } from '@/web/Config'
import { ItemCategory, ItemRarity } from '@/parser'
import type { ParsedItem } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import { prepareMapStat } from '@/web/map-check/prepare-map-stats'
import { juiceScore, rateMods } from './rules'
import type { JuiceResult, MapVerdict } from './rules'
import { MAP_MODS_TYPE, activeProfile } from './widget'
import type { MapModsWidget } from './widget'

export function isMapLike (item: ParsedItem): boolean {
  const { category, rarity, info: { refName } } = item
  return (
    (category === ItemCategory.Map && rarity !== ItemRarity.Unique) ||
    category === ItemCategory.Invitation ||
    refName === 'Expedition Logbook'
  )
}

export interface MapCheckResult {
  name: string
  sub: string
  verdict: MapVerdict
  juice: JuiceResult
  props: Array<{ label: string, value: number }>
  unknown: string[]
}

export function checkMap (item: ParsedItem, config: MapModsWidget): MapCheckResult {
  const profile = activeProfile(config)
  const stats = item.statsByType
    .filter(calc => calc.type === ModifierType.Explicit)
    .map(calc => prepareMapStat(calc))
  const verdict = rateMods(stats, profile)

  const juice = juiceScore({
    quantity: item.areaItemQuantity,
    rarity: item.areaItemRarity,
    packSize: item.areaPackSize,
    currency: item.mapMoreCurrency,
    scarabs: item.mapMoreScarabs,
    maps: item.mapMoreMaps,
    divCards: item.mapMoreDivCards,
    goodMods: verdict.good.length
  }, config.weights)

  const props: MapCheckResult['props'] = []
  const add = (label: string, value?: number) => { if (value) props.push({ label, value }) }
  add('Quant', item.areaItemQuantity)
  add('Rarity', item.areaItemRarity)
  add('Pack', item.areaPackSize)
  add('Currency', item.mapMoreCurrency)
  add('Scarabs', item.mapMoreScarabs)
  add('Maps', item.mapMoreMaps)
  add('Div cards', item.mapMoreDivCards)

  const name = item.info.area?.blighted
    ? item.info.name
    : (item.mapArea?.name ?? item.info.name)
  const subParts: string[] = []
  if (item.mapTier) subParts.push(`T${item.mapTier}`)
  if (item.rarity === ItemRarity.Rare) subParts.push('Rare')
  if (item.rarity === ItemRarity.Magic) subParts.push('Magic')
  if (item.isCorrupted) subParts.push('Corrupted')
  subParts.push(`${stats.length} mods`)

  const unknown = item.unknownModifiers
    .filter(mod => mod.type === ModifierType.Explicit)
    .map(mod => mod.text)

  return { name, sub: subParts.join(' · '), verdict, juice, props, unknown }
}

// The checker's config, for the strip inside APT's own windows. Null when the
// widget hasn't been added from the overlay menu yet.
export function findMapModsConfig (): MapModsWidget | null {
  // Switched off in Settings → Modules: no strip in price check / map check.
  if (!isModuleOn(AppConfig(), 'map-mods')) return null
  const w = AppConfig().widgets.find(w => w.wmType === MAP_MODS_TYPE) as MapModsWidget | undefined
  if (!w || w.wmFlags[0] === 'uninitialized' || !Array.isArray(w.profiles)) return null
  return w
}
