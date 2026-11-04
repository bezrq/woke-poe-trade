<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="widget-default-style p-2 flex flex-col gap-2 min-h-0 text-gray-100" style="width: 26rem; max-height: 75vh;">
      <div class="flex items-center gap-2">
        <span class="truncate grow">{{ config.wmTitle || 'Farming profit' }}</span>
        <button v-for="t in tabs" :key="t.id" :class="[$style.tab, { [$style.tabActive]: tab === t.id }]" @click="tab = t.id">{{ t.label }}</button>
      </div>
      <div v-if="!prices.snapshot.value" class="text-yellow-500 text-sm">
        Prices come from the Market tracker. Add that widget and wait for its first snapshot.
      </div>

      <template v-if="tab === 'session'">
        <div class="flex gap-1 items-center">
          <input v-model="config.strategy" list="woke-farming-strategies" placeholder="Strategy (e.g. Breach + Legion)"
            class="bg-gray-900 rounded px-1 leading-6 grow min-w-0">
          <datalist id="woke-farming-strategies">
            <option v-for="name in strategyNames" :key="name" :value="name" />
          </datalist>
          <button v-if="!s" class="btn" @click="start">Start</button>
          <template v-else>
            <button class="btn" @click="toggle">{{ s.runningSince != null ? 'Pause' : 'Resume' }}</button>
            <button class="btn" @click="end" title="Save to history">End</button>
          </template>
        </div>

        <template v-if="s">
          <div class="grid gap-x-3 gap-y-0.5 text-sm" style="grid-template-columns: auto 1fr auto 1fr;">
            <span class="text-gray-400">Time</span><span>{{ formatHms(elapsed(s, now)) }}</span>
            <span class="text-gray-400">Maps</span>
            <span class="flex items-center gap-1">
              <button :class="$style.miniBtn" @click="s.maps = Math.max(0, s.maps - 1)">−</button>
              {{ s.maps }}
              <button :class="$style.miniBtn" @click="s.maps++">+</button>
            </span>
            <span class="text-gray-400">Spent</span><span>{{ fmt(t.cost) }}</span>
            <span class="text-gray-400">Loot</span><span>{{ fmt(t.loot) }}</span>
            <span class="text-gray-400">Profit</span>
            <span :class="t.profit >= 0 ? 'text-green-400' : 'text-red-400'">{{ fmt(t.profit) }}</span>
            <span class="text-gray-400">Per hour</span><span>{{ t.perHour != null ? fmt(t.perHour) : '—' }}</span>
            <span class="text-gray-400">Per map</span><span>{{ t.perMap != null ? fmt(t.perMap) : '—' }}</span>
            <span class="text-gray-400">Map cost</span><span>{{ fmt(t.costPerMap) }}</span>
          </div>
          <div v-if="t.missingPrices" class="text-xs text-yellow-500">{{ t.missingPrices }} item(s) have no price and count as 0.</div>
          <ui-checkbox v-model="config.autoCountMaps" class="text-sm">Count maps from Client.txt</ui-checkbox>

          <div class="relative">
            <input v-model="lootQuery" placeholder="Add loot… (e.g. Divine Orb)" class="bg-gray-900 rounded px-1 w-full leading-6">
            <div v-if="lootResults.length" :class="$style.dropdown">
              <button v-for="item in lootResults" :key="key(item)" @click="addLoot(item)" :class="$style.dropItem">
                {{ item.name }}<span v-if="item.variant" class="text-gray-500"> {{ item.variant }}</span>
                <span class="text-gray-500 text-xs"> · {{ fmt(item.chaos) }}</span>
              </button>
            </div>
          </div>
          <div class="overflow-y-auto min-h-0 flex flex-col">
            <div v-for="line in s.loot" :key="key(line)" :class="$style.row">
              <span class="truncate grow">{{ line.name }}<span v-if="line.variant" class="text-gray-500"> {{ line.variant }}</span></span>
              <button :class="$style.miniBtn" @click="changeQty(line, -1)">−</button>
              <span class="w-8 text-center">{{ line.qty }}</span>
              <button :class="$style.miniBtn" @click="changeQty(line, 1)">+</button>
              <span class="w-16 text-right text-gray-400">{{ linePrice(line) }}</span>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-400 pt-1">
              Other loot (chaos)
              <input v-model.number="s.extraChaos" type="number" min="0" class="bg-gray-900 rounded px-1 w-20 leading-6 text-gray-100">
            </label>
          </div>
        </template>
      </template>

      <template v-else-if="tab === 'costs'">
        <div class="text-gray-400 text-sm">What one map costs to run: map, scarabs, compasses, etc.</div>
        <div class="relative">
          <input v-model="costQuery" placeholder="Add an input…" class="bg-gray-900 rounded px-1 w-full leading-6">
          <div v-if="costResults.length" :class="$style.dropdown">
            <button v-for="item in costResults" :key="key(item)" @click="addCost(item)" :class="$style.dropItem">
              {{ item.name }}<span v-if="item.variant" class="text-gray-500"> {{ item.variant }}</span>
              <span class="text-gray-500 text-xs"> · {{ fmt(item.chaos) }}</span>
            </button>
          </div>
        </div>
        <div class="overflow-y-auto min-h-0">
          <div v-for="line in config.costs" :key="key(line)" :class="$style.row">
            <span class="truncate grow">{{ line.name }}<span v-if="line.variant" class="text-gray-500"> {{ line.variant }}</span></span>
            <input v-model.number="line.qty" type="number" min="0" step="1" class="bg-gray-900 rounded px-1 w-14 leading-6">
            <span class="w-16 text-right text-gray-400">{{ linePrice(line) }}</span>
            <button :class="$style.miniBtn" @click="removeCost(line)"><i class="fas fa-times" /></button>
          </div>
          <div class="text-sm pt-1">Per map: {{ fmt(costPerMap) }}</div>
        </div>
      </template>

      <template v-else>
        <div v-if="!config.history.length" class="text-gray-500 text-center p-2">Ended sessions show up here.</div>
        <div v-else class="overflow-y-auto min-h-0 text-sm">
          <div class="grid gap-x-2 text-gray-400" style="grid-template-columns: 1fr auto auto auto auto;">
            <span>Strategy</span><span>Maps</span><span>Hours</span><span>/hour</span><span>/map</span>
            <template v-for="row in stats" :key="row.strategy">
              <span class="truncate text-gray-100">{{ row.strategy }}</span>
              <span>{{ row.maps }}</span>
              <span>{{ row.hours.toFixed(1) }}</span>
              <span :class="row.perHour >= 0 ? 'text-green-400' : 'text-red-400'">{{ fmt(row.perHour) }}</span>
              <span>{{ fmt(row.perMap) }}</span>
            </template>
          </div>
          <button class="btn mt-2" @click="clearHistory">Clear history</button>
        </div>
      </template>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { FARMING_TYPE } from './farming'
