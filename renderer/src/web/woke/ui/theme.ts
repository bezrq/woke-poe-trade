import { shallowRef, watch } from 'vue'
// Bundled so text looks the same on every PC and works offline (P19).
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import './theme.css'
import './controls.css'
import './game-look.css'
import './patterns.css'
import './art-sets.css'
import './poe-frame.css'
import './poe-options.css'
import './poe-content.css'
import './scale'
import './density'
import './panel-opacity'
import './app-colors'

export type WokeTheme = 'hybrid' | 'native' | 'modern' | 'classic'

// `short` is for tight spots, like the rail's layout popup.
export const WOKE_THEMES: Array<{ id: WokeTheme, label: string, short: string, hint: string }> = [
  { id: 'hybrid', label: 'Hybrid', short: 'Hybrid', hint: 'The game look: bronze frames, bevelled buttons, Fontin text' },
  { id: 'native', label: 'PoE-native', short: 'Native', hint: 'The game look on darker bronze, roomier rows' },
  { id: 'modern', label: 'Modern', short: 'Modern', hint: 'Frosted glass, rounded, cool accent' },
  { id: 'classic', label: 'Classic APT', short: 'Classic', hint: 'Leave APT widgets as upstream ships them' }
]

const STORAGE_KEY = 'woke.theme'

function readStored (): WokeTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && WOKE_THEMES.some(t => t.id === v)) return v as WokeTheme
  } catch {}
  return 'hybrid'
}

// Stored per window in localStorage; the overlay and settings windows share an
// origin, and the storage event keeps them in sync.
export const wokeTheme = shallowRef<WokeTheme>(readStored())

// Hybrid and Native wear the game look (pick S3 + T1, WOKEPOET-181): bronze frames,
// bevelled controls, Fontin text. Modern and Classic keep their own.
export function lookOf (theme: WokeTheme): 'game' | 'plain' {
  return theme === 'hybrid' || theme === 'native' ? 'game' : 'plain'
}

// The game look's art: Path of Exile 1's interface, Path of Exile 2's, or none
// (the original frames and controls). Only the game look uses it.
export type UiArt = 'poe1' | 'poe2' | 'simple'
export const UI_ARTS: Array<{ value: UiArt, label: string }> = [
  { value: 'poe1', label: 'PoE 1' },
  { value: 'poe2', label: 'PoE 2' },
  { value: 'simple', label: 'Simple' }
]
const ART_KEY = 'woke.uiArt'

function readArt (): UiArt {
  try {
    const v = localStorage.getItem(ART_KEY)
    if (v && UI_ARTS.some(a => a.value === v)) return v as UiArt
  } catch {}
  return 'poe1'
}

export const uiArt = shallowRef<UiArt>(readArt())

function apply () {
  const root = document.documentElement
  root.dataset.wokeTheme = wokeTheme.value
  root.dataset.wokeLook = lookOf(wokeTheme.value)
  if (lookOf(wokeTheme.value) === 'game' && uiArt.value !== 'simple') root.dataset.wokeArt = uiArt.value
  else delete root.dataset.wokeArt
}

apply()
watch(wokeTheme, (theme) => {
  apply()
  try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
})
watch(uiArt, (art) => {
  apply()
  try { localStorage.setItem(ART_KEY, art) } catch {}
})
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) wokeTheme.value = readStored()
  if (e.key === ART_KEY) uiArt.value = readArt()
})
