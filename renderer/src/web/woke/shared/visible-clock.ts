// Widgets stay mounted while hidden, so their clocks would keep ticking.
// This runs `fn` every `visibleMs` while the widget is on screen and every
// `hiddenMs` (or not at all, when null) while it's hidden, and once right
// away whenever it comes back into view.
import { computed, inject, onUnmounted, watch } from 'vue'
import type { Widget } from '@/web/overlay/widgets'
import type { WidgetManager } from '@/web/overlay/interfaces'

export function useWidgetVisible (config: Widget) {
  const wm = inject<WidgetManager>('wm')
  return computed(() => {
    if (config.wmWants !== 'show') return false
    if (config.wmFlags.includes('invisible-on-blur') && wm && !wm.active.value) return false
    return true
  })
}

export function useVisibleClock (config: Widget, fn: () => void, visibleMs: number, hiddenMs: number | null = null) {
  const visible = useWidgetVisible(config)
  let timer: ReturnType<typeof setInterval> | undefined
  const start = (show: boolean) => {
    clearInterval(timer)
    timer = undefined
    const ms = show ? visibleMs : hiddenMs
    if (show) fn()
    if (ms != null) timer = setInterval(fn, ms)
  }
  watch(visible, start, { immediate: true })
  onUnmounted(() => { clearInterval(timer) })
  return visible
}
