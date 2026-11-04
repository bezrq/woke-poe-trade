<template>
  <span class="w-num" :class="value == null ? 'w-faint' : value >= 0 ? 'w-up' : 'w-down'" :title="title">
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// value is a ratio change: 0.12 means +12%.
const props = defineProps<{ value: number | null | undefined, title?: string }>()
const text = computed(() => {
  if (props.value == null) return '—'
  const pct = props.value * 100
  const abs = Math.abs(pct)
  return `${pct >= 0 ? '+' : '−'}${abs >= 10 ? Math.round(abs) : abs.toFixed(1)}%`
})
</script>
