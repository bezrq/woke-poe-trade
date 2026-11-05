<template>
  <span :class="$style.wrap">
    <i v-if="icon" :class="[icon, $style.icon]" />
    <input :class="[$style.field, { [$style.withIcon]: icon }]" :type="type" :value="modelValue" :placeholder="placeholder"
      @input="onInput" @keydown.esc="clearOnEsc && type !== 'number' && emit('update:modelValue', '')">
    <span v-if="suffix" :class="$style.suffix">{{ suffix }}</span>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string | number
  type?: 'text' | 'number' | 'search'
  placeholder?: string
  icon?: string
  suffix?: string
  // Esc empties a text field. Never a number field: those are settings, and
  // Esc (to leave the overlay) used to reset them to 0.
  clearOnEsc?: boolean
}>(), { type: 'text', placeholder: undefined, icon: undefined, suffix: undefined, clearOnEsc: true })
const emit = defineEmits<{ (e: 'update:modelValue', v: string | number): void }>()

function onInput (e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:modelValue', props.type === 'number' ? Number(v) : v)
}
</script>

<style module>
.wrap { position: relative; display: inline-flex; align-items: center; min-width: 0; }
.field {
  width: 100%;
  min-width: 0;
  height: 26px;
  padding: 0 8px;
  font-size: calc(12.5px * var(--w-text-scale, 1));
  color: var(--w-fg);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius-sm);
}
.field::placeholder { color: var(--w-faint); }
.field:focus { outline: none; border-color: var(--w-accent); }
.withIcon { padding-left: 26px; }
.icon { position: absolute; left: 9px; font-size: calc(11px * var(--w-text-scale, 1)); color: var(--w-faint); pointer-events: none; }
.suffix { margin-left: 5px; font-size: calc(12px * var(--w-text-scale, 1)); color: var(--w-dim); white-space: nowrap; }
</style>
