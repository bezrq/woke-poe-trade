<template>
  <div :class="[$style.row, { [$style.open]: expanded, [$style.closed]: offer.closed }]" :data-offer="offer.who">
    <button type="button" :class="$style.line" :aria-expanded="expanded" @click="$emit('expand')">
      <span :class="$style.who" class="w-trunc">{{ offer.who }}</span>
      <span v-if="offer.closed === 'done'" :class="[$style.chip, $style.up]">traded</span>
      <span v-else-if="offer.closed" :class="$style.chip">{{ offer.closed }}</span>
      <span v-else-if="offer.traded" :class="[$style.chip, $style.up]">traded</span>
      <span v-else-if="offer.inArea" :class="[$style.chip, $style.up]">{{ offer.dir === 'sell' ? 'in your hideout' : 'with you' }}</span>
      <span v-else-if="offer.offline" :class="[$style.chip, $style.down]">offline</span>
      <span v-if="offer.repeats" :class="$style.chip" :title="`Whispered ${offer.repeats + 1} times`">×{{ offer.repeats + 1 }}</span>
      <span class="w-faint w-num ml-auto whitespace-nowrap">{{ age }}</span>
    </button>
    <div :class="$style.item">
      <img v-if="art && !artFailed" :src="art" alt="" :class="$style.art" @error="artFailed = true">
      <span class="w-trunc">{{ label }}</span>
      <span class="ml-auto w-num whitespace-nowrap" :class="offer.dir === 'sell' ? 'w-accent' : ''">{{ price }}</span>
      <span v-if="delta != null && Math.abs(delta) >= 0.03" class="w-num text-xs whitespace-nowrap" :class="delta < 0 ? 'w-down' : 'w-up'"
        :title="`${delta < 0 ? 'Under' : 'Over'} poe.ninja's value for the same items`">{{ delta > 0 ? '+' : '−' }}{{ Math.round(Math.abs(delta) * 100) }}%</span>
    </div>
    <template v-if="expanded && !offer.closed">
      <div v-if="offer.tab" :class="$style.tab">
        <span :class="$style.grid" :style="{ '--n': gridSize }" aria-hidden="true">
          <i v-for="c in gridSize * gridSize" :key="c" :class="{ [$style.on]: c === cell }" />
        </span>
        <span class="w-dim">Tab <b style="color: var(--w-fg);">"{{ offer.tab.name }}"</b><br>left {{ offer.tab.left }}, top {{ offer.tab.top }}</span>
        <span v-if="value" class="ml-auto w-faint w-num text-xs whitespace-nowrap" title="Today's poe.ninja value of the price">≈ {{ value }}</span>
      </div>
      <div v-else-if="value" class="w-faint w-num text-xs" title="Today's poe.ninja value of the price">≈ {{ value }}</div>
      <div v-if="offer.note" class="w-dim text-xs w-trunc" :title="offer.note">"{{ offer.note }}"</div>
      <div v-for="(m, i) in offer.messages" :key="i" class="w-dim text-xs w-trunc" :title="m">› {{ m }}</div>
      <div :class="$style.btns">
        <button v-for="b in buttons" :key="b.id" type="button" :class="[$style.btn, { [$style.primary]: b.primary }]"
          :title="b.title" :data-reply="b.id" @click="$emit('reply', b.id)">
          {{ b.label }}<WKbd v-if="b.primary && stepKey" :keys="stepKey" :class="$style.kbd" />
        </button>
        <span class="ml-auto" />
        <button type="button" :class="$style.btn" :title="offer.dir === 'sell' ? 'Log it as sold without a trade window seen' : 'Log it as bought'"
          data-reply="traded" @click="$emit('traded')"><i class="fas fa-check" /></button>
        <button type="button" :class="$style.btn" title="Remove this offer" data-reply="dismiss" @click="$emit('dismiss')"><i class="fas fa-times" /></button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { WKbd } from '../ui'
import { nextStep, stepsOf } from './book'
import type { Offer, StepId } from './book'
import type { ReplyId } from './widget'
import { offerLabel, priceLabel } from './whispers'

const props = defineProps<{
  offer: Offer
  expanded: boolean
  now: number
  stepKey?: string | null
  // "120 div" from today's prices, when it says more than the price itself.
  value?: string | null
  delta?: number | null
  art?: string | null
}>()

