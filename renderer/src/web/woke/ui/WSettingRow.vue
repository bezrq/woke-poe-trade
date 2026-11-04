<template>
  <div :class="[$style.row, { [$style.stack]: stack, [$style.off]: disabled }]" :data-setting="label">
    <div :class="$style.text">
      <div :class="$style.label">
        <slot name="label">{{ label }}</slot>
        <span v-if="restart" :class="$style.restart">Restart to apply</span>
      </div>
      <div v-if="hint || $slots.hint" :class="$style.hint"><slot name="hint">{{ hint }}</slot></div>
    </div>
    <div v-if="$slots.default" :class="$style.control"><slot /></div>
  </div>
</template>

<script setup lang="ts">
// One setting: label and a short hint on the left, the control on the right.
// `stack` puts the control under the text, for wide fields and lists.
withDefaults(defineProps<{
  label: string
  hint?: string
  stack?: boolean
  disabled?: boolean
  restart?: boolean
}>(), { hint: undefined, stack: false, disabled: false, restart: false })
</script>

<style module>
.row {
  display: flex; align-items: center; gap: var(--w-s4);
  min-height: var(--w-row-h); padding: var(--w-s2) 0;
  border-bottom: 1px solid var(--w-line-soft);
}
.row:last-child { border-bottom: 0; }
.stack { flex-direction: column; align-items: stretch; gap: var(--w-s2); }
.text { flex: 1; min-width: 0; }
.label { color: var(--w-fg); font-size: var(--w-fs-md); display: flex; align-items: center; gap: var(--w-s2); flex-wrap: wrap; }
.hint { color: var(--w-dim); font-size: var(--w-fs-sm); line-height: 1.4; margin-top: 2px; }
.control { flex: none; display: flex; align-items: center; gap: var(--w-s2); flex-wrap: wrap; justify-content: flex-end; max-width: 60%; }
.stack .control { max-width: none; justify-content: flex-start; }
.off { opacity: 0.55; }
.restart {
  font-size: var(--w-fs-xs); color: var(--w-warn); border: 1px solid currentColor;
  border-radius: var(--w-r-pill); padding: 0 6px; line-height: 16px;
}
</style>
