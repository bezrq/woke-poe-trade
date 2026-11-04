<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="widget-default-style p-1 flex flex-col min-h-0 text-gray-100" style="width: 30rem; max-height: 75vh;">
      <div class="p-1 flex items-center gap-2">
        <span class="truncate grow">{{ config.wmTitle || 'Lab gems' }}</span>
        <button :class="[$style.tab, { [$style.tabActive]: config.view === 'color' }]" @click="config.view = 'color'">Colour roll</button>
        <button :class="[$style.tab, { [$style.tabActive]: config.view === 'specific' }]" @click="config.view = 'specific'">Specific gem</button>
      </div>
      <div class="flex gap-1 px-1 pb-1 items-center text-sm">
        <select v-model="config.gemState" class="bg-gray-900 rounded px-1 leading-6" title="Gem level / quality">
          <option v-for="s in GEM_STATES" :key="s" :value="s">{{ stateLabel(s) }}</option>
        </select>
        <template v-if="config.view === 'color'">
          <select v-model.number="config.topN" class="bg-gray-900 rounded px-1 leading-6">
            <option :value="3">Top 3</option>
            <option :value="5">Top 5</option>
            <option :value="8">Top 8</option>
          </select>
        </template>
        <template v-else>
          <select v-model="config.specificMode" class="bg-gray-900 rounded px-1 leading-6"
            title="Whether the font lets you choose the transfigured version or gives a random one">
            <option value="choose">I choose the version</option>
            <option value="random">Random version</option>
          </select>
          <label class="flex items-center gap-1 text-gray-400 whitespace-nowrap">
            profit ≥ <input v-model.number="config.minProfit" type="number" min="0" class="bg-gray-900 rounded px-1 w-14 leading-6"> c
          </label>
        </template>
      </div>
      <div class="px-1 pb-1 text-xs text-gray-500">
        <template v-if="snapshot">
          {{ snapshot.league }} · {{ priceCount }} gem prices · updated {{ ago(snapshot.ts) }}
        </template>
        <template v-else>Waiting for poe.ninja prices (open the Market tracker once, or price check anything)…</template>
      </div>

      <div v-if="config.view === 'color'" class="overflow-y-auto min-h-0 px-1">
        <div v-for="roll in rolls" :key="roll.color" class="pb-2">
          <div :class="$style.row">
            <span :class="[$style.dot, $style[roll.color]]" />
            <span class="grow">{{ COLOR_NAMES[roll.color] }} pool</span>
            <span class="text-gray-500 text-xs whitespace-nowrap">{{ roll.listed }}/{{ roll.poolSize }} priced · each gem {{ pct(roll.chanceEach) }}</span>
            <span class="whitespace-nowrap w-20 text-right" title="Expected value of the best of the 3 offered gems">EV {{ fmt(roll.ev) }}</span>
          </div>
          <div v-for="g in roll.top" :key="g.name" :class="[$style.row, 'pl-4 text-sm']">
            <span class="truncate grow">{{ g.name }}</span>
            <span class="whitespace-nowrap w-20 text-right">{{ fmt(g.chaos ?? 0) }}</span>
          </div>
        </div>
        <div class="text-xs text-gray-500 pb-1">
          The font shows 3 random transfigured gems of the colour you insert and you take one.
          EV assumes you take the most valuable; unpriced gems count as 0.
        </div>
      </div>

      <div v-else class="overflow-y-auto min-h-0 px-1">
        <div v-if="!picks.length" class="text-gray-500 p-2 text-center">No gems match.</div>
        <div v-for="p in picks" :key="p.baseName" class="pb-1">
          <div :class="$style.row">
            <span :class="[$style.dot, $style[p.color]]" />
            <button class="truncate grow text-left" @click="toggle(p.baseName)">{{ p.baseName }}</button>
            <span class="text-gray-500 text-sm whitespace-nowrap" title="Base gem price">{{ p.baseChaos != null ? fmt(p.baseChaos) : '?' }} →</span>
            <span class="whitespace-nowrap w-16 text-right">{{ fmt(value(p)) }}</span>
            <span class="whitespace-nowrap w-16 text-right text-green-400" title="Profit after buying the base gem">+{{ fmt(profit(p)) }}</span>
          </div>
          <template v-if="expanded === p.baseName">
            <div v-for="v in p.variants" :key="v.name" :class="[$style.row, 'pl-4 text-sm text-gray-400']">
              <span class="truncate grow">{{ v.name }}</span>
              <span class="whitespace-nowrap w-16 text-right">{{ v.chaos != null ? fmt(v.chaos) : '—' }}</span>
            </div>
          </template>
        </div>
      </div>
      <div class="px-1 pt-1 text-xs text-gray-600">Maths from GemCheck (MIT). Prices are poe.ninja listings, uncorrupted only.</div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { LAB_GEMS_TYPE } from './widget'