defineEmits<{
  (e: 'expand' | 'traded' | 'dismiss'): void
  (e: 'reply', id: ReplyId): void
}>()

const STEP_LABELS: Record<StepId, string> = {
  invite: 'Invite',
  trade: 'Trade',
  thanks: 'Thanks',
  kick: 'Kick',
  hideout: 'Hideout'
}

const artFailed = shallowRef(false)
const label = computed(() => offerLabel(props.offer))
const price = computed(() => priceLabel(props.offer.price))

const age = computed(() => {
  const s = Math.max(0, Math.floor((props.now - props.offer.at) / 1000))
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return `${Math.floor(s / 3600)}h`
})

// 12×12 tabs; quad tabs (up to 24) get a finer grid.
const gridSize = computed(() => {
  const t = props.offer.tab
  return t && (t.left > 12 || t.top > 12) ? 24 : 12
})
const cell = computed(() => {
  const t = props.offer.tab
  if (!t) return -1
  return (t.top - 1) * gridSize.value + t.left
})

const buttons = computed(() => {
  const o = props.offer
  const next = nextStep(o)
  const out: Array<{ id: ReplyId, label: string, primary: boolean, title?: string }> =
    stepsOf(o).map(id => ({ id, label: STEP_LABELS[id], primary: id === next }))
  if (o.dir === 'sell') {
    out.push({ id: 'busy', label: 'Busy', primary: false, title: 'Tell them you will invite soon' })
    out.push({ id: 'still', label: 'Still?', primary: false, title: 'Ask if they still want it' })
    out.push({ id: 'sold', label: 'Sold', primary: false, title: 'Tell them it is sold, and remove the offer' })
  } else {
    out.push({ id: 'again', label: 'Again', primary: false, title: 'Send your whisper again' })
  }
  return out
})
</script>

<style module>
.row { display: flex; flex-direction: column; gap: 2px; padding: 5px var(--w-pad); border-top: 1px solid var(--w-line); }
.row:first-child { border-top: 0; }
.closed { opacity: .55; }
.line { display: flex; align-items: center; gap: 6px; min-width: 0; text-align: left; background: none; border: 0; padding: 0; color: inherit; font: inherit; cursor: pointer; }
.line:focus-visible { outline: 2px solid var(--w-accent); outline-offset: 1px; }
.who { font-weight: 600; }
.chip { font-size: calc(10.5px * var(--w-text-scale, 1)); line-height: calc(14px * var(--w-text-scale, 1)); border-radius: 999px; padding: 0 6px; border: 1px solid var(--w-line-strong, var(--w-line)); color: var(--w-dim); white-space: nowrap; }
.up { color: var(--w-up); border-color: color-mix(in srgb, var(--w-up) 45%, transparent); }
.down { color: var(--w-down); border-color: color-mix(in srgb, var(--w-down) 45%, transparent); }
.item { display: flex; align-items: center; gap: 6px; min-width: 0; }
.art { width: 18px; height: 18px; object-fit: contain; flex: none; }
.tab { display: flex; align-items: center; gap: 8px; font-size: calc(11.5px * var(--w-text-scale, 1)); line-height: 1.35; padding-top: 2px; }
.grid { --n: 12; display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 1px; width: 49px; height: 49px; flex: none; }
.grid i { background: color-mix(in srgb, var(--w-fg) 9%, transparent); border-radius: 0.5px; }
.grid i.on { background: var(--w-accent); box-shadow: 0 0 4px var(--w-accent); }
.btns { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding-top: 4px; }
.btn { display: inline-flex; align-items: center; gap: 4px; font-size: calc(11.5px * var(--w-text-scale, 1)); line-height: calc(20px * var(--w-text-scale, 1)); padding: 0 8px; border-radius: var(--w-r-sm, 3px);
  border: 1px solid var(--w-line-strong, var(--w-line)); background: color-mix(in srgb, var(--w-fg) 5%, transparent); color: var(--w-fg); cursor: pointer; white-space: nowrap; }
.btn:hover { background: color-mix(in srgb, var(--w-fg) 12%, transparent); }
.btn:focus-visible { outline: 2px solid var(--w-accent); outline-offset: 1px; }
.primary { border-color: var(--w-accent); color: var(--w-accent); }
.kbd { margin-left: 2px; }
</style>
