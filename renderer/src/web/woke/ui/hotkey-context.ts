// Lets every hotkey cell in the settings window show clashes without each one
// rebuilding the whole key list: the settings shell provides it.
import { inject, provide } from 'vue'
import type { ComputedRef } from 'vue'

export interface HotkeyContext {
  // Normalised key → labels of every action on it (switched-on modules only).
  uses: ComputedRef<Map<string, string[]>>
  // Normalised keys another program holds.
  failed: ComputedRef<Set<string>>
}

const KEY = Symbol('woke-hotkeys')
export function provideHotkeyContext (ctx: HotkeyContext) { provide(KEY, ctx) }
export function useHotkeyContext (): HotkeyContext | null { return inject<HotkeyContext | null>(KEY, null) }

export function normalizeKey (key: string): string {
  const parts = key.split('+').map(p => p.trim().toLowerCase()).filter(Boolean)
  const mods = ['ctrl', 'shift', 'alt'].filter(m => parts.includes(m))
  const rest = parts.filter(p => !mods.includes(p))
  return [...mods, ...rest].join(' + ')
}
