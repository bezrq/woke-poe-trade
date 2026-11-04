// Row density (pick D1): comfortable 28px rows by default, compact 24px for
// big screens. Stored like the theme, per origin in localStorage.
import { shallowRef, watch } from 'vue'

export type Density = 'comfortable' | 'compact'
const STORAGE_KEY = 'woke.density'

function readStored (): Density {
  try { return localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable' } catch { return 'comfortable' }
}

export const density = shallowRef<Density>(readStored())

function apply (d: Density) {
  if (d === 'compact') document.documentElement.dataset.wokeDensity = 'compact'
  else delete document.documentElement.dataset.wokeDensity
}

apply(density.value)
watch(density, (d) => {
  apply(d)
  try { localStorage.setItem(STORAGE_KEY, d) } catch {}
})
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) density.value = readStored()
})
