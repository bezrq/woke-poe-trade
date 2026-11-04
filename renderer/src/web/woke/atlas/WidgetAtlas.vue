<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <!-- In the hideout, while you set up the map device: the strategy you picked. -->
    <DockItem id="atlas" icon="fas fa-globe" :title="selected?.name || 'Atlas strategy'" :show="!!selected && zone.kind === 'hideout'"
      :wm-id="config.wmId" card-width="21rem">
      <template #card>
        <div v-if="selected" style="padding: 4px var(--w-pad) 6px;" class="flex flex-col gap-0.5">
          <div v-for="(p, i) in pricedScarabs" :key="i" class="flex justify-between gap-2">
            <span class="w-trunc">{{ p.qty > 1 ? p.qty + '× ' : '' }}{{ p.name }}</span>
            <span v-if="p.item" class="w-num w-dim">{{ formatChaos(p.item.chaos * p.qty, prices.snapshot.value?.divine ?? null) }}</span>
          </div>
          <div v-if="scarabCost != null" class="flex justify-between w-num"><span class="w-dim">Scarabs per map</span>
            <span class="w-accent">{{ formatChaos(scarabCost, prices.snapshot.value?.divine ?? null) }}</span></div>
          <div v-if="selected.device.trim()" class="w-dim text-xs whitespace-pre-wrap">{{ selected.device.trim() }}</div>
          <div v-if="selected.regex" class="flex items-center gap-1 text-xs">
            <span class="w-dim">Map regex</span>
            <code class="w-trunc" style="font-family: var(--w-num);">{{ selected.regex }}</code>
            <button v-if="wm.active.value" class="w-icon-btn" title="Copy" @click="copy(selected.regex)"><i :class="copied ? 'fas fa-check' : 'far fa-copy'" /></button>
          </div>
        </div>
      </template>
    </DockItem>
    <div class="flex gap-2 min-h-0 items-start">
      <WPanel :title="config.wmTitle || 'Atlas strategies'" icon="map" width="17rem">
        <template #actions>
          <button class="w-icon-btn" :class="{ 'w-icon-btn--on': sortByProfit }" title="Best earning first (from Farming profit history)"
            @click="sortByProfit = !sortByProfit"><i class="fas fa-sort-amount-down" /></button>
          <button class="w-icon-btn" :class="{ 'w-icon-btn--on': pasteOpen }" title="Paste a strategy from a guide"
            @click="pasteOpen = !pasteOpen"><i class="fas fa-paste" /></button>
        </template>
        <template #toolbar>
          <div v-if="pasteOpen" class="flex flex-col gap-1 w-full">
            <textarea v-model="pasteText" rows="6" :class="$style.textarea"
              placeholder="Paste guide text: atlas tree link, scarab list, map device notes, regex…" />
            <div class="flex gap-1">
              <WButton size="sm" variant="primary" :disabled="!pasteText.trim()" @click="importPaste">Add strategy</WButton>
              <WButton size="sm" variant="ghost" @click="pasteOpen = false">Cancel</WButton>
            </div>
          </div>
          <WField v-else v-model="filter" icon="fas fa-search" placeholder="Filter strategies…" class="grow" />
        </template>
        <WListItem v-for="s in shown" :key="s.id" :active="config.selectedId === s.id" @select="config.selectedId = s.id">
          <span class="w-trunc">{{ s.name || 'Untitled' }}</span>
          <span v-if="earnings.get(s.name)" class="ml-auto w-num text-xs" :class="earnings.get(s.name)!.perHour >= 0 ? 'w-up' : 'w-down'"
            :title="`${earnings.get(s.name)!.hours.toFixed(1)} h farmed`">{{ fmt(earnings.get(s.name)!.perHour) }}/h</span>
          <template #sub>{{ [s.league, ...s.tags].filter(Boolean).join(' · ') }}</template>
        </WListItem>
        <WEmpty v-if="!config.strategies.length" icon="fas fa-map">
          No strategies yet. Paste one from a guide with the button above, or add them in settings.
        </WEmpty>
      </WPanel>

      <WPanel v-if="selected" :title="selected.name || 'Untitled'" width="26rem">
        <template v-if="treeLink || selected.regex" #toolbar>
          <WButton v-if="treeLink" :href="treeLink" size="sm" variant="primary" icon="fas fa-external-link-alt">Open atlas tree</WButton>
          <WButton v-if="selected.regex" size="sm" :icon="copied ? 'fas fa-check' : 'far fa-copy'" @click="copy(selected.regex)">{{ copied ? 'Copied' : 'Copy map regex' }}</WButton>
          <WButton v-if="selected.regex" size="sm" icon="fas fa-search" @click="pasteSearch(selected.regex)" title="Types it into the in-game search box">Search with regex</WButton>
        </template>

        <div class="flex flex-col gap-2 pb-2" style="padding-left: var(--w-pad); padding-right: var(--w-pad);">
          <div v-if="selected.scarabs.trim()">
            <div :class="$style.heading" class="flex items-center">
              <span>Scarabs</span>
              <span v-if="scarabCost != null" class="ml-auto normal-case tracking-normal w-accent">{{ fmt(scarabCost) }} per map</span>
            </div>
            <template v-if="pricedScarabs.length">
              <div v-for="(p, i) in pricedScarabs" :key="i" class="flex gap-2">
                <span class="w-num w-dim">{{ p.qty }}×</span>
                <span class="w-trunc" :title="p.item ? p.item.name : 'No poe.ninja match'">{{ p.item?.name ?? p.name }}</span>
                <span class="ml-auto w-num w-dim">{{ p.item ? fmt(p.item.chaos * p.qty) : '?' }}</span>
              </div>
            </template>
            <div v-else class="whitespace-pre-wrap">{{ selected.scarabs }}</div>
            <WButton v-if="farmingWidget && pricedScarabs.some(p => p.item)" size="sm" icon="fas fa-coins" class="mt-1" @click="useInFarming">
              {{ usedInFarming ? 'Set in Farming profit' : 'Use in Farming profit' }}
            </WButton>
          </div>
          <div v-if="earnings.get(selected.name)" class="w-dim text-xs">
            Your results: <span class="w-num" :class="earnings.get(selected.name)!.perHour >= 0 ? 'w-up' : 'w-down'">{{ fmt(earnings.get(selected.name)!.perHour) }}/h</span>,
            <span class="w-num">{{ fmt(earnings.get(selected.name)!.perMap) }}</span>/map over {{ earnings.get(selected.name)!.maps }} maps
          </div>
          <div v-if="selected.device.trim()">
            <div :class="$style.heading">Map device and crafting</div>
            <div class="whitespace-pre-wrap">{{ selected.device }}</div>
          </div>
          <div v-if="selected.notes.trim()">
            <div :class="$style.heading">Notes</div>
            <div class="whitespace-pre-wrap w-dim">{{ selected.notes }}</div>
          </div>

          <div>
            <div :class="$style.heading">What to allocate</div>
            <div v-if="!selected.treeUrl" class="w-faint">Add an atlas tree link in settings to see the allocation.</div>
            <div v-else-if="decodeError" class="w-down">{{ decodeError }}</div>
            <div v-else-if="atlasDataError && !atlasData" class="w-down">{{ atlasDataError }}</div>
            <div v-else-if="!atlasData" class="w-faint">Loading atlas tree data…</div>
            <template v-else-if="view">
              <div class="w-dim pb-1 text-xs">
                <span class="w-num">{{ view.total }}</span> points · <span class="w-num">{{ notableCount }}</span> notables and keystones · <span class="w-num">{{ view.small }}</span> small
                <span v-if="view.unknown"> · {{ view.unknown }} not in the tree data (outdated link or data)</span>
              </div>
              <div v-for="g in view.groups" :key="g.mechanic" :class="$style.group">
                <div class="w-accent text-xs">{{ g.mechanic }} <span class="w-faint">{{ g.nodes.length }}</span></div>
                <div class="flex flex-wrap gap-x-2">
                  <span v-for="n in g.nodes" :key="n.id" :title="n.stats.join('\n')"
                    :class="n.kind === 'keystone' ? 'font-semibold' : ''">{{ n.name }}</span>
                </div>
              </div>
            </template>
          </div>

          <div v-if="otherStrategies.length && view">
            <div :class="$style.heading">Compare with</div>
            <select v-model="compareId" :class="$style.select">
              <option :value="null">Choose a strategy…</option>
              <option v-for="s in otherStrategies" :key="s.id" :value="s.id">{{ s.name || 'Untitled' }}</option>
            </select>
            <div v-if="compareError" class="w-down">{{ compareError }}</div>
            <template v-else-if="diff">
              <div v-if="diff.added.length"><span class="w-up">Also allocate:</span> {{ diff.added.join(', ') }}</div>
              <div v-if="diff.removed.length"><span class="w-down">Refund:</span> {{ diff.removed.join(', ') }}</div>
              <div v-if="!diff.added.length && !diff.removed.length" class="w-faint">Same notables.</div>
              <div class="w-faint text-xs">Going from this strategy to the other; notables and keystones only.</div>
            </template>
          </div>
        </div>
      </WPanel>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { ATLAS_TYPE } from './widget'
