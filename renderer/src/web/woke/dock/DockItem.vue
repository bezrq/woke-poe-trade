<script setup lang="ts">
// Adds an icon to the dock. Renders nothing where it's placed: the dock draws
// the icon, and the `card` slot when the mouse rests on it. The slot keeps
// using this widget's state, so a widget can stay hidden while its icon shows.
//
//   <DockItem id="farming" icon="fas fa-coins" title="Farming" :show="inMap" :badge="perHour">
//     <template #card>…</template>
//   </DockItem>
import { inject, onUnmounted, useSlots } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import { PEEK_MS, peeksOn, registerDockEntry, unregisterDockEntry } from './dock'
import type { DockLed, DockTone } from './dock'

const props = withDefaults(defineProps<{
  id: string
  // Left out: the module's own icon (modules.ts), the same as everywhere else.
  icon?: string
  art?: string | null
  title: string
  show: boolean
  badge?: string | number | null
  tone?: DockTone
  led?: DockLed | null
  into?: string
  wmId?: number
  cardWidth?: string
  interactive?: boolean
}>(), {
  icon: undefined,
  art: undefined,
  badge: null,
  tone: 'accent',
  led: null,
  into: undefined,
  wmId: undefined,
  cardWidth: undefined,
  interactive: false
})

const emit = defineEmits<{
  (e: 'open-change', open: boolean): void
  // The icon was clicked with the overlay open.
  (e: 'activate'): void
}>()

const wm = inject<WidgetManager>('wm', null as unknown as WidgetManager)

const entry = registerDockEntry(props, useSlots(),
  (open) => emit('open-change', open),
  () => {
    emit('activate')
    if (props.wmId == null || !wm) return
    wm.show(props.wmId)
  })
onUnmounted(() => { unregisterDockEntry(entry) })

// Grow into one line for a few seconds (when peeks are on for this module).
function peek (text: string, ms = PEEK_MS) {
  if (!peeksOn(props.id) || !props.show) return
  entry.peek = { text, until: Date.now() + ms }
  setTimeout(() => {
    if (entry.peek && entry.peek.until <= Date.now()) entry.peek = null
  }, ms + 50)
}

defineExpose({ peek })
</script>

<template>
  <!-- Nothing here: the dock draws this icon. -->
</template>
