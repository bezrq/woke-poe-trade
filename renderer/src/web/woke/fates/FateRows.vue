<template>
  <div :class="$style.list">
    <div v-for="(r, i) in rows" :key="i" :class="[$style.row, { [$style.best]: i === 0 }]">
      <div v-if="r.title" :class="$style.title">{{ r.title }}</div>
      <div :class="$style.line">
        <span :class="$style.clicks">
          <template v-for="(c, j) in r.clicks" :key="j">
            <span v-if="j" :class="$style.arrow">›</span><span :class="[$style.click, { [$style.new]: c === 'New' }]">{{ c }}</span>
          </template>
        </span>
        <span :class="$style.rewards">
          <span v-for="(c, j) in r.rewards" :key="j" :class="$style.chip" :title="rewardTitle(c.icon, c.need)">
            <img :src="iconSrc(c.icon)" alt="" draggable="false"><span v-if="c.count > 1">×{{ c.count }}</span>
          </span>
          <span v-for="(c, j) in r.open" :key="'o' + j" :class="[$style.chip, $style.open]" :title="`${rewardTitle(c.icon, c.need)}: ${c.count}/${c.need} parts, not paid`">
            <img :src="iconSrc(c.icon)" alt="" draggable="false"><span>{{ c.count }}/{{ c.need }}</span>
          </span>
        </span>
      </div>
    </div>
    <div v-if="!rows.length" :class="$style.none">Nothing here pays a reward you value.</div>
  </div>
</template>

<script setup lang="ts">
import type { AdviceRow } from './advice'
import { REWARD_ICONS } from './data'

defineProps<{ rows: AdviceRow[] }>()

const iconSrc = (icon: string) => `/images/fates/${icon}.png`
function rewardTitle (icon: string, need: number): string {
  const text = REWARD_ICONS.find(r => r.icon === icon)?.examples[0]?.split('\n')[0] ?? icon
  return need > 1 ? `${text} (needs ${need} parts)` : text
}
</script>

<style module>
.list { display: flex; flex-direction: column; }
.row { padding: 4px var(--w-pad); border-bottom: 1px solid var(--w-line-soft); }
.row.best { background: color-mix(in srgb, var(--w-accent) 10%, transparent); }
.title { font-size: var(--w-fs-xs); color: var(--w-dim); }
.line { display: flex; align-items: center; gap: 8px; }
.clicks { flex: none; display: flex; align-items: center; gap: 3px; font-family: var(--w-heading, inherit); }
.click { min-width: 1.6em; text-align: center; padding: 0 3px; border: 1px solid var(--w-line-strong); border-radius: var(--w-r-sm); font-size: var(--w-fs-sm); color: var(--w-fg); }
.click.new { color: var(--w-accent); border-color: color-mix(in srgb, var(--w-accent) 60%, transparent); }
.arrow { color: var(--w-faint); }
.rewards { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { display: inline-flex; align-items: center; gap: 1px; font-size: var(--w-fs-sm); color: var(--w-fg); }
.chip img { width: 22px; height: 22px; }
.chip.open { opacity: 0.45; }
.none { padding: 6px var(--w-pad); color: var(--w-dim); font-size: var(--w-fs-sm); }
</style>
