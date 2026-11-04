<template>
  <div :class="$style.empty">
    <i v-if="icon" :class="[icon, $style.icon]" />
    <div><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string }>()
</script>

<style module>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px var(--w-pad);
  text-align: center;
  color: var(--w-dim);
  font-size: 12.5px;
}
.icon { font-size: 18px; color: var(--w-faint); }
</style>
