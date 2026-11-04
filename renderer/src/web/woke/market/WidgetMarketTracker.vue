<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="widget-default-style p-1 flex flex-col min-h-0 text-gray-100" style="width: 30rem; max-height: 75vh;">
      <div class="p-1 flex items-center gap-2">
        <span class="truncate grow">{{ config.wmTitle || 'Market tracker' }}</span>
        <button :class="[$style.tab, { [$style.tabActive]: config.view === 'movers' }]" @click="config.view = 'movers'">Movers</button>
        <button :class="[$style.tab, { [$style.tabActive]: config.view === 'watchlist' }]" @click="config.view = 'watchlist'">Watchlist</button>
      </div>
      <div class="px-1 pb-1 text-xs text-gray-500">
        <template v-if="latest">
          {{ latest.league }} · {{ latest.items.length }} items · updated {{ ago(latest.ts) }}
          <template v-if="latest.divine"> · 1 div = {{ Math.round(latest.divine) }} c</template>
        </template>
        <template v-else-if="league">Waiting for the first poe.ninja snapshot for {{ league }} (refreshes about every 30 min)…</template>
        <template v-else>Select a league in APT's price check settings to start collecting.</template>
        <span v-if="collector.lastError.value" class="text-red-400"> · {{ collector.lastError.value }}</span>
      </div>

      <template v-if="config.view === 'movers'">
        <div class="flex gap-1 px-1 pb-1 items-center">
          <select v-model="config.period" class="bg-gray-900 rounded px-1 leading-6">
            <option value="6h">6 hours</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>
          <select v-model="config.typeFilter" class="bg-gray-900 rounded px-1 leading-6 min-w-0">
            <option value="">All categories</option>
            <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
          </select>
          <label class="flex items-center gap-1 text-sm text-gray-400 whitespace-nowrap">
            min <input v-model.number="config.minChaos" type="number" min="0" class="bg-gray-900 rounded px-1 w-14 leading-6"> c
          </label>
        </div>
        <div class="overflow-y-auto min-h-0 px-1">
          <div v-if="moversNote" class="text-gray-500 p-2 text-center">{{ moversNote }}</div>
          <div v-for="m in movers" :key="key(m)" :class="$style.row">
            <button @click="toggleWatch(m)" :title="isWatched(m) ? 'Remove from watchlist' : 'Add to watchlist'"
              class="text-gray-500 hover:text-yellow-400 px-1">
              <i :class="isWatched(m) ? 'fas fa-star text-yellow-400' : 'far fa-star'" />
            </button>
            <span class="truncate grow" :title="m.type">{{ m.name }}<span v-if="m.variant" class="text-gray-500"> {{ m.variant }}</span></span>
            <span class="text-gray-500 text-sm whitespace-nowrap">{{ fmt(m.then) }} →</span>
            <span class="whitespace-nowrap w-16 text-right">{{ fmt(m.now) }}</span>
            <span class="whitespace-nowrap w-14 text-right" :class="m.change >= 0 ? 'text-green-400' : 'text-red-400'">{{ formatChange(m.change) }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="px-1 pb-1 relative">
          <input v-model="addQuery" placeholder="Add item to watchlist…" class="bg-gray-900 rounded px-1 w-full leading-6">
          <div v-if="addResults.length" class="absolute left-1 right-1 bg-gray-800 rounded z-10 shadow">
            <button v-for="item in addResults" :key="key(item)" @click="addWatch(item)"
              class="block w-full text-left px-2 py-1 hover:bg-gray-700 truncate">
              {{ item.name }}<span v-if="item.variant" class="text-gray-500"> {{ item.variant }}</span>
              <span class="text-gray-500 text-xs"> · {{ item.type }} · {{ fmt(item.chaos) }}</span>
            </button>
          </div>
        </div>
        <div class="overflow-y-auto min-h-0 px-1">
          <div v-if="!config.watchlist.length" class="text-gray-500 p-2 text-center">
            Star items in Movers or search above to watch them.
          </div>
          <div v-for="w in watchRows" :key="key(w.item)" :class="$style.row">
            <button @click="toggleWatch(w.item)" title="Remove from watchlist" class="px-1">
              <i class="fas fa-star text-yellow-400" />
            </button>
            <span class="truncate grow" :title="w.item.type">{{ w.item.name }}<span v-if="w.item.variant" class="text-gray-500"> {{ w.item.variant }}</span></span>
            <svg v-if="w.spark" width="64" height="18" class="shrink-0">
              <polyline :points="w.spark" fill="none" stroke="currentColor" stroke-width="1.25" class="text-gray-400" />
            </svg>
            <span class="whitespace-nowrap w-16 text-right">{{ w.now != null ? fmt(w.now) : '—' }}</span>
            <span class="whitespace-nowrap w-14 text-right"
              :class="w.change == null ? 'text-gray-500' : w.change >= 0 ? 'text-green-400' : 'text-red-400'"
              title="Change since yesterday">{{ w.change != null ? formatChange(w.change) : '—' }}</span>
          </div>
        </div>
      </template>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { MARKET_TRACKER_TYPE } from './widget'
import type { MarketTrackerWidget } from './widget'

export default {
  widget: {
    type: MARKET_TRACKER_TYPE,
    instances: 'multi',
    trNameKey: 'Market tracker'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch, onUnmounted } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { useLeagues } from '@/web/background/Leagues'
import { useMarketCollector } from './collector'
import { dailyHistory, dailyRowsForDate, latestSnapshots, snapshotAtOrBefore } from './db'
import { computeMovers, formatChaos, formatChange, sparklinePoints } from './analysis'
import type { Mover } from './analysis'
import { itemKey, utcDate } from './types'
import type { PriceItem, Snapshot } from './types'
import { PERIOD_MS } from './widget'
import type { WatchedItem } from './widget'

const props = defineProps<{
  config: MarketTrackerWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Market tracker'
  props.config.anchor = { pos: 'tl', x: 40, y: 20 }
  props.config.view = 'movers'
  props.config.period = '24h'
  props.config.minChaos = 5
  props.config.typeFilter = ''
  props.config.watchlist = []
  wm.show(props.config.wmId)
}

const collector = useMarketCollector()
const leagues = useLeagues()
const league = computed(() => leagues.selectedId.value)

const latest = shallowRef<Snapshot | null>(null)
const movers = shallowRef<Mover[]>([])
const moversNote = shallowRef('')
const watchRows = shallowRef<Array<{ item: WatchedItem, now: number | null, change: number | null, spark: string }>>([])
const addQuery = shallowRef('')
const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 60 * 1000)
onUnmounted(() => { clearInterval(clock) })

const types = computed(() => Array.from(new Set(latest.value?.items.map(i => i.type) ?? [])).sort())

async function loadLatest () {
  if (!league.value) { latest.value = null; return }
  try {
    const [snap] = await latestSnapshots(league.value, 1)
    latest.value = snap ?? null
  } catch {
    latest.value = null
  }
}

async function loadMovers () {
  const snap = latest.value
  if (!snap) { movers.value = []; moversNote.value = ''; return }
  const from = snap.ts - PERIOD_MS[props.config.period]
  let then: PriceItem[] = []
  if (props.config.period === '7d') {
    then = await dailyRowsForDate(snap.league, utcDate(from))
  } else {
    then = (await snapshotAtOrBefore(snap.league, from))?.items ?? []
  }
  if (!then.length) {
    movers.value = []
    moversNote.value = `Not enough history yet for ${props.config.period}. Keep the app running and check back later.`
    return
  }
  moversNote.value = ''
  movers.value = computeMovers(snap.items, then, {
    minChaos: props.config.minChaos || 0,
    type: props.config.typeFilter || undefined,
    limit: 50
  })
  if (!movers.value.length) moversNote.value = 'No items match these filters.'
}

async function loadWatchlist () {
  const snap = latest.value
  if (!snap || !props.config.watchlist.length) { watchRows.value = []; return }
  const current = new Map(snap.items.map(i => [itemKey(i), i.chaos]))
  const yesterday = utcDate(snap.ts - PERIOD_MS['24h'])
  watchRows.value = await Promise.all(props.config.watchlist.map(async item => {
    const history = (await dailyHistory(snap.league, item)).slice(-14)
    const nowPrice = current.get(itemKey(item)) ?? null
    const prev = history.find(r => r.date === yesterday)?.chaos
    return {
      item,
      now: nowPrice,
      change: (nowPrice != null && prev) ? nowPrice / prev - 1 : null,
      spark: sparklinePoints(history.map(r => r.chaos), 64, 18)
    }
  }))
}

watch([league, collector.revision], loadLatest, { immediate: true })
watch([latest, () => props.config.period, () => props.config.minChaos, () => props.config.typeFilter],
  () => { loadMovers().catch(() => {}) })
watch([latest, () => props.config.watchlist.length], () => { loadWatchlist().catch(() => {}) })

const addResults = computed(() => {
  const q = addQuery.value.trim().toLowerCase()
  if (q.length < 2 || !latest.value) return []
  return latest.value.items
    .filter(i => i.name.toLowerCase().includes(q) && !isWatched(i))
    .slice(0, 8)
})

function key (item: { type: string, name: string, variant: string }) {
  return itemKey(item)
}

function isWatched (item: { type: string, name: string, variant: string }) {
  const k = itemKey(item)
  return props.config.watchlist.some(w => itemKey(w) === k)
}

function toggleWatch (item: { type: string, name: string, variant: string }) {
  const k = itemKey(item)
  if (isWatched(item)) {
    props.config.watchlist = props.config.watchlist.filter(w => itemKey(w) !== k)
  } else {
    props.config.watchlist.push({ type: item.type, name: item.name, variant: item.variant })
  }
}

function addWatch (item: PriceItem) {
  toggleWatch(item)
  addQuery.value = ''
}

function fmt (chaos: number) {
  return formatChaos(chaos, latest.value?.divine ?? null)
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
</style>
