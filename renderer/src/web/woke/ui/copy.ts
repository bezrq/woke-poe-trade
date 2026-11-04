// Copy with in-place feedback (P9): the button that was pressed says "Copied"
// for a moment, no popup.
import { ref } from 'vue'

export function useCopy (ms = 1400) {
  const copied = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy (text: string, key = text) {
    try { await navigator.clipboard.writeText(text) } catch { return false }
    copied.value = key
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = null }, ms)
    return true
  }
  return { copied, copy }
}
