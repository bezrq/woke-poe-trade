<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <WPanel :title="config.wmTitle || 'Essence scan'" width="19rem">
      <template #actions>
        <span :class="[$style.led, { [$style.on]: running }]" />
        <WButton size="sm" :variant="running ? 'default' : 'primary'" @click="toggle">{{ running ? 'Stop' : 'Start' }}</WButton>
      </template>
      <div v-if="message" class="w-warn text-xs px-3 pt-2">{{ message }}</div>
      <div v-for="e in recent" :key="e.id" :class="[$style.entry, $style[e.rated.verdict]]">
        <span :class="$style.tag">{{ VERDICT_LABEL[e.rated.verdict] }}</span>
        <span class="flex-1 w-trunc">{{ entryLabel(e) }}</span>
        <WPrice :chaos="e.rated.totalChaos || null" :divine="divine" />
      </div>
      <WEmpty v-if="!entries.length" icon="fas fa-flask">
        <template v-if="running">Hover an essence monolith. Its essences get priced, and ones holding {{ flagText }} say CORRUPT.</template>
        <template v-else-if="config.hotkey">Press <WKbd :keys="config.hotkey" /> in game to start scanning.</template>
        <template v-else>Start scanning, then hover essence monoliths.</template>
      </WEmpty>
      <template #footer>
        <span class="flex-1 w-trunc">{{ entries.length }} read · flag {{ flagText }}</span>
        <button v-if="entries.length" type="button" class="w-icon-btn" title="Clear" @click="clear"><i class="fas fa-eraser" /></button>
      </template>
    </WPanel>
    <Teleport to="body">
      <div v-if="running && current" :class="$style.layer">
        <div :class="[$style.card, $style[current.rated.verdict], { [$style.big]: current.bigValue }]" :style="cardStyle">
          <div class="flex items-center gap-2">
            <span :class="$style.tag">{{ VERDICT_LABEL[current.rated.verdict] }}</span>
            <span class="flex-1 w-dim text-xs w-trunc">{{ headline(current) }}</span>
            <WPrice :chaos="current.rated.totalChaos || null" :divine="divine" class="w-accent font-semibold" />
          </div>
          <div v-for="(r, i) in current.rated.rows" :key="i" :class="$style.erow">
            <span :class="{ [$style.flagged]: r.flagged }">{{ shortEssenceName(r.essence) }}</span>
            <WPrice :chaos="r.chaos" :divine="divine" :class="{ 'w-dim': !r.flagged }" />
          </div>
          <template v-if="current.rated.specials.length">
            <div class="w-faint" style="font-size: 10.5px; margin-top: 3px;">Corrupting can turn {{ current.rated.flagged.join(', ') }} into:</div>
            <div v-for="sp in current.rated.specials" :key="sp.name" :class="$style.erow" style="font-size: 11.5px;">
              <span :class="$style.flagged">{{ sp.name.replace('Essence of ', '') }}</span>
              <WPrice :chaos="sp.chaos" :divine="divine" />
            </div>
          </template>
          <div v-if="!hasPrices" class="w-faint" style="font-size: 10.5px;">No prices yet: open the Market tracker once to load them.</div>
        </div>
      </div>
    </Teleport>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { ESSENCE_SCAN_TYPE } from './widget'
import type { EssenceScanWidget } from './widget'

