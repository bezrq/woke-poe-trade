<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <WPanel :title="config.wmTitle || 'Market tracker'" width="30rem">
      <template #tabs>
        <WTabs v-model="config.view" :options="[
          { value: 'movers', label: 'Movers' },
          { value: 'watchlist', label: 'Watchlist', count: config.watchlist.length }
        ]" />
      </template>

      <template #toolbar>
        <template v-if="config.view === 'movers'">
          <WSegmented v-model="config.period" :options="[
            { value: '6h', label: '6h' }, { value: '24h', label: '24h' }, { value: '7d', label: '7d' }
          ]" />
          <WSelect v-model="config.typeFilter" :options="typeOptions" style="max-width: 11rem;" />
          <WField v-model="config.minChaos" type="number" suffix="c min" style="width: 7rem;" />
        </template>
        <div v-else class="relative grow">
          <WField v-model="addQuery" icon="fas fa-plus" placeholder="Add item to watchlist…" class="w-full" />
          <div v-if="addResults.length" class="w-surface absolute left-0 right-0 z-10 mt-1 py-1">
            <button v-for="item in addResults" :key="key(item)" @click="addWatch(item)"
              class="w-row w-full text-left" style="grid-template-columns: minmax(0,1fr) auto;">
              <span class="w-trunc">{{ item.name }}<span v-if="item.variant" class="w-dim ml-1">{{ item.variant }}</span>
                <span class="w-faint"> · {{ item.type }}</span></span>
              <WPrice :chaos="item.chaos" :divine="latest?.divine" />
            </button>
          </div>
        </div>
      </template>

      <template #meta>
        <template v-if="latest">
          <span>{{ latest.league }}</span><span class="w-faint">·</span>
          <span>{{ latest.items.length }} items</span><span class="w-faint">·</span>
          <span>updated {{ ago(latest.ts) }}</span>
          <template v-if="latest.divine"><span class="w-faint">·</span>
            <span class="inline-flex items-center gap-1"><img src="/images/divine.png" class="w-4 h-4"> = {{ Math.round(latest.divine) }}c</span>
          </template>
        </template>
        <span v-else-if="league">Waiting for the first poe.ninja snapshot for {{ league }} (refreshes about every 30 min)…</span>
        <span v-else>Select a league in APT's price check settings to start collecting.</span>
        <span v-if="collector.lastError.value" class="w-down">{{ collector.lastError.value }}</span>
      </template>

      <template v-if="config.view === 'movers'">
        <WEmpty v-if="moversNote" icon="fas fa-chart-line">{{ moversNote }}</WEmpty>
        <template v-else>
          <div class="w-row w-row--head" :class="$style.grid"><span /><span>Item</span><span>Then</span><span class="text-right">Now</span><span class="text-right">%</span></div>
          <div v-for="m in movers" :key="key(m)" class="w-row" :class="$style.grid">
            <button @click="toggleWatch(m)" :title="isWatched(m) ? 'Remove from watchlist' : 'Add to watchlist'"
              class="w-icon-btn" :class="{ 'w-icon-btn--on': isWatched(m) }">
              <i :class="isWatched(m) ? 'fas fa-star' : 'far fa-star'" />
            </button>
            <span class="w-trunc" :class="rarityClass(m.type)" :title="m.type">{{ m.name }}<span v-if="m.variant" class="w-dim ml-1">{{ m.variant }}</span></span>
            <WPrice :chaos="m.then" :divine="latest?.divine" :unit="unitFor(m)" class="w-dim" />
            <WPrice :chaos="m.now" :divine="latest?.divine" :unit="unitFor(m)" />
            <WDelta :value="m.change" class="text-right" />
          </div>
        </template>
      </template>

      <template v-else>
        <WEmpty v-if="!config.watchlist.length" icon="far fa-star">Star items in Movers or search above to watch them.</WEmpty>
        <div v-for="w in watchRows" :key="key(w.item)" class="w-row" :class="$style.grid">
          <button @click="toggleWatch(w.item)" title="Remove from watchlist" class="w-icon-btn w-icon-btn--on">
            <i class="fas fa-star" />
          </button>
          <span class="w-trunc" :class="rarityClass(w.item.type)" :title="w.item.type">{{ w.item.name }}<span v-if="w.item.variant" class="w-dim ml-1">{{ w.item.variant }}</span></span>
          <WSpark :values="w.history" />
          <WPrice :chaos="w.now" :divine="latest?.divine" />
          <WDelta :value="w.change" title="Change since yesterday" class="text-right" />
        </div>
      </template>

      <template #footer>
        <span>Prices from poe.ninja</span>
      </template>
    </WPanel>
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
import { computeMovers } from './analysis'
import { WPanel, WTabs, WSegmented, WSelect, WField, WPrice, WDelta, WSpark, WEmpty } from '../ui'
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
const watchRows = shallowRef<Array<{ item: WatchedItem, now: number | null, change: number | null, history: number[] }>>([])
const addQuery = shallowRef('')
const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 60 * 1000)
onUnmounted(() => { clearInterval(clock) })

const types = computed(() => Array.from(new Set(latest.value?.items.map(i => i.type) ?? [])).sort())
const typeOptions = computed(() => [{ value: '', label: 'All categories' }, ...types.value.map(t => ({ value: t, label: t }))])

// Same unit for both prices in a row; the Divine Orb itself stays in chaos.
function unitFor (m: { name: string, now: number }) {
  const div = latest.value?.divine
  return div && m.name !== 'Divine Orb' && m.now >= div ? 'div' : 'chaos'
}

// poe.ninja category -> PoE item colour
function rarityClass (type: string) {
  if (/^Unique/.test(type)) return 'w-rarity-unique'
  if (/Gem/.test(type)) return 'w-rarity-gem'
  if (type === 'DivinationCard') return 'w-rarity-divination'
  return 'w-rarity-currency'
}

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
      history: history.map(r => r.chaos)
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

function ago (ts: number) {
  const min = Math.max(0, Math.round((now.value - ts) / 60000))
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  return `${Math.round(min / 60)} h ago`
}
</script>

<style module>
.grid {
  grid-template-columns: 22px minmax(0, 1fr) 64px 72px 52px;
}
</style>