import type { FarmingWidget } from './farming'

export default {
  widget: {
    type: FARMING_TYPE,
    instances: 'multi',
    trNameKey: 'Farming profit'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, onUnmounted } from 'vue'
import { Host } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import UiCheckbox from '@/web/ui/UiCheckbox.vue'
import { usePriceIndex } from '../market/price-index'
import { formatChaos } from '../market/analysis'
import { itemKey } from '../market/types'
import type { PriceItem } from '../market/types'
import { parseLogLine } from '../campaign/log-parse'
import { ATLAS_TYPE } from '../atlas/widget'
import type { AtlasWidget } from '../atlas/widget'
import { elapsed, formatHms, isMapArea, lineValue, newSession, strategyStats, totals } from './farming'
import type { CostLine, LootLine, PricedRef } from './farming'

const props = defineProps<{
  config: FarmingWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Farming profit'
  props.config.anchor = { pos: 'tl', x: 60, y: 30 }
  props.config.strategy = ''
  props.config.costs = []
  props.config.autoCountMaps = true
  props.config.session = null
  props.config.history = []
  wm.show(props.config.wmId)
}

const tabs = [
  { id: 'session', label: 'Session' },
  { id: 'costs', label: 'Map cost' },
  { id: 'history', label: 'History' }
] as const
const tab = shallowRef<'session' | 'costs' | 'history'>('session')

const prices = usePriceIndex()
const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => { clearInterval(clock) })