export default {
  widget: {
    type: ESSENCE_SCAN_TYPE,
    instances: 'single',
    trNameKey: 'Essence scan'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { computed, inject, onUnmounted, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WButton, WEmpty, WKbd, WPrice } from '../ui'
import { hostRequest } from '../shared/host'
import { usePriceIndex } from '../market/price-index'
import { parseMonolith, rateMonolith, shortEssenceName } from './essences'
import type { EssenceVerdict, PricedMonolith } from './essences'
import { initEssenceScanWidget, normalizeEssenceScanWidget, parseEssenceHotkeyTarget } from './widget'

const props = defineProps<{ config: EssenceScanWidget }>()
const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  initEssenceScanWidget(props.config)
  wm.show(props.config.wmId)
}
normalizeEssenceScanWidget(props.config)

const VERDICT_LABEL: Record<EssenceVerdict, string> = { corrupt: 'CORRUPT', open: 'OPEN', done: 'DONE' }

interface Entry {
  id: number
  at: { x: number, y: number }
  rated: PricedMonolith
  bigValue: boolean
}

const running = shallowRef(false)
const message = shallowRef<string | null>(null)
const entries = shallowRef<Entry[]>([])
const current = shallowRef<Entry | null>(null)
let nextId = 1

const prices = usePriceIndex()
const divine = computed(() => prices.snapshot.value?.divine ?? null)
const essencePrices = computed(() => {
  const map = new Map<string, number>()
  for (const item of prices.snapshot.value?.items ?? []) {
    if (item.type === 'Essence') map.set(item.name, item.chaos)
  }
  return map
})
const hasPrices = computed(() => essencePrices.value.size > 0)

const recent = computed(() => entries.value.slice(-8).reverse())
const flagText = computed(() => props.config.flagTypes.length ? props.config.flagTypes.join(', ') : 'nothing')

function entryLabel (e: Entry) {
  return e.rated.rows.map(r => r.essence.type).join(' · ')
}

function headline (e: Entry) {
  if (e.rated.verdict === 'done') return 'already corrupted'
  if (e.rated.flagged.length) return `has ${e.rated.flagged.join(', ')}`
  if (e.bigValue) return 'worth opening'
  return `${e.rated.rows.length} essence${e.rated.rows.length === 1 ? '' : 's'}`
}

const cardStyle = computed(() => {
  const e = current.value
  if (!e) return {}
  // Beside the label: right of the cursor unless it's near the right edge.
  if (e.at.x < 0.75) return { left: `${e.at.x * 100 + 6}%`, top: `${Math.max(2, e.at.y * 100 - 18)}%` }
  return { right: `${(1 - e.at.x) * 100 + 6}%`, top: `${Math.max(2, e.at.y * 100 - 18)}%` }
})

function onReading (reading: { lines: string[], at: { x: number, y: number } }) {
  const scanned = parseMonolith(reading.lines)
  if (!scanned) {
    current.value = null
    return
  }
  const rated = rateMonolith(scanned, props.config.flagTypes, name => essencePrices.value.get(name) ?? null)
  const alert = props.config.valueAlertChaos
  const entry: Entry = {
    id: nextId++,
    at: reading.at,
    rated,
    bigValue: alert > 0 && rated.totalChaos >= alert
  }
  // The same monolith read again (after corrupting it, say): replace it.
  const list = entries.value.slice()
  const idx = list.findIndex(e => Math.hypot(e.at.x - reading.at.x, e.at.y - reading.at.y) < 0.06)
  if (idx >= 0) list.splice(idx, 1)
  list.push(entry)
  entries.value = list.slice(-50)
  current.value = entry
}

const events = MainProcess.onEvent('MAIN->CLIENT::woke-event', ({ topic, data }) => {
  if (topic !== 'essence-scan') return
  const d = data as { type: string, running?: boolean, message?: string, reading?: { lines: string[], at: { x: number, y: number } } }
  if (d.type === 'state') {
    running.value = Boolean(d.running)
    message.value = d.message ?? null
    if (!running.value) current.value = null
  } else if (d.type === 'clear') {
    current.value = null
  } else if (d.type === 'reading' && d.reading) {
    onReading(d.reading)
  }
})

async function toggle () {
  message.value = null
  try {
    if (running.value) {
      await hostRequest('essence-scan-stop', null)
      running.value = false
      current.value = null
    } else {
      await hostRequest('essence-scan-start', null)
      running.value = true
      wm.show(props.config.wmId)
    }
  } catch (err) {
    message.value = err instanceof Error ? err.message : String(err)
    wm.show(props.config.wmId)
  }
}

function clear () {
  entries.value = []
  current.value = null
  hostRequest('essence-scan-reread', null).catch(() => {})
}

const hotkeys = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  if (parseEssenceHotkeyTarget(e.target) !== props.config.wmId) return
  toggle()
})

hostRequest<{ running: boolean }>('essence-scan-status', null)
  .then(s => { running.value = s.running })
  .catch(() => {})

onUnmounted(() => {
  events.abort()
  hotkeys.abort()
})
</script>

<style module>
.led { width: 8px; height: 8px; border-radius: 4px; background: var(--w-faint); align-self: center; margin-right: 4px; }
.led.on { background: var(--w-up); }
.entry { display: flex; align-items: center; gap: 8px; padding: 3px var(--w-pad); font-size: 12.5px; border-bottom: 1px solid var(--w-line-soft); }
.tag {
  flex: none;
  min-width: 52px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--w-radius-sm);
  color: var(--w-accent-fg);
  padding: 0 4px;
}
.corrupt .tag { background: var(--ess-flag, #c58bd6); }
.open .tag { background: var(--w-up); }
.done .tag { background: var(--w-panel-3); color: var(--w-dim); }

.layer { position: fixed; inset: 0; pointer-events: none; z-index: 1000; }
.card {
  position: absolute;
  width: 13rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  background: var(--w-panel);
  color: var(--w-fg);
  font-family: var(--w-body);
  font-size: var(--w-text);
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-radius);
  box-shadow: var(--w-shadow);
}
.card.corrupt { border-color: color-mix(in srgb, var(--ess-flag, #c58bd6) 70%, transparent); }
.card.big { border-color: color-mix(in srgb, var(--w-up) 60%, transparent); }
.erow { display: flex; justify-content: space-between; gap: 8px; font-size: 12.5px; }
.flagged { color: var(--ess-flag, #c58bd6); font-weight: 600; }
</style>
