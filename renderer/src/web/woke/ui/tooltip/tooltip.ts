// The one game-style tooltip, drawn by GameTooltip.vue (mounted once in the
// overlay). Screens use v-item-tip (item-tip.ts) from an item's name; the build
// panel passes its own gems and items.
import { shallowRef } from 'vue'
import type { PobItem } from '../../pob-builds/widget'
import type { TipModel } from './tip-content'

export interface GemTip {
  kind: 'gem'
  name: string
  level?: number | null
  quality?: number | null
  // Where to get it, shown at the bottom.
  note?: string
}

export interface ItemTip {
  kind: 'item'
  item: PobItem
}

// The market strip at the foot of a looked-up item.
export interface TipMarket {
  chaos: number
  divine: number | null
  // Which variant the price is for, when the caller didn't name one.
  variant?: string
  // Over the 7 days of the graph, as a ratio: 0.12 is +12%.
  change: number | null
  graph: number[]
}

export interface LookupTip {
  kind: 'lookup'
  model: TipModel
  market: TipMarket | null
}

export type TipContent = GemTip | ItemTip | LookupTip

export const tip = shallowRef<{ content: TipContent, anchor: DOMRect } | null>(null)

export function showTipAt (target: HTMLElement, content: TipContent) {
  let anchor = target.getBoundingClientRect()
  // Items open beside their row: clear of the whole panel, not just the row.
  const panel = content.kind === 'gem' ? null : target.closest('[data-w-panel]')?.getBoundingClientRect()
  if (panel) anchor = new DOMRect(panel.left, anchor.top, panel.width, anchor.height)
  tip.value = { content, anchor }
}

export function showTip (e: Event, content: TipContent) {
  showTipAt(e.currentTarget as HTMLElement, content)
}

// A tooltip still on its way (item-tip.ts) must not appear after a hide: the
// overlay may have closed, and it would sit over the game.
let cancelPending: (() => void) | null = null
export function onTipHide (fn: () => void) {
  cancelPending = fn
}

export function hideTip () {
  cancelPending?.()
  tip.value = null
}