const s = computed(() => props.config.session)
const price = (r: PricedRef) => prices.price(r)
const t = computed(() => s.value
  ? totals(s.value, props.config.costs, price, now.value)
  : { costPerMap: 0, cost: 0, loot: 0, profit: 0, perHour: null, perMap: null, missingPrices: 0 })
const costPerMap = computed(() => lineValue(props.config.costs, price).total)
const stats = computed(() => strategyStats(props.config.history))

const strategyNames = computed(() => AppConfig().widgets
  .filter(w => w.wmType === ATLAS_TYPE)
  .flatMap(w => (w as AtlasWidget).strategies.map(st => st.name))
  .filter(Boolean))

const lootQuery = shallowRef('')
const costQuery = shallowRef('')
const lootResults = computed(() => prices.search(lootQuery.value))
const costResults = computed(() => prices.search(costQuery.value))

function key (r: PricedRef) { return itemKey(r) }

function fmt (chaos: number) {
  return formatChaos(chaos, prices.snapshot.value?.divine ?? null)
}

function linePrice (line: PricedRef & { qty: number }) {
  const p = price(line)
  return p == null ? 'no price' : fmt(p * line.qty)
}

function start () {
  props.config.session = newSession(props.config.strategy, Date.now())
}

function toggle () {
  const sess = props.config.session
  if (!sess) return
  if (sess.runningSince != null) {
    sess.elapsedMs += Date.now() - sess.runningSince
    sess.runningSince = null
  } else {
    sess.runningSince = Date.now()
  }
}

function end () {
  const sess = props.config.session
  if (!sess) return
  const nowTs = Date.now()
  const tt = totals(sess, props.config.costs, price, nowTs)
  if (sess.maps || sess.loot.length || sess.extraChaos) {
    props.config.history.push({
      strategy: sess.strategy || props.config.strategy,
      endedAt: nowTs,
      durationMs: elapsed(sess, nowTs),
      maps: sess.maps,
      costChaos: tt.cost,
      lootChaos: tt.loot,
      divine: prices.snapshot.value?.divine ?? null
    })
  }
  props.config.session = null
  tab.value = 'history'
}

function clearHistory () {
  props.config.history = []
}

function addLoot (item: PriceItem) {
  const sess = props.config.session
  if (!sess) return
  const k = itemKey(item)
  const line = sess.loot.find(l => itemKey(l) === k)
  if (line) line.qty++
  else sess.loot.push({ type: item.type, name: item.name, variant: item.variant, qty: 1 })
  lootQuery.value = ''
}

function changeQty (line: LootLine, delta: number) {
  const sess = props.config.session
  if (!sess) return
  line.qty += delta
  if (line.qty <= 0) sess.loot = sess.loot.filter(l => l !== line)
}

function addCost (item: PriceItem) {
  const k = itemKey(item)
  if (!props.config.costs.some(c => itemKey(c) === k)) {
    props.config.costs.push({ type: item.type, name: item.name, variant: item.variant, qty: 1 })
  }
  costQuery.value = ''
}

function removeCost (line: CostLine) {
  props.config.costs = props.config.costs.filter(c => c !== line)
}

// Count each newly generated map instance while a session is running.
const logListener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
  const sess = props.config.session
  if (!sess || sess.runningSince == null || !props.config.autoCountMaps) return
  for (const line of e.lines) {
    const ev = parseLogLine(line)
    if (ev?.kind === 'area' && isMapArea(ev.areaId)) sess.maps++
  }
})
onUnmounted(() => { logListener.abort() })
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
  gap: 0.25rem;
  @apply py-0.5 border-b border-gray-800;
}

.miniBtn {
  @apply rounded px-1.5 bg-gray-800 text-gray-400 leading-5;

  &:hover {
    @apply bg-gray-700 text-gray-100;
  }
}

.dropdown {
  @apply absolute left-0 right-0 bg-gray-800 rounded z-10 shadow;
}

.dropItem {
  @apply block w-full text-left px-2 py-1 truncate;

  &:hover {
    @apply bg-gray-700;
  }
}
</style>
