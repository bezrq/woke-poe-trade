<template>
  <div :class="$style.wrap">
    <WField v-model="query" type="search" icon="fas fa-plus" placeholder="Add an item to this tier"
      @keydown.enter.prevent="pick(results[hl])" @keydown.down.prevent="step(1)" @keydown.up.prevent="step(-1)" @keydown.esc="query = ''" />
    <div v-if="results.length" ref="listEl" :class="$style.list" role="listbox">
      <button v-for="(r, i) in results" :key="r.base" v-item-tip="tipFor?.(r.base) ?? { name: r.base }" type="button" role="option" :aria-selected="i === hl" :class="[$style.row, { [$style.hl]: i === hl }]"
        @mouseenter="hl = i" @click="pick(r)">
        <img v-if="baseIcon(r.base)" :src="baseIcon(r.base)!" :class="$style.art" alt="">
        <span v-else :class="$style.art" />
        <span :class="$style.text">
          <LabelPreview v-if="r.block" :text="r.base" :actions="r.block.actions" :visibility="r.block.visibility" :extras="false" style="max-width: 100%; overflow: hidden;" />
          <span v-else class="w-trunc text-sm">{{ r.base }}</span>
          <span class="w-dim text-xs w-trunc" :title="r.block ? ruleLabel(r.block.type, r.block.tier) : ''">{{ r.block ? `now in ${ruleLabel(r.block.type, r.block.tier)}` : 'in no rule yet' }}</span>
        </span>
        <span class="text-xs w-accent" :class="$style.act">{{ r.sameGroup ? 'Move here' : 'Add here' }}</span>
      </button>
    </div>
    <div v-else-if="query.trim().length >= 2" class="w-faint text-xs" :class="$style.none">No item matches "{{ query }}".</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ITEMS_ITERATOR } from '@/assets/data'
import type { BaseType } from '@/assets/data'
import { WField, vItemTip } from '../ui'
import type { ItemTipRef } from '../ui'
import LabelPreview from './LabelPreview.vue'
import { addSearch } from './groups'
import type { AddResult } from './groups'
import { baseIcon } from './label-style'
import { ruleLabel } from './parse'
import type { FilterDoc } from './parse'

const props = defineProps<{ doc: FilterDoc, type: string, tier: string, tipFor?: (base: string) => ItemTipRef }>()
const emit = defineEmits<{ (e: 'add', result: AddResult): void }>()

const query = ref('')
const hl = ref(0)

// Every base in the game, so an item no rule lists yet can be added too.
let gameBases: string[] | null = null
function allGameBases (): string[] {
  if (!gameBases) {
    const names = new Set<string>()
    for (const i of ITEMS_ITERATOR('"namespace":"ITEM"') as Generator<BaseType>) names.add(i.refName)
    // Game data still loading gives none: look again next time.
    if (!names.size) return []
    gameBases = [...names]
  }
  return gameBases
}

const results = computed(() => query.value.trim().length < 2 ? [] : addSearch(props.doc, props.type, props.tier, query.value, allGameBases()))
const listEl = ref<HTMLElement | null>(null)
watch(results, async () => {
  hl.value = 0
  // The box sits low in the column: bring the results into view.
  await nextTick()
  listEl.value?.scrollIntoView({ block: 'nearest' })
})

function step (dir: 1 | -1) {
  const n = results.value.length
  if (n) hl.value = (hl.value + dir + n) % n
}

// The box stays ready for the next one.
function pick (r: AddResult | undefined) {
  if (!r) return
  emit('add', r)
  query.value = ''
}
</script>

<style module>
.wrap { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
.list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-r-sm);
  background: var(--w-panel-solid);
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  background: none;
  border: 0;
  color: var(--w-fg);
  text-align: left;
  cursor: pointer;
  min-width: 0;
}
.hl { background: var(--w-accent-soft); }
.art { width: 18px; height: 18px; object-fit: contain; flex: none; }
.text { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; align-items: flex-start; }
.act { flex: none; white-space: nowrap; }
.none { padding: 2px 4px; }
</style>
