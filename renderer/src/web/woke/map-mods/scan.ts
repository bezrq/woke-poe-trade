import type { Widget, Anchor } from '@/web/overlay/widgets'

export const MAP_SCAN_TYPE = 'woke-map-scan'

export interface MapScanWidget extends Widget {
  anchor: Anchor
  // Toggles scan mode on and off.
  hotkey: string | null
  // Flash the badge when a reroll on the same map turns it into a "run".
  alertOnPass: boolean
}

export function scanHotkeyTarget (wmId: number): string {
  return `woke-map-scan:${wmId}`
}

export function parseScanHotkeyTarget (target: string): number | null {
  const m = /^woke-map-scan:(\d+)$/.exec(target)
  return m ? Number(m[1]) : null
}

export function initMapScanWidget (w: MapScanWidget) {
  w.wmTitle = 'Map scan'
  w.wmFlags = []
  w.anchor = { pos: 'tr', x: 98, y: 12 }
  w.hotkey = 'Alt + S'
  w.alertOnPass = true
}

export function normalizeMapScanWidget (w: MapScanWidget) {
  if (!w.anchor) w.anchor = { pos: 'tr', x: 98, y: 12 }
  if (w.hotkey === undefined) w.hotkey = null
  if (typeof w.alertOnPass !== 'boolean') w.alertOnPass = true
}

// Two readings closer than this (fraction of window height) are the same
// stash slot, so a reroll replaces the old reading instead of adding one.
export const SAME_SLOT = 0.02
