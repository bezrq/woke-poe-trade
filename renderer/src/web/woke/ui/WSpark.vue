<template>
  <svg v-if="pts" :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" :class="$style.spark" aria-hidden="true">
    <polygon :points="`${pad},${height} ${pts} ${width - pad},${height}`" :fill="color" opacity="0.12" />
    <polyline :points="pts" fill="none" :stroke="color" stroke-width="1.3" stroke-linejoin="round" />
    <circle :cx="last[0]" :cy="last[1]" r="1.8" :fill="color" />
  </svg>
  <span v-else :style="{ width: width + 'px' }" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  values: number[]
  width?: number
  height?: number
}>(), { width: 62, height: 18 })

const pad = 2
const coords = computed(() => {
  const v = props.values
  if (v.length < 2) return []
  const min = Math.min(...v)
  const span = (Math.max(...v) - min) || 1
  return v.map((n, i) => [
    pad + i * (props.width - pad * 2) / (v.length - 1),
    props.height - 3 - (n - min) / span * (props.height - 6)
  ])
})
const pts = computed(() => coords.value.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '))
const last = computed(() => coords.value[coords.value.length - 1] ?? [0, 0])
const color = computed(() => {
  const v = props.values
  return v.length < 2 || v[v.length - 1] >= v[0] ? 'var(--w-up)' : 'var(--w-down)'
})
</script>

<style module>
.spark { display: block; flex: none; }
</style>
