<template>
  <div :class="$style.wrap" class="w-scroll">
    <div :class="$style.head">
      <WToggle v-model="config.priceTiers.on">Re-tier from poe.ninja prices</WToggle>
      <span class="w-dim text-xs w-num" :title="league ? `League: ${league}` : ''">
        <template v-if="updatedAt">{{ league }} · prices from {{ agoPhrase(updatedAt) }}</template>
        <template v-else>waiting for prices</template>
      </span>
      <span class="grow" />
      <WSegmented :model-value="config.priceTiers.uniqueRule" :options="uniqueOptions" title="A base type can hold several uniques: price it by its best one (never hides a valuable unique) or its cheapest"
        @update:model-value="v => config.priceTiers.uniqueRule = v === 'min' ? 'min' : 'max'" />
    </div>

    <WEmpty v-if="!store.prices.lookup.value" :art="{ item: 'Chaos Orb' }">
      No poe.ninja prices for this league yet. They download in the background the first time something needs them; price check any item to fetch them now.
    </WEmpty>

    <template v-else-if="config.priceTiers.on">
      <div class="w-group-label" :class="$style.label">
        {{ moves.length ? `${moves.length} item${moves.length > 1 ? 's' : ''} would move` : 'Tiers match today\'s prices' }}
        <span v-if="config.priceTiers.moves.length" class="w-faint"> · {{ config.priceTiers.moves.length }} moved by prices so far</span>
      </div>
      <div v-for="m in moves" :key="m.type + m.base" :class="$style.row" @contextmenu="moveMenu($event, m)">
        <input :id="`pm-${m.type}-${m.base}`" v-model="picked[m.type + '|' + m.base]" type="checkbox" :class="$style.check" :aria-label="`Move ${m.base}`">
        <img v-if="icon(m)" :src="icon(m)!" :class="$style.art" alt="">
        <LabelPreview :text="m.base" :actions="lookOf(m.type, m.to)" :extras="false" />
        <span class="w-dim text-xs w-trunc">{{ groupLabel(m.type) }}</span>
        <span class="w-num text-xs"><span :class="rank(m.to) < rank(m.from) ? $style.up : $style.down">{{ m.from }} → {{ m.to }}</span></span>
        <span class="grow" />
        <span class="w-num text-xs w-dim w-trunc" :title="m.note">{{ m.note ? `${m.note} · ` : '' }}</span>
        <WPrice :chaos="m.chaos" :divine="divine" />
      </div>
      <template v-if="skipped.length">
        <div class="w-group-label" :class="$style.label">Not moved</div>
        <div v-for="s in skipped" :key="'s' + s.type + s.base" :class="$style.row">
          <span :class="$style.check" />
          <LabelPreview :text="s.base" :actions="lookOf(s.type, s.tier)" :extras="false" />
          <span class="w-dim text-xs">{{ groupLabel(s.type) }} {{ s.tier }}</span>
          <WChip :title="s.reason === 'thin' ? 'poe.ninja had no price on 3 or more of the last 7 days, so this price is easy to fake' : 'You placed this item yourself'">
            {{ s.reason === 'thin' ? 'thin market' : 'your tier, locked' }}
          </WChip>
          <span class="grow" />
          <span class="w-faint text-xs">price says {{ s.wanted }}</span>
          <WPrice :chaos="s.chaos" :divine="divine" />
        </div>
      </template>
      <div :class="$style.actions">
        <WButton v-if="config.priceTiers.moves.length" size="sm" variant="ghost" icon="fas fa-undo" title="Put every price group back on NeverSink's own tiers" @click="reset">Back to NeverSink's tiers</WButton>
        <span class="grow" />
        <WButton size="sm" variant="ghost" :disabled="!moves.length" @click="keepAll">Keep all where they are</WButton>
        <WButton size="sm" variant="primary" :disabled="!pickedMoves.length" @click="apply">Apply {{ pickedMoves.length }}</WButton>
      </div>
    </template>

    <div :class="$style.net">
      <div class="flex items-center gap-2">
        <WToggle v-model="config.safetyNet.on">Always show anything worth</WToggle>
        <WField v-model.number="minChaos" type="number" suffix="c" style="width: 5.5rem;" aria-label="Safety net value in chaos" />
        <span class="w-dim text-xs">{{ config.safetyNet.on ? `${store.safetyCount.value} hidden item${store.safetyCount.value === 1 ? '' : 's'} caught right now` : 'off' }}</span>
      </div>
      <div class="w-faint text-xs">One rule at the top of your filter, white on red with a short red beam, for valuable items the rest of the filter would hide. Thin markets are left out.</div>
    </div>

    <div class="w-group-label" :class="$style.label">Filter health · valuable but hidden or small</div>
    <WEmpty v-if="!health.length" icon="fas fa-check">Nothing worth {{ Math.min(config.safetyNet.minChaos, 10) }}c or more is hidden or shown small.</WEmpty>
    <div v-for="v in health" :key="'h' + v.group.type + v.base" :class="$style.row">
      <img v-if="icon({ type: v.group.type, base: v.base })" :src="icon({ type: v.group.type, base: v.base })!" :class="$style.art" alt="">
      <LabelPreview :text="v.base" :actions="v.block?.actions ?? []" :visibility="v.state === 'hidden' ? 'Hide' : 'Show'" :extras="false" />
      <span class="w-dim text-xs w-trunc">{{ groupLabel(v.block?.type ?? v.group.type) }} {{ v.block?.tier ?? '' }}</span>
      <WChip :class="v.state === 'hidden' ? $style.bad : ''">{{ v.state === 'hidden' ? (caught(v) ? 'hidden, safety net shows it' : 'hidden') : 'small label' }}</WChip>
      <span class="grow" />
      <WPrice :chaos="v.chaos" :divine="divine" />
      <WButton size="sm" variant="ghost" @click="showIt(v)">Show it</WButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { WButton, WChip, WEmpty, WField, WPrice, WSegmented, WToggle, agoPhrase, ninjaIcon, openMenu, toast } from '../ui'
