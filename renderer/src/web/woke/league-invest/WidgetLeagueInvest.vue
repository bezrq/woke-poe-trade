<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="widget-default-style p-1 flex flex-col min-h-0 text-gray-100" style="width: 34rem; max-height: 80vh;">
      <div class="p-1 flex items-center gap-2">
        <span class="truncate grow">{{ config.wmTitle || 'League investments' }}</span>
        <button :class="[$style.tab, { [$style.tabActive]: showData }]" @click="showData = !showData">
          Past leagues ({{ histories.length }})
        </button>
      </div>

      <div v-if="showData || !histories.length" class="px-1 pb-2 text-sm">
        <div class="text-gray-400 pb-1">
          Import poe.ninja league dumps from
          <a href="https://poe.ninja/poe1/data" target="_blank" class="underline">poe.ninja/poe1/data</a>
          (the .zip, or the &lt;League&gt;.items.csv and .currency.csv files). Only challenge softcore leagues are kept.
        </div>
        <div class="flex items-center gap-2 pb-1">
          <button :class="$style.btn" :disabled="importing" @click="fileInput?.click()">
            {{ importing ? 'Importing…' : 'Import files' }}
          </button>
          <span v-if="importMsg" class="text-xs" :class="importError ? 'text-red-400' : 'text-gray-400'">{{ importMsg }}</span>
          <input ref="fileInput" type="file" multiple accept=".zip,.csv" class="hidden" @change="onFiles">
        </div>
        <div v-for="h in histories" :key="h.league" :class="$style.row">
          <span class="grow">{{ h.league }}</span>
          <span class="text-gray-500 text-xs">from {{ h.start }} · {{ h.days }} days · {{ h.items.length }} items</span>
          <button class="text-gray-500 hover:text-red-400 px-1" title="Remove" @click="remove(h.league)"><i class="fas fa-times" /></button>
        </div>
      </div>

      <div class="flex flex-wrap gap-x-2 gap-y-1 px-1 pb-1 items-center text-sm">
        <label class="flex items-center gap-1 text-gray-400">
          budget <input v-model.number="config.budgetDiv" type="number" min="0" step="0.5" class="bg-gray-900 rounded px-1 w-14 leading-6"> div
        </label>
        <label class="flex items-center gap-1 text-gray-400">
          over <input v-model.number="config.slots" type="number" min="1" max="20" class="bg-gray-900 rounded px-1 w-10 leading-6"> items
        </label>
        <select v-model.number="config.horizon" class="bg-gray-900 rounded px-1 leading-6" title="How long to hold">
          <option :value="3">hold 3 days</option>
          <option :value="7">hold 7 days</option>
          <option :value="14">hold 14 days</option>
        </select>
        <label class="flex items-center gap-1 text-gray-400" title="Only items sold in bulk at one price (currency, fragments, scarabs, cards…)">
          <input v-model="config.bulkOnly" type="checkbox"> bulk only
        </label>
      </div>
      <div class="px-1 pb-1 text-xs text-gray-500 flex items-center gap-1 flex-wrap">
        <span>{{ league || 'No league selected' }} ·</span>
        <span>day</span>
        <input :value="day ?? ''" type="number" min="0" class="bg-gray-900 rounded px-1 w-10"
          title="League day (0 = launch day). Clear to use the start date." @change="onDayInput">
        <span v-if="config.dayOverride == null && start">(started {{ start }})</span>
        <span v-else-if="config.dayOverride == null" class="text-yellow-500">start date unknown, enter the day</span>
        <button v-else class="underline" @click="config.dayOverride = null">use start date</button>
        <span v-if="snapshot?.divine">· 1 div = {{ Math.round(snapshot.divine) }} c</span>
      </div>

      <div class="overflow-y-auto min-h-0 px-1">
        <div v-if="note" class="text-gray-500 p-2 text-center">{{ note }}</div>
        <template v-else>
          <div v-if="plan.length" class="pb-2">
            <div class="text-xs uppercase text-gray-500 pt-1">Suggested split</div>
            <div v-for="line in plan" :key="key(line.opportunity)" :class="$style.row">
              <span class="truncate grow">{{ line.qty }}× {{ label(line.opportunity) }}</span>
              <span class="whitespace-nowrap text-gray-400">{{ fmt(line.cost) }}</span>
              <span class="whitespace-nowrap w-20 text-right text-green-400" title="Typical value at the end of the hold, in today's divines">≈ {{ fmtDiv(divOf(line.cost) * line.opportunity.median) }}</span>
            </div>
            <div class="flex text-sm pt-1">
              <span class="grow text-gray-400">Spend {{ fmt(planCost) }} · typical result</span>
              <span class="text-green-400">{{ fmtDiv(planExpected) }}</span>
            </div>
          </div>

          <div class="text-xs uppercase text-gray-500 pt-1">
            Rose most reliably from day {{ day }} to day {{ (day ?? 0) + config.horizon }}
          </div>
          <div v-for="r in rows" :key="key(r.opportunity)" :class="$style.row">
            <span class="truncate grow" :title="r.opportunity.type">
              {{ label(r.opportunity) }}
              <span class="text-gray-600 text-xs"> {{ r.opportunity.type }}</span>
            </span>
            <span class="whitespace-nowrap w-16 text-right" title="Price now">{{ r.chaos != null ? fmt(r.chaos) : '—' }}</span>
            <span class="whitespace-nowrap w-14 text-right text-green-400" title="Median rise in divines across past leagues">×{{ r.opportunity.median.toFixed(r.opportunity.median >= 10 ? 0 : 1) }}</span>
            <span class="whitespace-nowrap w-12 text-right text-gray-400" title="Leagues where it rose ≥10% / leagues with data">{{ hits(r.opportunity) }}/{{ r.opportunity.leagues.length }}</span>
            <span class="whitespace-nowrap w-10 text-right text-gray-500" title="Share of days it went up">{{ Math.round(r.opportunity.upDays * 100) }}%</span>
          </div>
          <div class="text-xs text-gray-600 py-1">
            Past patterns break when a patch changes drops. Prices are poe.ninja listings, not sales.
          </div>
        </template>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { LEAGUE_INVEST_TYPE } from './widget'

