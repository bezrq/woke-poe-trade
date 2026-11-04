// Shared state for the item being price checked right now. The roll buttons
// and mod worth tags sit above the filters, the verdict and drivers below
// them, so they meet here instead of passing props through APT's components.

import { computed, shallowRef } from 'vue'
import { ItemCategory, ItemRarity, ParsedItem } from '@/parser'
import { AppConfig, saveConfig } from '@/web/Config'
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

// Ask poeprices.info for rares (free, no trade rate limit). One switch with
// APT's "show prediction" setting, so the two can't disagree.
function priceCheckWidget (): { requestPricePrediction?: boolean } | undefined {
  try {
    return AppConfig().widgets.find(w => w.wmType === 'price-check') as { requestPricePrediction?: boolean } | undefined
  } catch { return undefined }
}
export const usePoeprices = computed<boolean>({
  get: () => priceCheckWidget()?.requestPricePrediction ?? true,
  set: (v) => {
    const w = priceCheckWidget()
    if (!w || w.requestPricePrediction === v) return
    w.requestPricePrediction = v
    saveConfig()
  }
})

// Builds before the switches merged kept ours in localStorage: an "off"
// there carries over once.
const OLD_PP_KEY = 'woke.pricePoeprices'
function carryOldSwitch () {
  try {
    const old = localStorage.getItem(OLD_PP_KEY)
    if (old == null) return
    localStorage.removeItem(OLD_PP_KEY)
    if (old === '0') usePoeprices.value = false
  } catch {}
}

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
  carryOldSwitch()
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
