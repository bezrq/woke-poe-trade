<template>
  <div :class="[$style.card, $style[insight.confidence]]">
    <div v-if="!insight.range" :class="$style.row">
      <span :class="$style.badge">{{ loading ? '…' : 'NO DATA' }}</span>
      <span class="w-dim">{{ loading ? 'Reading listings…' : emptyText }}</span>
      <span class="flex-1" />
      <ninja-line v-if="ninjaChaos != null" :chaos="ninjaChaos" :divine="divine" :url="ninjaUrl" />
    </div>
    <template v-else>
      <div :class="$style.row">
        <span :class="$style.badge" :title="CONFIDENCE_HINT[insight.confidence]">{{ CONFIDENCE_LABEL[insight.confidence] }}</span>
        <template v-if="lowValue">
          <span :class="$style.headline">Not worth listing</span>
          <span class="w-dim text-xs">under {{ LOW_VALUE }}c</span>
        </template>
        <template v-else>
          <span class="w-dim">Worth about</span>
          <w-price :class="$style.headline" :chaos="insight.range.fair" :divine="divine" />
        </template>
        <span class="flex-1" />
        <span class="w-dim text-xs" :title="droppedTitle">{{ countText }}</span>
      </div>
      <div :class="$style.row" class="text-xs">
        <span class="w-dim">Range</span>
        <w-price :chaos="insight.range.low" :divine="divine" :unit="rangeUnit" />
        <span class="w-faint">–</span>
        <w-price :chaos="insight.range.high" :divine="divine" :unit="rangeUnit" />
        <span class="flex-1" />
        <ninja-line v-if="ninjaChaos != null" :chaos="ninjaChaos" :divine="divine" :url="ninjaUrl" :fair="insight.range.fair" />
      </div>
      <div v-if="!lowValue && notes.length" :class="$style.row">
        <button v-for="n in notes" :key="n.key" type="button" :class="$style.note"
          :title="'Copy the listing note: ' + n.text" @click="copy(n)">
          <span class="w-dim">{{ n.label }}</span>
          <span class="w-num">{{ copied === n.key ? 'Copied' : n.text }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { ItemRarity, ParsedItem } from '@/parser'
import { usePoeninja } from '@/web/background/Prices'
import { getDetailsId } from '@/web/price-check/trends/getDetailsId'
import { WPrice } from '../ui'
import NinjaLine from './NinjaLine.vue'
import { DROP_LABEL, DropReason, Insight, Confidence, notePrice, noteText } from './insight'

const props = defineProps<{
  item: ParsedItem
  insight: Insight
  divine: number | undefined
  loading: boolean
  total: number | null
}>()

const LOW_VALUE = 3

const CONFIDENCE_LABEL: Record<Confidence, string> = { high: 'SOLID', medium: 'FAIR', low: 'THIN', none: 'NO DATA' }
const CONFIDENCE_HINT: Record<Confidence, string> = {
  high: 'Plenty of listings that agree with each other',
  medium: 'Some listings, a bit spread out',
  low: 'Few or widely spread listings: treat the price as a rough guess',
  none: 'No usable listings'
}

const ninja = usePoeninja()
const ninjaInfo = computed(() => {
  // A rare's value is in its mods, so a base type price would mislead.
  if (props.item.rarity === ItemRarity.Rare) return null
  // The divine rate arrives with each poe.ninja load, so it also re-runs this lookup.
  if (props.divine == null) return null
  try {
    const id = getDetailsId(props.item)
    if (!id) return null
    return ninja.findPriceByQuery(id)
  } catch {
    return null
  }
})
const ninjaChaos = computed(() => ninjaInfo.value?.chaos ?? null)
const ninjaUrl = computed(() => ninjaInfo.value?.url)

const lowValue = computed(() => (props.insight.range?.fair ?? 0) < LOW_VALUE)

const rangeUnit = computed(() => {
  const r = props.insight.range
  if (!r || !props.divine) return 'chaos'
  return r.high >= props.divine ? 'div' : 'chaos'
})

const emptyText = computed(() => {
  if (props.total === 0) return 'Nobody is selling this with these filters'
  if (props.insight.dropped.size) return 'All listings looked unreliable'
  return 'No listings yet'
})

const countText = computed(() => {
  const used = props.insight.kept.length
  const skipped = props.insight.dropped.size
  return skipped ? `${used} used · ${skipped} ignored` : `${used} used`
})

const droppedTitle = computed(() => {
  const counts = new Map<DropReason, number>()
  for (const reason of props.insight.dropped.values()) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1)
  }
  if (!counts.size) return 'Every fetched listing was used'
  return Array.from(counts, ([reason, n]) => `${n} × ${DROP_LABEL[reason]}`).join('\n')
})

const notes = computed(() => {
  const s = props.insight.suggest
  if (!s) return []
  const fast = noteText(notePrice(s.fast, props.divine))
  const patient = noteText(notePrice(s.patient, props.divine))
  if (fast === patient) return [{ key: 'fast', label: 'List', text: fast }]
  return [
    { key: 'fast', label: 'Sell fast', text: fast },
    { key: 'patient', label: 'Patient', text: patient }
  ]
})

const copied = shallowRef<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copy (n: { key: string, text: string }) {
  try {
    await navigator.clipboard.writeText(n.text)
    copied.value = n.key
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = null }, 1500)
  } catch {}
}
</script>

<style module>
.card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 9px;
  margin: 0 0 8px;
  border-radius: var(--w-radius);
  border: 1px solid var(--w-line-strong);
  background: var(--w-panel);
  color: var(--w-fg);
  font-family: var(--w-body);
  font-size: var(--w-text);
}
.row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.badge {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--w-radius-sm);
  background: var(--w-panel-3);
  color: var(--w-dim);
}
.high .badge { background: var(--w-up); color: var(--w-accent-fg); }
.medium .badge { background: var(--w-accent); color: var(--w-accent-fg); }
.low .badge { background: var(--w-warn); color: var(--w-accent-fg); }
.low { border-color: color-mix(in srgb, var(--w-warn) 45%, transparent); }
.headline { font-size: 16px; font-weight: 600; color: var(--w-accent); }
.note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: var(--w-radius-sm);
  border: 1px solid var(--w-line);
  background: var(--w-panel-2);
  font-size: 12px;
}
.note:hover { border-color: var(--w-line-strong); background: var(--w-accent-soft); }
</style>
