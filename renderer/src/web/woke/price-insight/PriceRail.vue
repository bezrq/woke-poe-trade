<template>
  <div v-if="marks.length" :class="$style.rail">
    <div :class="$style.track" />
    <template v-for="m in marks" :key="m.label">
      <div :class="[$style.mark, $style[m.kind]]" :style="{ left: `calc(${m.x}% - ${m.x / 100 * 12}px)` }" />
      <div :class="[$style.lab, $style[m.kind], $style[m.align]]" :style="labelStyle(m)">
        <w-price :class="$style.num" :chaos="m.chaos" :divine="divine" />
        <span>{{ m.label }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WPrice } from '../ui'
import { railMarks, RailInput, RailMark } from './rail'

const props = defineProps<{ input: RailInput, divine: number | undefined }>()

const marks = computed(() => railMarks(props.input))

function labelStyle (m: RailMark) {
  if (m.align === 'start') return { left: '0' }
  if (m.align === 'end') return { right: '0' }
  return { left: `${m.x}%` }
}
</script>

<style module>
.rail { position: relative; height: 46px; }
.track { position: absolute; left: 0; right: 0; top: 5px; height: 2px; background: var(--w-line); }
.mark { position: absolute; top: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--w-dim); border: 2px solid var(--w-pc-well, var(--w-panel-solid)); }
.mark.likely { background: var(--w-accent); }
.mark.ninja { background: var(--w-ninja); }
.lab { position: absolute; top: 15px; display: flex; flex-direction: column; font-size: var(--w-fs-xs); line-height: calc(15px * var(--w-text-scale, 1)); color: var(--w-dim); white-space: nowrap; }
.lab.center { transform: translateX(-50%); align-items: center; }
.lab.end { align-items: flex-end; }
.lab.start { align-items: flex-start; }
.num { font-size: var(--w-fs-md); font-weight: 600; line-height: calc(16px * var(--w-text-scale, 1)); color: var(--w-fg); }
.lab.likely .num { color: var(--w-accent); }
</style>
