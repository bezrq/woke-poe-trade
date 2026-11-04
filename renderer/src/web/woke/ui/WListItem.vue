<template>
  <div :class="[$style.item, { [$style.active]: active }]">
    <button type="button" :class="$style.main" class="w-focusable" @click="emit('select')">
      <span :class="$style.line"><slot /></span>
      <span v-if="$slots.sub" :class="$style.sub" class="w-trunc"><slot name="sub" /></span>
    </button>
    <span v-if="$slots.actions" :class="$style.actions"><slot name="actions" /></span>
  </div>
</template>

<script setup lang="ts">
// A clickable list row with an optional second line and trailing icon actions.
withDefaults(defineProps<{ active?: boolean }>(), { active: false })
const emit = defineEmits<{ (e: 'select'): void }>()
</script>

<style module>
.item {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 6px;
  border-bottom: 1px solid var(--w-line-soft);
}
.item:hover, .item:focus-within { background: var(--w-accent-soft); }
.active { background: var(--w-accent-soft); box-shadow: inset 2px 0 0 var(--w-accent); }
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 0 6px var(--w-pad);
  text-align: left;
}
.line { display: flex; align-items: center; gap: 8px; min-width: 0; }
.sub { font-size: var(--w-fs-sm); color: var(--w-dim); }
.actions { display: flex; gap: 2px; flex: none; }
</style>
