import type { Widget, Anchor } from '@/web/overlay/widgets'
import { sortKeys } from '../loot-filter/hotkey-match'
import { DEFAULT_MOD_VALUES, DEFAULT_VALUES } from './rank'

export const FATES_TYPE = 'woke-fates'

export interface FatesWidget extends Widget {
  anchor: Anchor
  // Reads the open Fate window (the pick after an encounter, or Invoke Fates).
  hotkey: string | null
  // Worth of one paid-out reward, per reward icon.
  values: Record<string, number>
  // Highest tier you'll fight, per Fate; 0 means never.
  maxTier: Record<string, number>
  // Added to a gear reward's worth for its modifier (Speed, Physical...).
  modValues: Record<string, number>
  // Invoke slots Mora has unlocked so far.
  slots: number
  // Multiplies the size the reader expects the Fate window at. 1 fits the
  // game at any resolution; only for a game drawn at an odd size.
  uiScale: number
}

// What main's reader sends back (main/src/woke/fate-read.ts, FateRead).
export interface FateReadReward { icon: string, need: number, filled: number, x: number, y: number }
export interface FateReadCard {
  fate: string
  tier: number
  rewards: FateReadReward[]
  // Centre and width as fractions of the game window.
  x: number
  y: number
  width: number
  role: 'offer' | 'slot' | 'held'
}
export type FateRead =
  | { found: false }
  | {
    found: true
    window: 'pick' | 'invoke'
    scale: number
    cards: FateReadCard[]
    // The reward under the cursor, and the gear modifier its tooltip names.
    hover?: { card: number, reward: number, modifier: string | null, text: string | null } | null
  }

export function fatesHotkeyTarget (wmId: number): string {
  return `woke-fates:${wmId}`
}

export function parseFatesHotkeyTarget (target: string): number | null {
  const m = /^woke-fates:(\d+)$/.exec(target)
  return m ? Number(m[1]) : null
}

// Tried in order for the default hotkey; the first one free is used.
export const FATES_KEYS = ['Shift + F', 'Alt + F', 'Ctrl + Shift + F', 'Alt + Shift + F']

export function initFatesWidget (w: FatesWidget) {
  w.wmTitle = 'Fates'
  w.wmFlags = ['invisible-on-blur']
  w.anchor = { pos: 'tr', x: 98, y: 30 }
  w.hotkey = FATES_KEYS[0]
  w.values = { ...DEFAULT_VALUES }
  w.modValues = { ...DEFAULT_MOD_VALUES }
  w.maxTier = {}
  w.slots = 3
  w.uiScale = 1
}

// The read only starts from the hotkey, so turning the module on seeds a
// hidden widget with it, unless that key is already used (`taken`).
export function seedFatesWidget (wmId: number, taken: string[] = []): FatesWidget {
  const w = { wmId, wmType: FATES_TYPE, wmTitle: '', wmWants: 'hide', wmZorder: null, wmFlags: [] } as unknown as FatesWidget
  initFatesWidget(w)
  w.hotkey = freeFatesKey(taken)
  return w
}

export function freeFatesKey (taken: string[]): string | null {
  const used = new Set(taken.map(sortKeys))
  return FATES_KEYS.find(k => !used.has(sortKeys(k))) ?? null
}

// Hotkeys already in a config, plus the price check's.
export function takenKeys (config: object, priceCheckKey: string | null): string[] {
  const taken = [...JSON.stringify(config).matchAll(/"((?:[A-Z][a-z]+ \+ )+\w+)"/g)].map(m => m[1])
  if (priceCheckKey) taken.push(priceCheckKey)
  return taken
}

// Puts a seeded widget on `config` when there's none. Returns whether it did.
export function addFatesWidget<W extends object> (config: { widgets: W[] }, priceCheckKey: string | null): boolean {
  if (config.widgets.some(w => (w as unknown as Widget).wmType === FATES_TYPE)) return false
  const taken = takenKeys(config, priceCheckKey)
  const wmId = Math.max(0, ...config.widgets.map(w => (w as unknown as Widget).wmId)) + 1
  config.widgets.push(seedFatesWidget(wmId, taken) as unknown as W)
  return true
}

export function normalizeFatesWidget (w: FatesWidget) {
  if (!w.anchor) w.anchor = { pos: 'tr', x: 98, y: 30 }
  if (w.hotkey === undefined) w.hotkey = null
  if (!w.values || typeof w.values !== 'object') w.values = { ...DEFAULT_VALUES }
  if (!w.maxTier || typeof w.maxTier !== 'object') w.maxTier = {}
  if (!w.modValues || typeof w.modValues !== 'object') w.modValues = { ...DEFAULT_MOD_VALUES }
  if (![1, 2, 3].includes(w.slots)) w.slots = 3
  if (typeof w.uiScale !== 'number' || !(w.uiScale > 0.5 && w.uiScale < 2)) w.uiScale = 1
}
