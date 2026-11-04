<template>
  <span :class="$style.dots" :title="title">
    <template v-for="(c, i) in colours" :key="i">
      <span v-if="i" :class="$style.link" />
      <span :class="[$style.dot, $style[c]]" />
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GemColour } from './gems'
import { COLOUR_NAME } from './build-model'

const props = defineProps<{ colours: GemColour[] }>()
const title = computed(() => props.colours.map(c => COLOUR_NAME[c]).join(' - '))
</script>

<style module>
.dots { display: inline-flex; align-items: center; flex: none; vertical-align: middle; }
.dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35); }
.link { width: 4px; height: 2px; background: var(--w-faint); }
.r { background: var(--w-s-r); }
.g { background: var(--w-s-g); }
.b { background: var(--w-s-b); }
.w { background: var(--w-s-w); }
</style>
