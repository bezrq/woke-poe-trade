<template>
  <a :class="$style.ninja" :href="url" target="_blank" :title="title">
    <span class="w-dim">poe.ninja</span>
    <w-price :chaos="chaos" :divine="divine" />
    <span v-if="gap != null" :class="gap > 0 ? 'w-up' : 'w-down'">{{ gapText }}</span>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WPrice } from '../ui'

const props = defineProps<{
  chaos: number
  divine: number | undefined
  url?: string
  /** Fair price from listings; when given, shows how far listings sit from poe.ninja. */
  fair?: number
}>()

// Only worth mentioning when listings and poe.ninja disagree by a quarter or more.
const gap = computed(() => {
  if (props.fair == null || !(props.chaos > 0)) return null
  const ratio = props.fair / props.chaos - 1
  return Math.abs(ratio) >= 0.25 ? ratio : null
})
const gapText = computed(() => {
  const pct = Math.round(gap.value! * 100)
  return `listings ${pct > 0 ? '+' : ''}${pct}%`
})
const title = computed(() => gap.value != null
  ? 'Listings disagree with poe.ninja, which averages recent prices. Trust the listings for rolls and corruption, poe.ninja for the going rate.'
  : 'poe.ninja price for this item')
</script>

<style module>
.ninja { display: inline-flex; align-items: center; gap: 5px; font-size: var(--w-fs-md); color: var(--w-fg); }
.ninja:hover { text-decoration: underline; }
</style>
