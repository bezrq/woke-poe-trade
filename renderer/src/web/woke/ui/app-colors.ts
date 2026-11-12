// App colours: the player's own accent, background and text for the app's
// frame (Settings, the tab bar, the dock), apart from the theme the tool panels
// wear. Stored like the theme: per origin in localStorage, kept in step across
// windows by the storage event.
import { shallowRef, watch } from 'vue'
import { frameColorCss, parseAppColors } from './frame-colors'
import type { AppColors } from './frame-colors'
export { APP_COLOR_PRESETS, DEFAULT_APP_COLORS, sameColors } from './frame-colors'
export type { AppColors } from './frame-colors'

const STORAGE_KEY = 'woke.appColors'

function readStored (): AppColors | null {
  try { return parseAppColors(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

// null: the frame wears the theme like everything else.
export const appColors = shallowRef<AppColors | null>(readStored())

let styleEl: HTMLStyleElement | null = null
function apply (c: AppColors | null) {
  if (!c) { styleEl?.remove(); styleEl = null; return }
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.dataset.wokeAppColors = ''
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = frameColorCss(c)
}

apply(appColors.value)
watch(appColors, (c) => {
  apply(c)
  try {
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
})
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) appColors.value = readStored()
})