import { usePoeninja } from '@/web/background/Prices'
import LabelPreview from './LabelPreview.vue'
import type { LootFilterStore } from './store'
import type { LootFilterWidget } from './widget'
import { ECONOMY_GROUPS, tierRank } from './economy'
import type { PriceMove } from './economy'
import { conditionSignature } from './edits'
import { SAFETY_LOOK } from './safety'
import type { BaseVerdict } from './safety'
import { groupName } from './groups'
import type { FilterAction } from './parse'

const props = defineProps<{
  store: LootFilterStore
  config: LootFilterWidget
  anchor?: Element | null
}>()

const ninja = usePoeninja()
const divine = computed(() => ninja.xchgRate.value ?? null)
const updatedAt = computed(() => props.store.prices.updatedAt.value)
const league = computed(() => props.store.prices.league.value)
const plan = computed(() => props.store.plan.value)
const moves = computed(() => plan.value?.moves ?? [])
const skipped = computed(() => (plan.value?.skipped ?? []).slice(0, 20))
const health = computed(() => props.store.health.value.slice(0, 40))

const uniqueOptions = [
  { value: 'max', label: 'Best unique' },
  { value: 'min', label: 'Cheapest unique' }
]

// Ticked by default; unticked rows stay put this time.
const picked = reactive<Record<string, boolean>>({})
watch(moves, (list) => {
  for (const m of list) if (picked[m.type + '|' + m.base] === undefined) picked[m.type + '|' + m.base] = true
}, { immediate: true })
const pickedMoves = computed(() => moves.value.filter(m => picked[m.type + '|' + m.base]))

const minChaos = computed({
  get: () => props.config.safetyNet.minChaos,
  set: (v: number) => { if (Number.isFinite(v) && v > 0) props.config.safetyNet.minChaos = v }
})

function groupLabel (type: string): string {
  return ECONOMY_GROUPS.find(g => g.type === type)?.label ?? groupName(type)
}

function rank (tier: string): number {
  return tierRank(tier, [], ECONOMY_GROUPS.find(g => g.extraTiers?.[tier] != null)) ?? 99
}

function lookOf (type: string, tier: string): FilterAction[] {
  const b = props.store.doc.value?.blocks.find(x => x.type === type && x.tier === tier && !x.disabled)
  return b?.actions ?? []
}

function icon (m: { type: string, base: string }): string | null {
  const g = ECONOMY_GROUPS.find(x => x.type === m.type)
  if (!g || g.unique) return null
  return ninjaIcon(g.ninja[0], m.base)
}

function caught (v: BaseVerdict): boolean {
  return props.config.safetyNet.on && v.chaos >= props.config.safetyNet.minChaos
}

function apply () {
  const list = pickedMoves.value
  const undo = props.store.applyPrices(list)
  toast(`Moved ${list.length} item${list.length > 1 ? 's' : ''} to match today's prices`, { anchor: props.anchor, undo })
}

function keepAll () {
  const undos = moves.value.map(m => props.store.lockItem(m.type, m.base))
  toast(`Kept ${undos.length} items where they are`, { anchor: props.anchor, undo: () => undos.forEach(u => u()) })
}

function reset () {
  const undo = props.store.resetPrices()
  toast('Price groups are back on NeverSink\'s tiers', { anchor: props.anchor, undo })
}

function moveMenu (e: MouseEvent, m: PriceMove) {
  openMenu(e, [
    { label: `Move ${m.base} to ${m.to}`, icon: 'fas fa-exchange-alt', action: () => { const undo = props.store.applyPrices([m]); toast(`Moved ${m.base} to ${m.to}`, { anchor: props.anchor, undo }) } },
    { label: 'Keep it where it is', icon: 'fas fa-lock', action: () => { const undo = props.store.lockItem(m.type, m.base); toast(`${m.base} stays in ${m.from}`, { anchor: props.anchor, undo }) } }
  ])
}

// Own rule for the base: shown, in the safety net's look.
function showIt (v: BaseVerdict) {
  const b = v.block
  if (!b?.type || !b.tier) return
  const undo = props.store.editWithUndo({ kind: 'item', type: b.type, tier: b.tier, base: v.base, visibility: 'Show', patch: v.state === 'hidden' ? SAFETY_LOOK : { fontSize: 40 }, anchor: conditionSignature(b), pin: true })
  toast(`${v.base} now shows`, { anchor: props.anchor, undo })
}
</script>

<style module>
.wrap {
  max-height: min(36rem, 70vh);
  padding: 6px 0 10px;
  display: flex;
  flex-direction: column;
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px var(--w-pad) 8px;
  border-bottom: 1px solid var(--w-line-soft);
}
.label {
  padding: 10px var(--w-pad) 4px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px var(--w-pad);
  border-bottom: 1px solid var(--w-line-soft);
  min-width: 0;
}
.check {
  width: 14px;
  flex: none;
  accent-color: var(--w-accent);
}
.art {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex: none;
}
.up { color: var(--w-up); }
.down { color: var(--w-down); }
.bad { color: var(--w-down); }
.actions {
  display: flex;
  gap: 8px;
  padding: 8px var(--w-pad);
}
.net {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px var(--w-pad) 0;
  padding: 8px 10px;
  background: var(--w-panel-2);
  border-radius: var(--w-r-sm);
}
</style>
