<template>
  <div :class="$style.tabs" role="tablist">
    <button v-for="opt in options" :key="opt.value" type="button" role="tab"
      :aria-selected="opt.value === modelValue"
      :class="[$style.tab, { [$style.active]: opt.value === modelValue }]"
      @click="emit('update:modelValue', opt.value)">
      {{ opt.label }}<span v-if="opt.count != null" :class="$style.count">{{ opt.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  options: Array<{ value: string, label: string, count?: number | string }>
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<style module>
.tabs { display: flex; gap: 2px; }
.tab {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--w-dim);
  padding: 5px 10px 6px;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
}
.tab:hover { color: var(--w-fg); }
.active { color: var(--w-fg); border-bottom-color: var(--w-accent); }
.count { margin-left: 5px; font-size: var(--w-fs-xs); color: var(--w-faint); }
:global([data-woke-theme="native"]) .tab { font-family: var(--w-head); letter-spacing: 0.05em; }
:global([data-woke-theme="modern"]) .tab { border: 0; border-radius: 6px; padding: 3px 10px; margin: 0 0 4px; }
:global([data-woke-theme="modern"]) .active { background: var(--w-panel-3); }
</style>
