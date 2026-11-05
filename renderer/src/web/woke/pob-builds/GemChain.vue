<template>
  <div :class="[$style.chain, { 'opacity-50': !group.enabled }]">
    <div v-for="(g, i) in lines" :key="i" :class="[$style.line, { [$style.linked]: g.linked }]">
      <span :class="[$style.dot, { [$style.hollow]: !g.socketed }]" :style="g.socketed ? { background: `var(--w-s-${g.colour})` } : undefined" />
      <GemName :class="$style.name" :name="g.name" :level="g.level" :quality="g.quality" size="sm" :off="!g.socketed" :struck="!g.socketed" />
      <span v-if="g.level != null" class="ml-auto w-faint text-xs w-num" :class="$style.lq">{{ g.level }}/{{ g.quality ?? 0 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// One gem group as a linked chain, as sockets link on an item. PoB records the
// group and not the sockets, so the dots show gem colours; the item's real
// sockets stay on its row.
import { computed } from 'vue'
import GemName from './GemName.vue'
import { chainGems } from './build-model'
import { gemData } from './gems'
import type { PobSkillGroup } from './widget'

const props = defineProps<{ group: PobSkillGroup }>()

const lines = computed(() => {
  const gems = chainGems(props.group)
  const socketed = (i: number) => props.group.enabled && gems[i] != null && gems[i].enabled
  return gems.map((g, i) => ({
    ...g,
    colour: gemData(g.name)?.colour ?? 'w',
    socketed: socketed(i),
    linked: socketed(i) && socketed(i + 1)
  }))
})
</script>

<style module>
.chain { min-width: 0; }
.line {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 20px;
}
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.hollow { box-shadow: inset 0 0 0 1px var(--w-faint); }
/* The link runs from this dot to the next line's; lines share a height. */
.linked::after {
  content: "";
  position: absolute;
  left: 3px;
  width: 2px;
  top: calc(50% + 4px);
  bottom: calc(-50% + 4px);
  background: var(--w-faint);
}
.name { flex: 0 1 auto; }
.lq { flex: none; }
</style>
