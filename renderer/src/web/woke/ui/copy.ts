// Copy with in-place feedback (P9): the button that was pressed says "Copied"
// for a moment, no popup.
import { ref } from 'vue'

// Copies text; false when the clipboard refused it. For menus and toasts;
// buttons use useCopy for in-place feedback.
export async function copyText (text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text) } catch { return false }
  return true
}

export function useCopy (ms = 1400) {
  const copied = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy (text: string, key = text) {
    if (!await copyText(text)) return false
    copied.value = key
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = null }, ms)
    return true
  }
  return { copied, copy }
}
