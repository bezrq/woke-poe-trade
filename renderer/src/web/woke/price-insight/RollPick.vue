<template>
  <div :class="$style.pick">
    <button v-for="o in OPTIONS" :key="o.value" type="submit"
      :class="{ [$style.on]: active === o.value }" :title="o.title" :aria-label="o.title"
      @click="choose($event, o.value)">{{ o.label }}</button>
  </div>
</template>

<script setup lang="ts">
// Low / Approx / High for one mod, under its min and max boxes. Like the mod's
// checkbox it submits the form, so a pick runs the search.
import { computed } from 'vue'
import type { StatFilter } from '@/web/price-check/filters/interfaces'
import { applyRollToFilter, activeRollOf, RollPreset } from './roll-presets'

const props = defineProps<{ filter: StatFilter }>()

const OPTIONS: Array<{ value: RollPreset, label: string, title: string }> = [
  { value: 'low', label: 'Low', title: 'Any roll of this range' },
  { value: 'current', label: '≈', title: 'A tight window around this roll' },
  { value: 'high', label: 'High', title: 'The best quarter of this range' }
]

const active = computed(() => activeRollOf(props.filter))

function choose (e: MouseEvent, preset: RollPreset) {
  // Enter in a min or max box also "clicks" the form's first submit button.
  if (e.detail === 0) return
  applyRollToFilter(props.filter, preset)
}
</script>

<style module>
.pick { display: flex; width: calc(2 * 3rem + 1px); border: 1px solid var(--w-line); border-radius: var(--w-r-sm); overflow: hidden; flex: none; font-family: var(--w-body); }
.pick button { flex: 1 1 0; font-size: var(--w-fs-xs); line-height: 16px; color: var(--w-dim); text-align: center; }
.pick button + button { border-left: 1px solid var(--w-line-soft); }
.pick button:hover { color: var(--w-fg); }
.pick button.on { background: var(--w-accent-soft); color: var(--w-accent); }
</style>
