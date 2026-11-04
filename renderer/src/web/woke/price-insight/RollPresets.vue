<template>
  <div v-if="show" :class="$style.row">
    <span :class="$style.lbl">Rolls</span>
    <w-segmented :model-value="active" :options="OPTIONS"
      title="Low rolls: any roll of each ticked mod's tier. Current rolls: a tight window around this item's rolls. Runs the search."
      @update:model-value="pick" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WSegmented } from '../ui'
import type { FilterOrGroup } from '@/web/price-check/filters/interfaces'
import { applyRollPreset, activeRollPreset, canUseRollPresets, RollPreset } from './roll-presets'

const props = defineProps<{ stats: FilterOrGroup[] }>()
const emit = defineEmits<{ (e: 'apply', preset: RollPreset): void }>()

const OPTIONS = [
  { value: 'low', label: 'Low rolls' },
  { value: 'current', label: 'Current rolls' }
]

const show = computed(() => canUseRollPresets(props.stats))
const active = computed(() => activeRollPreset(props.stats))

function pick (value: string) {
  applyRollPreset(props.stats, value as RollPreset)
  emit('apply', value as RollPreset)
}
</script>

<style module>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
}
.lbl {
  font-size: 12px;
  color: var(--w-dim, #9ca3af);
}
</style>
