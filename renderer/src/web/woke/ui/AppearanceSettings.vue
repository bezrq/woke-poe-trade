<template>
  <div class="p-2 flex flex-col gap-3 max-w-md">
    <div>
      <div class="mb-1">Toolkit theme</div>
      <div class="text-gray-500 text-sm mb-2">Applies to the woke modules and recolours APT's own windows. Saved instantly.</div>
      <div class="flex flex-col gap-1">
        <label v-for="t in WOKE_THEMES" :key="t.id" :class="$style.option">
          <input type="radio" name="woke-theme" :value="t.id" :checked="wokeTheme === t.id" @change="wokeTheme = t.id">
          <span :class="$style.swatch" :data-theme="t.id" />
          <span class="flex flex-col leading-tight">
            <span>{{ t.label }}</span>
            <span class="text-gray-500 text-sm">{{ t.hint }}</span>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Appearance'
}
</script>

<script setup lang="ts">
import { wokeTheme, WOKE_THEMES } from './theme'
</script>

<style module>
.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.option:hover { background: rgba(255, 255, 255, 0.04); }
.swatch {
  width: 34px;
  height: 22px;
  border-radius: 4px;
  flex: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.swatch[data-theme="hybrid"] { background: linear-gradient(135deg, #13110f 55%, #d4a64a 55%); }
.swatch[data-theme="native"] { background: linear-gradient(135deg, #0e0b08 55%, #8a6a3a 55%); }
.swatch[data-theme="modern"] { background: linear-gradient(135deg, #111216 55%, #9aa8ff 55%); }
.swatch[data-theme="classic"] { background: linear-gradient(135deg, #1a202c 55%, #4a5568 55%); }
</style>