export default {
  widget: {
    type: LAB_GEMS_TYPE,
    instances: 'multi',
    trNameKey: 'Lab gems'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch, onUnmounted } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { useLeagues } from '@/web/background/Leagues'
import { useMarketCollector } from '../market/collector'
import { latestSnapshots } from '../market/db'
import { formatChaos } from '../market/analysis'
import type { Snapshot } from '../market/types'
import { GEM_STATES, colorRolls, gemPrices, pickProfit, pickValue, specificPicks } from './font'
import type { GemColor, GemState, SpecificPick } from './font'
import type { LabGemsWidget } from './widget'

const props = defineProps<{
  config: LabGemsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Lab gems'
  props.config.anchor = { pos: 'tl', x: 45, y: 20 }
  props.config.view = 'color'
  props.config.gemState = '20/20'
  props.config.specificMode = 'choose'
  props.config.topN = 5
  props.config.minProfit = 0
  wm.show(props.config.wmId)
}

const COLOR_NAMES: Record<GemColor, string> = { r: 'Red', g: 'Green', b: 'Blue' }

const collector = useMarketCollector()
const leagues = useLeagues()
const league = computed(() => leagues.selectedId.value)

const snapshot = shallowRef<Snapshot | null>(null)
const expanded = shallowRef<string | null>(null)
const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 60 * 1000)
onUnmounted(() => { clearInterval(clock) })

async function load () {
  if (!league.value) { snapshot.value = null; return }
  try {
    const [snap] = await latestSnapshots(league.value, 1)
    snapshot.value = snap ?? null
  } catch {
    snapshot.value = null
  }
}
watch([league, collector.revision], load, { immediate: true })

const prices = computed(() => snapshot.value ? gemPrices(snapshot.value.items, props.config.gemState) : new Map<string, number>())
const priceCount = computed(() => prices.value.size)
const rolls = computed(() => colorRolls(prices.value, props.config.topN || 5))
const picks = computed(() => {
  const mode = props.config.specificMode
  return specificPicks(prices.value)
    .filter(p => pickValue(p, mode) > 0 && pickProfit(p, mode) >= (props.config.minProfit || 0))
    .sort((a, b) => pickProfit(b, mode) - pickProfit(a, mode))
    .slice(0, 60)
})

function value (p: SpecificPick) { return pickValue(p, props.config.specificMode) }
function profit (p: SpecificPick) { return pickProfit(p, props.config.specificMode) }
function toggle (name: string) { expanded.value = expanded.value === name ? null : name }
function fmt (chaos: number) { return formatChaos(chaos, snapshot.value?.divine ?? null) }
function pct (p: number) { return `${(p * 100).toFixed(1)}%` }

function stateLabel (s: GemState) {
  const [level, quality] = s.split('/')
  return `Level ${level}${quality ? ` / ${quality}%` : ' / 0%'}`
}

function ago (ts: number) {
  const min = Math.max(0, Math.round((now.value - ts) / 60000))
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  return `${Math.round(min / 60)} h ago`
}
</script>

<style lang="postcss" module>
.tab {
  @apply rounded px-2 text-sm text-gray-400 bg-gray-800;

  &:hover {
    @apply bg-gray-700 text-gray-100;
  }
}

.tabActive {
  @apply bg-gray-600 text-gray-100;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @apply py-0.5 border-b border-gray-800;
}

.dot {
  @apply inline-block w-2 h-2 rounded-full shrink-0;
}

.r { @apply bg-red-500; }
.g { @apply bg-green-500; }
.b { @apply bg-blue-500; }
</style>
