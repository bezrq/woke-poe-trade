<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <WPanel :title="config.wmTitle || 'Farming profit'" width="27rem">
      <template #tabs>
        <WTabs v-model="tab" :options="tabs.map(t => ({ value: t.id, label: t.label }))" />
      </template>
      <template v-if="!prices.snapshot.value" #meta>
        <span style="color: var(--w-warn);"><i class="fas fa-exclamation-triangle" /> Waiting for poe.ninja prices. They load on their own within a minute or two.</span>
      </template>

      <div class="flex flex-col gap-2 py-2" style="padding-left: var(--w-pad); padding-right: var(--w-pad);">
        <template v-if="tab === 'session'">
          <div class="flex gap-1 items-center">
            <input v-model="config.strategy" list="woke-farming-strategies" placeholder="Strategy (e.g. Breach + Legion)"
              :class="$style.input" class="grow min-w-0">
            <datalist id="woke-farming-strategies">
              <option v-for="name in strategyNames" :key="name" :value="name" />
            </datalist>
            <WButton v-if="!s" variant="primary" icon="fas fa-play" @click="start">Start</WButton>
            <template v-else>
              <WButton :icon="s.runningSince != null ? 'fas fa-pause' : 'fas fa-play'" @click="toggle">{{ s.runningSince != null ? 'Pause' : 'Resume' }}</WButton>
              <WButton variant="primary" icon="fas fa-flag-checkered" @click="end" title="Save to history">End</WButton>
            </template>
          </div>

          <template v-if="s">
            <div :class="$style.hero">
              <div>
                <div :class="$style.k">Profit</div>
                <div :class="[$style.big, t.profit >= 0 ? 'w-up' : 'w-down']" class="w-num">{{ fmt(t.profit) }}</div>
              </div>
              <div>
                <div :class="$style.k">Per hour</div>
                <div :class="$style.big" class="w-num">{{ t.perHour != null ? fmt(t.perHour) : '—' }}</div>
              </div>
              <div>
                <div :class="$style.k">Time</div>
                <div :class="$style.big" class="w-num">{{ formatHms(elapsed(s, now)) }}</div>
              </div>
            </div>
            <div :class="$style.stats">
              <span class="w-dim">Maps</span>
              <span class="flex items-center gap-1 w-num">
                <button class="w-icon-btn" @click="s.maps = Math.max(0, s.maps - 1)"><i class="fas fa-minus text-xs" /></button>
                {{ s.maps }}
                <button class="w-icon-btn" @click="s.maps++"><i class="fas fa-plus text-xs" /></button>
              </span>
              <span class="w-dim">Per map</span><span class="w-num">{{ t.perMap != null ? fmt(t.perMap) : '—' }}</span>
              <span class="w-dim">Loot</span><span class="w-num">{{ fmt(t.loot) }}</span>
              <span class="w-dim">Spent</span><span class="w-num">{{ fmt(t.cost) }}</span>
              <span class="w-dim">Map cost</span><span class="w-num">{{ fmt(t.costPerMap) }}</span>
              <template v-if="mapShare != null">
                <span class="w-dim" title="Share of session time spent inside maps (from Client.txt)">In maps</span><span class="w-num">{{ Math.round(mapShare * 100) }}%</span>
              </template>
            </div>
            <div v-if="s.autoPaused" class="text-xs w-dim"><i class="fas fa-pause-circle" /> Paused after 5 minutes without a zone change. Resumes when you change zone.</div>
            <div v-if="config.lootHotkey" class="text-xs w-faint">Hover an item in game and press <WKbd :keys="config.lootHotkey" /> to add it.</div>
            <div v-if="t.missingPrices" class="text-xs" style="color: var(--w-warn);">{{ t.missingPrices }} item(s) have no price and count as 0.</div>
            <ui-checkbox v-model="config.autoCountMaps" class="text-sm">Count maps from Client.txt</ui-checkbox>

            <div class="relative">
              <WField v-model="lootQuery" icon="fas fa-plus" placeholder="Add loot… (e.g. Divine Orb)" class="w-full" />
              <div v-if="lootResults.length" class="w-surface absolute left-0 right-0 z-10 mt-1 py-1">
                <button v-for="item in lootResults" :key="key(item)" @click="addLoot(item)" class="w-row w-full text-left" style="grid-template-columns: minmax(0,1fr) auto;">
                  <span class="w-trunc">{{ item.name }}<span v-if="item.variant" class="w-dim ml-1">{{ item.variant }}</span></span>
                  <span class="w-dim w-num text-xs">{{ fmt(item.chaos) }}</span>
                </button>
              </div>
            </div>
            <div>
              <div v-for="line in s.loot" :key="key(line)" class="w-row px-0" :class="$style.lineGrid">
                <span class="w-trunc">{{ line.name }}<span v-if="line.variant" class="w-dim ml-1">{{ line.variant }}</span></span>
                <button class="w-icon-btn" @click="changeQty(line, -1)"><i class="fas fa-minus text-xs" /></button>
                <span class="text-center w-num">{{ line.qty }}</span>
                <button class="w-icon-btn" @click="changeQty(line, 1)"><i class="fas fa-plus text-xs" /></button>
                <span class="text-right w-dim w-num">{{ lootPrice(line) }}</span>
              </div>
              <label class="flex items-center gap-2 w-dim pt-2">
                Other loot
                <WField v-model="s.extraChaos" type="number" suffix="c" style="width: 6rem;" />
              </label>
            </div>
          </template>
        </template>

        <template v-else-if="tab === 'costs'">
          <div class="w-dim">What one map costs to run: map, scarabs, compasses, etc.</div>
          <div class="relative">
            <WField v-model="costQuery" icon="fas fa-plus" placeholder="Add an input…" class="w-full" />
            <div v-if="costResults.length" class="w-surface absolute left-0 right-0 z-10 mt-1 py-1">
              <button v-for="item in costResults" :key="key(item)" @click="addCost(item)" class="w-row w-full text-left" style="grid-template-columns: minmax(0,1fr) auto;">
                <span class="w-trunc">{{ item.name }}<span v-if="item.variant" class="w-dim ml-1">{{ item.variant }}</span></span>
                <span class="w-dim w-num text-xs">{{ fmt(item.chaos) }}</span>
              </button>
            </div>
          </div>
          <div>
            <div v-for="line in config.costs" :key="key(line)" class="w-row px-0" :class="$style.costGrid">
              <span class="w-trunc">{{ line.name }}<span v-if="line.variant" class="w-dim ml-1">{{ line.variant }}</span></span>
              <input v-model.number="line.qty" type="number" min="0" step="1" :class="$style.input" class="w-full">
              <span class="text-right w-dim w-num">{{ linePrice(line) }}</span>
              <button class="w-icon-btn" @click="removeCost(line)" title="Remove"><i class="fas fa-times" /></button>
            </div>
            <div class="pt-2 flex justify-between"><span class="w-dim">Per map</span><span class="w-num w-accent">{{ fmt(costPerMap) }}</span></div>
          </div>
        </template>

        <template v-else>
          <WEmpty v-if="!config.history.length" icon="fas fa-history">Ended sessions show up here.</WEmpty>
          <div v-else>
            <div class="w-row w-row--head px-0" :class="$style.histGrid">
              <span>Strategy</span><span class="text-right">Maps</span><span class="text-right">Hours</span><span class="text-right">/hour</span><span class="text-right">/map</span>
            </div>
            <div v-for="row in stats" :key="row.strategy" class="w-row px-0" :class="$style.histGrid">
              <span class="w-trunc">{{ row.strategy }}</span>
              <span class="text-right w-num">{{ row.maps }}</span>
              <span class="text-right w-num">{{ row.hours.toFixed(1) }}</span>
              <span class="text-right w-num" :class="row.perHour >= 0 ? 'w-up' : 'w-down'">{{ fmt(row.perHour) }}</span>
              <span class="text-right w-num">{{ fmt(row.perMap) }}</span>
            </div>
            <WButton variant="danger" size="sm" class="mt-2" @click="clearHistory">Clear history</WButton>
          </div>
        </template>
      </div>
    </WPanel>
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
import { useVisibleClock } from '../shared/visible-clock'
import { Host } from '@/web/background/IPC'
import { AppConfig, saveConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import UiCheckbox from '@/web/ui/UiCheckbox.vue'
import { WPanel, WTabs, WField, WButton, WEmpty, WKbd } from '../ui'
import { MainProcess } from '@/web/background/IPC'
import { parseClipboard } from '@/parser'
import { usePriceIndex } from '../market/price-index'
import { formatChaos } from '../market/analysis'
import { itemKey } from '../market/types'
import type { PriceItem } from '../market/types'
import { parseLogLine } from '../campaign/log-parse'
import { ATLAS_TYPE } from '../atlas/widget'
import type { AtlasWidget } from '../atlas/widget'
import { FARMING_LOOT_TARGET, countNewMap, elapsed, formatHms, isMapArea, lineValue, maybeAutoPause, newSession, onZoneChange, sellPrice, sellRules, strategyStats, totals } from './farming'
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
// Every second on screen; every 15 s while hidden, so auto-pause still works.
useVisibleClock(props.config, () => {
  now.value = Date.now()
  const sess = props.config.session
  if (sess && props.config.autoPause !== false && maybeAutoPause(sess, now.value)) saveConfig()
}, 1000, 15000)

const s = computed(() => props.config.session)
const price = (r: PricedRef) => prices.price(r)
const rules = computed(() => sellRules(props.config))
const t = computed(() => s.value
  ? totals(s.value, props.config.costs, price, now.value, rules.value)
  : { costPerMap: 0, cost: 0, loot: 0, profit: 0, perHour: null, perMap: null, missingPrices: 0 })
const costPerMap = computed(() => lineValue(props.config.costs, price).total)
const stats = computed(() => strategyStats(props.config.history))

const strategyNames = computed(() => AppConfig().widgets
  .filter(w => w.wmType === ATLAS_TYPE)
  // An Atlas widget that never mounted (just added, or its module is off)
  // has no strategies yet.
  .flatMap(w => ((w as AtlasWidget).strategies ?? []).map(st => st.name))
  .filter(Boolean))

const lootQuery = shallowRef('')
const costQuery = shallowRef('')
const lootResults = computed(() => prices.search(lootQuery.value))
const costResults = computed(() => prices.search(costQuery.value))

function key (r: PricedRef) { return itemKey(r) }

function fmt (chaos: number) {
  return formatChaos(chaos, prices.snapshot.value?.divine ?? null)
}

// Share of time in maps, including the zone you're in right now.
const mapShare = computed(() => {
  const sess = s.value
  if (!sess || sess.lastZoneAt == null) return null
  let map = sess.mapMs ?? 0
  let other = sess.otherMs ?? 0
  if (sess.runningSince != null) {
    const span = now.value - Math.max(sess.lastZoneAt, sess.runningSince)
    if (sess.inMap) map += span
    else other += span
  }
  return map + other > 60_000 ? map / (map + other) : null
})

function lootPrice (line: PricedRef & { qty: number }) {
  const p = sellPrice(line, price(line), rules.value)
  if (p == null) return 'no price'
  if (p === 0) return 'junk'
  return fmt(p * line.qty)
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
  const tt = totals(sess, props.config.costs, price, nowTs, rules.value)
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

// Zone changes: count newly generated maps, book map vs other time, and
// resume an auto-paused session.
const logListener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
  const sess = props.config.session
  if (!sess) return
  let changed = false
  for (const line of e.lines) {
    const ev = parseLogLine(line)
    if (ev?.kind !== 'area') continue
    const inMap = isMapArea(ev.areaId)
    onZoneChange(sess, inMap, Date.now())
    if (inMap && sess.runningSince != null && props.config.autoCountMaps && countNewMap(sess, ev.areaId, ev.seed)) sess.maps++
    changed = true
  }
  // Config is otherwise saved only when the overlay loses focus.
  if (changed) saveConfig()
})

