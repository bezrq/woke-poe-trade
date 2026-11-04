<template>
  <select :class="$style.select" :value="modelValue" @change="onChange">
    <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  options: Array<{ value: string, label: string }>
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
function onChange (e: Event) { emit('update:modelValue', (e.target as HTMLSelectElement).value) }
</script>

<style module>
.select {
  height: 26px;
  min-width: 0;
  padding: 0 6px;
  font-size: 12.5px;
  color: var(--w-fg);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius-sm);
}
.select:focus { outline: none; border-color: var(--w-accent); }
.select option { background: #15130f; }
</style>