export default {
  widget: {
    type: LEAGUE_INVEST_TYPE,
    instances: 'multi',
    trNameKey: 'League investments'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { useLeagues } from '@/web/background/Leagues'
import { useMarketCollector } from '../market/collector'
import { latestSnapshots } from '../market/db'
import { formatChaos } from '../market/analysis'
import { itemKey } from '../market/types'
import type { Snapshot } from '../market/types'
import { DumpImporter } from './dumps'
import type { LeagueHistory } from './dumps'
import { opportunityKey, planBudget, rankOpportunities } from './invest'
import type { Opportunity } from './invest'
import { deleteLeague, loadLeagues, saveLeague } from './store'
import { leagueDay, leagueStartDates } from './league-start'
import { readZip } from './zip'
import type { LeagueInvestWidget } from './widget'

const props = defineProps<{
  config: LeagueInvestWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'League investments'
  props.config.anchor = { pos: 'tl', x: 50, y: 20 }
  props.config.budgetDiv = 5
  props.config.slots = 5
  props.config.horizon = 7
  props.config.bulkOnly = false
  props.config.minMultiple = 1.2
  props.config.leagueStart = ''
  props.config.dayOverride = null
  wm.show(props.config.wmId)
}

const collector = useMarketCollector()
const leagues = useLeagues()
const league = computed(() => leagues.selectedId.value)

const histories = shallowRef<LeagueHistory[]>([])
const snapshot = shallowRef<Snapshot | null>(null)
const apiStart = shallowRef<string | null>(null)
const showData = shallowRef(false)
const importing = shallowRef(false)
const importMsg = shallowRef('')
const importError = shallowRef(false)
const fileInput = shallowRef<HTMLInputElement | null>(null)

async function reloadHistories () {
  try { histories.value = await loadLeagues() } catch { histories.value = [] }
}
reloadHistories()

watch([league, collector.revision], async () => {
  if (!league.value) { snapshot.value = null; return }
  try {
    const [snap] = await latestSnapshots(league.value, 1)
    snapshot.value = snap ?? null
  } catch { snapshot.value = null }
}, { immediate: true })

watch(league, async (id) => {
  apiStart.value = null
  if (!id) return
  try { apiStart.value = (await leagueStartDates()).get(id) ?? null } catch {}
}, { immediate: true })

const start = computed(() => props.config.leagueStart || apiStart.value)
const day = computed<number | null>(() => {
  if (props.config.dayOverride != null) return props.config.dayOverride
  return start.value ? Math.max(0, leagueDay(start.value)) : null
})

function onDayInput (e: Event) {
  const v = (e.target as HTMLInputElement).value.trim()
  props.config.dayOverride = v === '' ? null : Math.max(0, Math.floor(Number(v)))
}

// Live prices: exact item match, or by name for currency-like items
// (the dump lumps fragments etc. under "Currency").
const live = computed(() => {
  const exact = new Map<string, number>()
  const byName = new Map<string, number>()
  for (const i of snapshot.value?.items ?? []) {
    exact.set(itemKey(i), i.chaos)
    if (!i.variant && !byName.has(i.name)) byName.set(i.name, i.chaos)
  }
  return { exact, byName }
})

function livePrice (o: Opportunity): number | null {
  if (o.links) return null
  const exact = live.value.exact.get(itemKey(o))
  if (exact != null) return exact
  if (o.type === 'Currency' && !o.variant) return live.value.byName.get(o.name) ?? null
  return null
}

const ranked = computed(() => {
  if (day.value == null || !histories.value.length) return []
  return rankOpportunities(histories.value, {
    day: day.value,
    horizon: props.config.horizon,
    minLeagues: Math.min(2, histories.value.length),
    minMultiple: props.config.minMultiple || 1.2,
    minReliability: 0.5,
    minBuyChaos: 5,
    bulkOnly: props.config.bulkOnly
  }).map(opportunity => ({ opportunity, chaos: livePrice(opportunity) }))
})

const rows = computed(() => ranked.value.slice(0, 60))

const plan = computed(() => {
  const divine = snapshot.value?.divine
  if (!divine) return []
  return planBudget(ranked.value, (props.config.budgetDiv || 0) * divine, Math.max(1, props.config.slots || 1))
})
const planCost = computed(() => plan.value.reduce((s, l) => s + l.cost, 0))
const planExpected = computed(() => plan.value.reduce((s, l) => s + divOf(l.cost) * l.opportunity.median, 0))

const note = computed(() => {
  if (!histories.value.length) return 'Import at least one past league to get started (two or more give much better results).'
  if (day.value == null) return 'Enter the league day above.'
  const maxDay = Math.max(...histories.value.map(h => h.days - 1))
  if (day.value + props.config.horizon > maxDay) {
    return `The imported leagues only cover up to day ${maxDay}. Try a shorter hold.`
  }
  if (!ranked.value.length) return 'Nothing in the imported leagues rose reliably over this stretch.'
  return ''
})

async function onFiles (e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importing.value = true
  importError.value = false
  importMsg.value = 'Reading files…'
  try {
    const importer = new DumpImporter()
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        for (const entry of readZip(await file.arrayBuffer())) {
          if (isWantedCsv(entry.name)) importer.addCsv(await entry.text())
        }
      } else if (isWantedCsv(file.name)) {
        importer.addCsv(await file.text())
      }
    }
    const names = importer.leagues()
    if (!names.length) throw new Error('No challenge league data found in these files.')
    for (const name of names) {
      importMsg.value = `Processing ${name}…`
      await saveLeague(importer.build(name))
    }
    importMsg.value = `Imported ${names.join(', ')}.`
    await reloadHistories()
  } catch (err) {
    importError.value = true
    importMsg.value = (err as Error).message
  } finally {
    importing.value = false
  }
}

// Skip permanent, hardcore, Ruthless and SSF variants of a league.
function isWantedCsv (path: string): boolean {
  const name = path.split('/').pop() ?? path
  if (!/\.(items|currency)\.csv$/i.test(name)) return false
  return !/^(Standard|Hardcore|HC |Ruthless|SSF)/i.test(name)
}

async function remove (name: string) {
  await deleteLeague(name)
  await reloadHistories()
}

function key (o: Opportunity) { return opportunityKey(o) }
function hits (o: Opportunity) { return o.multiples.filter(m => m >= 1.1).length }
function label (o: Opportunity) {
  return [o.name, o.variant, o.links].filter(Boolean).join(' ')
}
function divOf (chaos: number) { return chaos / (snapshot.value?.divine || 1) }
function fmt (chaos: number) { return formatChaos(chaos, snapshot.value?.divine ?? null) }
function fmtDiv (div: number) { return `${div.toFixed(div >= 10 ? 0 : 1)} div` }
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

.btn {
  @apply rounded px-2 bg-gray-700 text-gray-100;

  &:hover {
    @apply bg-gray-600;
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @apply py-0.5 border-b border-gray-800;
}
</style>