// Hotkey: add the hovered item (copied by APT) to the session's loot.
const itemListener = MainProcess.onEvent('MAIN->CLIENT::item-text', (e) => {
  if (e.target !== FARMING_LOOT_TARGET) return
  const sess = props.config.session
  if (!sess) return
  const parsed = parseClipboard(e.clipboard).unwrapOr(null)
  if (!parsed) return
  const name = parsed.info.refName
  const snap = prices.snapshot.value
  const candidates = snap?.items.filter(i => i.name === name) ?? []
  const gemState = parsed.gemLevel != null ? `${parsed.gemLevel}${parsed.quality ? `/${parsed.quality}` : ''}` : ''
  const match = candidates.find(i => i.variant === gemState) ?? candidates.find(i => !i.variant) ?? candidates[0]
  const ref = match ?? { type: '', name, variant: '' }
  const qty = parsed.stackSize?.value ?? 1
  const k = itemKey(ref)
  const line = sess.loot.find(l => itemKey(l) === k)
  if (line) line.qty += qty
  else sess.loot.push({ type: ref.type, name: ref.name, variant: ref.variant, qty })
  saveConfig()
})
onUnmounted(() => { itemListener.abort() })
onUnmounted(() => { logListener.abort() })
</script>

<style module>
.input {
  height: 26px;
  padding: 0 8px;
  font-size: 12.5px;
  color: var(--w-fg);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius-sm);
}
.input:focus { outline: none; border-color: var(--w-accent); }
.hero {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--w-line);
  border-bottom: 1px solid var(--w-line);
}
.k {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--w-faint);
}
.big { font-size: 17px; font-weight: 500; }
.stats {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  align-items: center;
  gap: 2px 12px;
}
.lineGrid { grid-template-columns: minmax(0, 1fr) 22px 28px 22px 72px; gap: 4px; }
.costGrid { grid-template-columns: minmax(0, 1fr) 56px 72px 22px; }
.histGrid { grid-template-columns: minmax(0, 1fr) 40px 44px 64px 64px; }
</style>
