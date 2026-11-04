// Shared state for the item being price checked right now. The roll buttons
// and mod worth tags sit above the filters, the verdict and drivers below
// them, so they meet here instead of passing props through APT's components.

import { shallowRef, watch } from 'vue'
import { ItemCategory, ItemRarity, ParsedItem } from '@/parser'
import { AppConfig } from '@/web/Config'
import { useLeagues } from '@/web/background/Leagues'
import { requestPoeprices, RareItemPrice } from '@/web/price-check/price-prediction/poeprices'
import type { ModWorth } from './mod-worth'

export interface PoepricesState {
  item: ParsedItem
  status: 'loading' | 'ok' | 'error' | 'off'
  price: RareItemPrice | null
  error?: string
}

/** poeprices.info's answer for the checked rare. */
export const poepricesState = shallowRef<PoepricesState | null>(null)
/** Measured drivers for the checked item, from "What drives the price". */
export const measuredDrivers = shallowRef<{ item: ParsedItem, list: Array<{ statRef: string, share: number | null }> } | null>(null)
/** The verdict's headline price for the checked item, in chaos. */
export const checkedFair = shallowRef<{ item: ParsedItem, chaos: number } | null>(null)
/** Worth per mod (by statRef) for the checked item. */
export const modWorth = shallowRef<{ item: ParsedItem, map: Map<string, ModWorth> } | null>(null)

// Ask poeprices.info for rares (free, no trade rate limit). Own switch,
// separate from APT's "show prediction" widget.
const PP_KEY = 'woke.pricePoeprices'
function readPp (): boolean {
  try { return localStorage.getItem(PP_KEY) !== '0' } catch { return true }
}
export const usePoeprices = shallowRef(readPp())
watch(usePoeprices, (v) => {
  try { localStorage.setItem(PP_KEY, v ? '1' : '0') } catch {}
})

const NO_PREDICTION = new Set<ItemCategory | undefined>([
  ItemCategory.Map, ItemCategory.CapturedBeast, ItemCategory.HeistContract,
  ItemCategory.HeistBlueprint, ItemCategory.Chart, ItemCategory.Invitation
])

/** Same rule as APT's prediction widget: identified rares in a popular English-language league. */
export function canAskPoeprices (item: ParsedItem): boolean {
  if (item.rarity !== ItemRarity.Rare || item.isUnidentified) return false
  if (NO_PREDICTION.has(item.category) || item.info.refName === 'Expedition Logbook') return false
  if (AppConfig().language !== 'en') return false
  return Boolean(useLeagues().selected.value?.isPopular)
}

export function loadPoeprices (item: ParsedItem) {
  if (poepricesState.value?.item === item && poepricesState.value.status !== 'off') return
  if (!canAskPoeprices(item)) { poepricesState.value = null; return }
  if (!usePoeprices.value) { poepricesState.value = { item, status: 'off', price: null }; return }
  poepricesState.value = { item, status: 'loading', price: null }
  requestPoeprices(item).then(price => {
    if (poepricesState.value?.item === item) poepricesState.value = { item, status: 'ok', price }
  }, (err: unknown) => {
    if (poepricesState.value?.item === item) poepricesState.value = { item, status: 'error', price: null, error: (err as Error).message }
  })
}

/** poeprices' range in chaos, or null. */
export function poepricesChaos (state: PoepricesState | null, item: ParsedItem, divine: number | undefined) {
  if (!state || state.item !== item || !state.price) return null
  const p = state.price
  const k = p.currency === 'div' ? divine : 1
  if (!k) return null
  return { min: p.min * k, max: p.max * k, confidence: p.confidence }
}
