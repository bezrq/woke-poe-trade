<template>
  <img v-if="art && !failed" :src="art" alt="" draggable="false" :class="$style.art" @error="failed = true">
  <i v-else class="fas" :class="[icon, $style.glyph]" />
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'

const props = defineProps<{ art: string | null, icon: string }>()

// Game art, with the Font Awesome icon as fallback if it doesn't load.
const failed = shallowRef(false)
watch(() => props.art, () => { failed.value = false })
</script>

<style module>
.art { display: block; flex: none; width: var(--w-icon-md); height: var(--w-icon-md); object-fit: contain; }
.glyph { display: block; flex: none; width: var(--w-icon-md); text-align: center; font-size: var(--w-fs-lg); }
</style>
