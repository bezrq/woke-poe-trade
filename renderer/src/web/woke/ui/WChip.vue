<template>
  <component :is="clickable ? 'button' : 'span'" :type="clickable ? 'button' : undefined"
    :class="[$style.chip, { [$style.on]: active, [$style.clickable]: clickable }]">
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ active?: boolean, clickable?: boolean }>(), { active: false, clickable: false })
</script>

<style module>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: calc(11px * var(--w-text-scale, 1));
  line-height: calc(16px * var(--w-text-scale, 1));
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--w-line-strong);
  color: var(--w-dim);
  white-space: nowrap;
}
:global([data-woke-theme="native"]) .chip { border-radius: 1px; }
.clickable:hover { color: var(--w-fg); }
.on {
  color: var(--w-accent);
  border-color: color-mix(in srgb, var(--w-accent) 45%, transparent);
  background: var(--w-accent-soft);
}
</style>
