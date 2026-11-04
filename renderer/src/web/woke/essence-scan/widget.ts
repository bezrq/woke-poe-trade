import type { Widget, Anchor } from '@/web/overlay/widgets'
import { MEDS } from './essences'

export const ESSENCE_SCAN_TYPE = 'woke-essence-scan'

export interface EssenceScanWidget extends Widget {
  anchor: Anchor
  // Toggles scan mode on and off.
  hotkey: string | null
  // Reads every essence label on screen once.
  onceHotkey: string | null
  // Essence types that make a monolith worth corrupting.
  flagTypes: string[]
  // Also call out a monolith whose essences are worth at least this much
  // (chaos) in total, even with nothing flagged. 0 turns it off.
  valueAlertChaos: number
}

export function essenceHotkeyTarget (wmId: number): string {
  return `woke-essence-scan:${wmId}`
}

export function essenceOnceTarget (wmId: number): string {
  return `woke-essence-once:${wmId}`
}

export function parseEssenceHotkeyTarget (target: string): { id: number, once: boolean } | null {
  const m = /^woke-essence-(scan|once):(\d+)$/.exec(target)
  return m ? { id: Number(m[2]), once: m[1] === 'once' } : null
}

export function initEssenceScanWidget (w: EssenceScanWidget) {
  w.wmTitle = 'Essence scan'
  w.wmFlags = []
  w.anchor = { pos: 'tr', x: 98, y: 30 }
  w.hotkey = 'Alt + E'
  w.onceHotkey = null
  w.flagTypes = [...MEDS]
  w.valueAlertChaos = 50
}

export function normalizeEssenceScanWidget (w: EssenceScanWidget) {
  if (!w.anchor) w.anchor = { pos: 'tr', x: 98, y: 30 }
  if (w.hotkey === undefined) w.hotkey = null
  if (w.onceHotkey === undefined) w.onceHotkey = null
  if (!Array.isArray(w.flagTypes)) w.flagTypes = [...MEDS]
  if (typeof w.valueAlertChaos !== 'number' || !Number.isFinite(w.valueAlertChaos)) w.valueAlertChaos = 50
}