import type { AtlasWidget } from './widget'

export default {
  widget: {
    type: ATLAS_TYPE,
    instances: 'multi',
    trNameKey: 'Atlas strategies'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WField, WButton, WEmpty, WListItem } from '../ui'
import { AppConfig } from '@/web/Config'
import { emptyStrategy, strategyMatches, useAtlasData } from './widget'
import { parseGuideText, parseScarabs, priceScarabs } from './guide'
import { usePriceIndex } from '../market/price-index'
import DockItem from '../dock/DockItem.vue'
import { useZone } from '../shared/zone'
import { formatChaos } from '../market/analysis'
import { FARMING_TYPE, strategyStats } from '../farming/farming'
import type { FarmingWidget } from '../farming/farming'
import { decodeTree, diffTrees, extractTreeCode, overview } from './tree'
import type { DecodedTree } from './tree'

const props = defineProps<{
  config: AtlasWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Atlas strategies'
  props.config.anchor = { pos: 'tl', x: 20, y: 15 }
  props.config.dataUrl = ''
  props.config.selectedId = null
  props.config.strategies = []
  wm.show(props.config.wmId)
}

const { atlasData, atlasDataError } = useAtlasData(props.config.dataUrl)

const filter = shallowRef('')
const compareId = shallowRef<number | null>(null)
const copied = shallowRef(false)

const pasteOpen = shallowRef(false)
const pasteText = shallowRef('')
const sortByProfit = shallowRef(false)
const usedInFarming = shallowRef(false)
const prices = usePriceIndex()

function fmt (chaos: number) { return formatChaos(chaos, prices.snapshot.value?.divine ?? null) }

// Results per strategy name from every Farming profit widget's history.
const farmingWidget = computed(() => AppConfig<FarmingWidget>(FARMING_TYPE))
const earnings = computed(() => {
  const history = AppConfig().widgets
    .filter(w => w.wmType === FARMING_TYPE)
    .flatMap(w => (w as FarmingWidget).history ?? [])
  return new Map(strategyStats(history).map(r => [r.strategy, r]))
})

const shown = computed(() => {
  const list = props.config.strategies.filter(s => strategyMatches(s, filter.value))
  if (!sortByProfit.value) return list
  const v = (name: string) => earnings.value.get(name)?.perHour ?? -Infinity
  return [...list].sort((a, b) => v(b.name) - v(a.name))
})

function importPaste () {
  const s = { ...emptyStrategy(props.config.strategies), ...parseGuideText(pasteText.value) }
  props.config.strategies.push(s)
  props.config.selectedId = s.id
  pasteText.value = ''
  pasteOpen.value = false
}
const zone = useZone()
const selected = computed(() => props.config.strategies.find(s => s.id === props.config.selectedId) ?? null)
const pricedScarabs = computed(() => selected.value && prices.snapshot.value
  ? priceScarabs(parseScarabs(selected.value.scarabs), prices.snapshot.value.items)
  : [])
const scarabCost = computed(() => pricedScarabs.value.some(p => p.item)
  ? pricedScarabs.value.reduce((sum, p) => sum + (p.item ? p.item.chaos * p.qty : 0), 0)
  : null)

// Puts this strategy's name and priced scarabs into Farming profit; other
// (non-scarab) map costs there are kept.
function useInFarming () {
  const farm = farmingWidget.value
  const s = selected.value
  if (!farm || !s) return
  farm.strategy = s.name
  const lines = pricedScarabs.value.filter(p => p.item)
    .map(p => ({ type: p.item!.type, name: p.item!.name, variant: p.item!.variant, qty: p.qty }))
  farm.costs = [...farm.costs.filter(c => c.type !== 'Scarab'), ...lines]
  usedInFarming.value = true
  setTimeout(() => { usedInFarming.value = false }, 1500)
}

const otherStrategies = computed(() => props.config.strategies.filter(s => s.id !== props.config.selectedId && s.treeUrl))

function tryDecode (url: string): { tree: DecodedTree | null, error: string } {
  try {
    return { tree: decodeTree(url), error: '' }
  } catch (err) {
    return { tree: null, error: (err as Error).message }
  }
}

const decoded = computed(() => selected.value?.treeUrl ? tryDecode(selected.value.treeUrl) : null)
const decodeError = computed(() => decoded.value?.error ?? '')
const view = computed(() => (decoded.value?.tree && atlasData.value) ? overview(decoded.value.tree, atlasData.value) : null)
const notableCount = computed(() => view.value?.groups.reduce((n, g) => n + g.nodes.length, 0) ?? 0)

// Only pathofexile.com links are opened as-is; a bare code gets turned into one.
const treeLink = computed(() => {
  const url = selected.value?.treeUrl.trim()
  if (!url) return undefined
  if (/^https:\/\/(www\.)?pathofexile\.com\//i.test(url)) return url
  const code = extractTreeCode(url)
  return (code && !/^https?:/i.test(url)) ? `https://www.pathofexile.com/fullscreen-atlas-skill-tree/${code}` : undefined
})

const compare = computed(() => {
  const other = props.config.strategies.find(s => s.id === compareId.value)
  return other ? tryDecode(other.treeUrl) : null
})
const compareError = computed(() => compare.value?.error ?? '')
const diff = computed(() => {
  const a = decoded.value?.tree
  const b = compare.value?.tree
  const data = atlasData.value
  if (!a || !b || !data) return null
  const d = diffTrees(a, b)
  const names = (ids: number[]) => ids
    .map(id => data.get(id))
    .filter(n => n && (n.kind === 'notable' || n.kind === 'keystone'))
    .map(n => n!.name)
    .sort()
  return { added: names(d.added), removed: names(d.removed) }
})

async function copy (text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1200)
  } catch {}
}

function pasteSearch (text: string) {
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}
</script>

<style module>
.heading {
  padding: 4px 0 2px;
  font-size: var(--w-fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--w-faint);
}
.group {
  padding: 3px 0;
  border-bottom: 1px solid var(--w-line-soft);
}
.textarea {
  width: 100%;
  padding: 4px 8px;
  font-size: var(--w-fs-md);
  color: var(--w-fg);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-r-sm);
  resize: vertical;
}
.select {
  height: 26px;
  margin-bottom: 4px;
  padding: 0 6px;
  font-size: var(--w-fs-md);
  color: var(--w-fg);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-r-sm);
}
</style>
