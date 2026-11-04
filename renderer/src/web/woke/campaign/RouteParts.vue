<template>
  <span><template v-for="(p, i) in parts" :key="i"><span :class="$style[p.kind]">{{ p.text }}</span></template></span>
</template>

<script setup lang="ts">
import type { Part } from './route-parse'

defineProps<{ parts: Part[] }>()
</script>

<style module>
.text {}
.area { color: var(--w-accent); }
.town { color: var(--w-info); }
.kill { color: var(--w-down); }
.quest { color: var(--w-up); }
.item { color: var(--w-warn); }
.waypoint { color: var(--w-info); }
.portal { color: var(--w-info); }
.logout { color: var(--w-dim); font-style: italic; }
.trial { color: var(--w-r-gem); }
.craft { color: var(--w-r-currency); }
.dir { font-family: var(--w-num); color: var(--w-fg); }
.generic { color: var(--w-fg); font-weight: 500; }
</style>
