import { shallowRef, watch } from 'vue'

// Which price check view to show. 'classic' is APT's listing table untouched;
// 'improved' adds the verdict card and marks listings the verdict ignored.
export type PriceView = 'classic' | 'improved'

const STORAGE_KEY = 'woke.priceView'

function readStored (): PriceView {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'classic' || v === 'improved') return v
  } catch {}
  return 'improved'
}

export const priceView = shallowRef<PriceView>(readStored())

watch(priceView, (v) => {
  try { localStorage.setItem(STORAGE_KEY, v) } catch {}
})

// Verdict card: one line by default; expanded shows notes, poe.ninja and
// the price drivers.
const EXPANDED_KEY = 'woke.priceVerdictExpanded'
function readExpanded (): boolean {
  try { return localStorage.getItem(EXPANDED_KEY) === '1' } catch { return false }
}
export const verdictExpanded = shallowRef(readExpanded())
watch(verdictExpanded, (v) => {
  try { localStorage.setItem(EXPANDED_KEY, v ? '1' : '0') } catch {}
})

window.addEventListener('storage', (e) => {
  if (e.key === EXPANDED_KEY) verdictExpanded.value = e.newValue === '1'
  if (e.key === STORAGE_KEY && (e.newValue === 'classic' || e.newValue === 'improved')) {
    priceView.value = e.newValue
  }
})

// Price history chart under the verdict: opened from the sparkline, remembered.
const HISTORY_KEY = 'woke.priceHistoryOpen'
function readHistory (): boolean {
  try { return localStorage.getItem(HISTORY_KEY) === '1' } catch { return false }
}
export const historyOpen = shallowRef(readHistory())
watch(historyOpen, (v) => {
  try { localStorage.setItem(HISTORY_KEY, v ? '1' : '0') } catch {}
})
