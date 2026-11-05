import type { Widget, Anchor } from '@/web/overlay/widgets'

export const MAP_SCAN_TYPE = 'woke-map-scan'

export interface MapScanWidget extends Widget {
  anchor: Anchor
  // Toggles scan mode on and off.
  hotkey: string | null
  // Rolling mode: lock onto the hovered map's tooltip and re-read only that.
  rollHotkey: string | null
  // Flash the badge when a reroll on the same map turns it into a "run".
  alertOnPass: boolean
}

export function scanHotkeyTarget (wmId: number): string {
  return `woke-map-scan:${wmId}`
}

export function rollHotkeyTarget (wmId: number): string {
  return `woke-map-scan:${wmId}:roll`
}

export function parseScanHotkeyTarget (target: string): { wmId: number, roll: boolean } | null {
  const m = /^woke-map-scan:(\d+)(:roll)?$/.exec(target)
  return m ? { wmId: Number(m[1]), roll: Boolean(m[2]) } : null
}

export function initMapScanWidget (w: MapScanWidget) {
  w.wmTitle = 'Map scan'
  // The panel shows with the overlay open; while you play, its dock icon does.
  w.wmFlags = ['invisible-on-blur']
  w.anchor = { pos: 'tr', x: 98, y: 12 }
  w.hotkey = 'Alt + S'
  w.rollHotkey = 'Alt + R'
  w.alertOnPass = true
}

export function normalizeMapScanWidget (w: MapScanWidget) {
  if (!w.anchor) w.anchor = { pos: 'tr', x: 98, y: 12 }
  if (w.hotkey === undefined) w.hotkey = null
  if (w.rollHotkey === undefined) w.rollHotkey = 'Alt + R'
  if (typeof w.alertOnPass !== 'boolean') w.alertOnPass = true
}

// Two readings closer than this (fraction of window height) are the same
// stash slot, so a reroll replaces the old reading instead of adding one.
// One quad tab cell: the most that keeps neighbouring quad maps apart (hovered
// at the same point of the cell) while still forgiving a rough return to a map.
const SAME_SLOT = 0.024

// `at` positions are fractions of the window; `aspect` is its width / height.
export function sameSlot (a: { x: number, y: number }, b: { x: number, y: number }, aspect: number): boolean {
  return Math.hypot((a.x - b.x) * aspect, a.y - b.y) < SAME_SLOT
}
