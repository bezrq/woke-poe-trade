<template>
  <span :class="$style.keys">
    <kbd v-for="k in parts" :key="k" :class="$style.kbd">{{ k }}</kbd>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Accepts APT shortcut strings such as "Alt + M" or "Ctrl + Shift + F".
const props = defineProps<{ keys: string | null | undefined }>()
const parts = computed(() => (props.keys ?? '').split('+').map(s => s.trim()).filter(Boolean))
</script>

<style module>
.keys { display: inline-flex; gap: 3px; }
.kbd {
  font-family: var(--w-num);
  font-size: 10.5px;
  line-height: 14px;
  padding: 0 5px;
  border: 1px solid var(--w-line-strong);
  border-bottom-width: 2px;
  border-radius: 3px;
  color: var(--w-fg);
}
</style>
