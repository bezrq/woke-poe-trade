<template>
  <div class="w-banner" :class="[$style.banner, $style[tone]]" role="status">
    <i :class="[icon, $style.icon]" />
    <span :class="$style.text"><slot /></span>
    <span v-if="$slots.actions" :class="$style.actions"><slot name="actions" /></span>
  </div>
</template>

<script setup lang="ts">
// A one-line message above a panel's content (pick E1): what went wrong in
// plain words, plus one fix button in the `actions` slot. Keep the last good
// data visible below it, dimmed with `.w-stale`.
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tone?: 'error' | 'warn' | 'info' }>(), { tone: 'error' })
const icon = computed(() => props.tone === 'info' ? 'fas fa-info-circle' : 'fas fa-exclamation-circle')
</script>

<style module>
.banner {
  display: flex; align-items: center; gap: var(--w-s2);
  padding: 6px var(--w-pad); font-size: var(--w-fs-sm); line-height: 1.35; color: var(--w-fg);
  border-bottom: 1px solid var(--tone-line);
  background: var(--tone-bg);
}
.error { --tone: var(--w-down); }
.warn { --tone: var(--w-warn); }
.info { --tone: var(--w-info); }
.banner { --tone-bg: color-mix(in srgb, var(--tone) 10%, transparent); --tone-line: color-mix(in srgb, var(--tone) 30%, transparent); }
.icon { color: var(--tone); flex: none; }
.text { flex: 1; min-width: 0; }
.actions { display: flex; gap: var(--w-s1); flex: none; }
</style>
