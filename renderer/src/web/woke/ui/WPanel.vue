<template>
  <div class="w-surface" :class="$style.panel" :style="{ width, maxHeight }">
    <div v-if="title || $slots.title || $slots.actions" :class="$style.head" data-widget-drag>
      <span :class="$style.title" class="w-trunc">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="$slots.actions" :class="$style.actions"><slot name="actions" /></span>
    </div>
    <div v-if="$slots.tabs" :class="$style.tabs"><slot name="tabs" /></div>
    <div v-if="$slots.toolbar" :class="$style.toolbar"><slot name="toolbar" /></div>
    <div v-if="$slots.meta" :class="$style.meta"><slot name="meta" /></div>
    <div :class="[$style.body, { 'w-scroll': scroll }]"><slot /></div>
    <div v-if="$slots.footer" :class="$style.footer"><slot name="footer" /></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  width?: string
  maxHeight?: string
  scroll?: boolean
}>(), {
  title: undefined,
  width: undefined,
  maxHeight: '75vh',
  scroll: true
})
</script>

<style module>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px var(--w-pad);
  background: var(--w-header-bg);
  border-bottom: 1px solid var(--w-line);
}
.title {
  flex: 1;
  font-family: var(--w-head);
  font-size: var(--w-head-size);
  letter-spacing: var(--w-head-track);
  color: var(--w-fg);
}
:global([data-woke-theme="native"]) .title { color: var(--w-accent); }
:global(:root:not([data-woke-theme="native"]):not([data-woke-theme="modern"])) .title::before {
  content: "";
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 9px;
  background: var(--w-accent);
  transform: translateY(-2px) rotate(45deg);
}
.actions { display: flex; gap: 2px; }
.tabs { padding: 4px 8px 0; border-bottom: 1px solid var(--w-line); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px; }
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding: 6px var(--w-pad);
  font-size: var(--w-text-sm);
  color: var(--w-dim);
}
.toolbar + .meta { padding-top: 0; }
.body { min-height: 0; flex: 1; }
.footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px var(--w-pad);
  border-top: 1px solid var(--w-line);
  font-size: var(--w-text-sm);
  color: var(--w-dim);
}
</style>
