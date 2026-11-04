<template>
  <span v-if="w" :class="[$style.tag, $style[band]]" :title="title">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParsedItem } from '@/parser'
import { modWorth } from './check-state'
import { worthBand, WORTH_SOURCE_LABEL } from './mod-worth'

// Small "~24c" tag on a mod row: how much of the price this mod carries.
const props = defineProps<{ statRef: string, item: ParsedItem }>()

const w = computed(() => {
  const m = modWorth.value
  return m && m.item === props.item ? m.map.get(props.statRef) ?? null : null
})
const band = computed(() => w.value ? worthBand(w.value) : 'adds')

const text = computed(() => {
  const v = w.value!
  if (band.value === 'nothing') return '~0'
  if (v.chaos != null) return `~${v.chaos >= 10 ? Math.round(v.chaos) : v.chaos.toFixed(1)}c`
  return `${Math.round(v.share * 100)}%`
})

const title = computed(() => {
  const v = w.value!
  const what = band.value === 'carry'
    ? 'Carries the price: By value keeps its min close to this roll'
    : band.value === 'nothing'
      ? 'Adds nothing: By value unticks it'
      : 'Adds some value: By value sets its min to the bottom of its tier'
  return `About ${Math.round(v.share * 100)}% of the price, ${WORTH_SOURCE_LABEL[v.source]}.\n${what}.`
})
</script>

<style module>
.tag {
  align-self: center;
  font-family: var(--w-num, ui-monospace, monospace);
  font-size: 11px;
  line-height: 16px;
  padding: 0 5px;
  border-radius: 3px;
  white-space: nowrap;
}
.carry { background: var(--w-accent-soft, rgba(212, 166, 74, .14)); color: var(--w-accent, #d4a64a); }
.adds { background: var(--w-panel-3, #374151); color: var(--w-fg, #e5e7eb); }
.nothing { color: var(--w-faint, #6b7280); }
</style>
