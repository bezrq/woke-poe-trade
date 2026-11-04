<template>
  <span :class="$style.price" class="w-num">
    <template v-if="chaos == null"><span class="w-faint">—</span></template>
    <template v-else>
      {{ text }}<img :src="useDivine ? '/images/divine.png' : '/images/chaos.png'" :class="$style.coin" :alt="useDivine ? 'div' : 'c'">
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Shows a chaos value, switching to divines when it is worth at least one.
// Pass unit to force one, e.g. so "then" and "now" in a row use the same unit.
const props = withDefaults(defineProps<{
  chaos: number | null | undefined
  divine?: number | null
  unit?: 'auto' | 'chaos' | 'div'
}>(), { divine: null, unit: 'auto' })

const useDivine = computed(() => {
  if (!props.divine || props.chaos == null || props.unit === 'chaos') return false
  return props.unit === 'div' || Math.abs(props.chaos) >= props.divine
})
const text = computed(() => {
  if (props.chaos == null) return ''
  const v = useDivine.value ? props.chaos / props.divine! : props.chaos
  const a = Math.abs(v)
  return a >= 100 ? Math.round(v).toString() : a >= 10 ? v.toFixed(useDivine.value ? 1 : 0) : v.toFixed(1)
})
</script>

<style module>
.price { display: inline-flex; align-items: center; justify-content: flex-end; gap: 3px; }
.coin { width: 16px; height: 16px; object-fit: contain; flex: none; }
</style>
