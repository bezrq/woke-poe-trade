<template>
  <div :class="$style.bar">
    <span class="w-group-label" style="padding: 0">Start from</span>
    <div :class="$style.seg" role="radiogroup" aria-label="Preset">
      <button v-for="p in PRESETS" :key="p.id" type="button" role="radio"
        :aria-checked="active === p.id" :class="{ [$style.on]: active === p.id }"
        @click="pick(p)">{{ p.label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MODULES, PRESETS, applyPreset } from '../modules'
import type { Preset, WokeModulesConfig } from '../modules'

const props = defineProps<{ config: { woke: WokeModulesConfig, widgets: Array<{ wmType: string }> } }>()

// The preset whose module set matches the current switches, if any.
const active = computed(() => {
  const on = MODULES.filter(m => m.group !== 'apt' && !props.config.woke.off.includes(m.id)).map(m => m.id).sort().join()
  return PRESETS.find(p => {
    const want = (p.on === 'all' ? MODULES.filter(m => m.group !== 'apt').map(m => m.id) : [...p.on]).sort().join()
    return want === on
  })?.id
})

function pick (p: Preset) { applyPreset(props.config, p) }
</script>

<style module>
.bar { display: flex; flex-direction: column; gap: 6px; padding: 10px var(--w-pad); }
.seg {
  display: inline-flex;
  flex-wrap: wrap;
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius-sm);
  overflow: hidden;
  width: fit-content;
}
.seg button { background: none; border: 0; font: inherit; font-size: 12px; color: var(--w-dim); padding: 3px 10px; }
.seg button + button { border-left: 1px solid var(--w-line-soft); }
.seg button:hover { color: var(--w-fg); }
.seg button.on { background: var(--w-accent-soft); color: var(--w-accent); }
</style>
