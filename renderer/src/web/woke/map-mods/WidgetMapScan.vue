<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <WPanel :title="config.wmTitle || 'Map scan'" width="19rem">
      <template #actions>
        <span :class="[$style.led, { [$style.on]: running }]" />
        <WButton size="sm" :variant="running ? 'default' : 'primary'" @click="toggle">{{ running ? 'Stop' : 'Start' }}</WButton>
      </template>
      <div v-if="message" class="w-warn text-xs px-3 pt-2">{{ message }}</div>
      <div v-if="rolling" :class="$style.roll">
        <div class="flex items-center gap-2">
          <i class="fas fa-dice" />
          <span class="font-semibold">Rolling</span>
          <span class="w-dim text-xs">{{ locked ? 'locked on tooltip' : 'hover the map…' }}</span>
          <span class="flex-1" />
          <span class="w-num">{{ rolls.length }}</span><span class="w-dim text-xs">rerolls</span>
        </div>
        <div v-if="rolls.length" class="flex flex-wrap gap-1">
          <span v-for="r in rolls.slice(-14)" :key="r.n" :class="[$style.rollTag, $style[r.verdict]]"
            :title="`Reroll ${r.n}: ${VERDICT_LABEL[r.verdict]}, juice ${r.juice}`">{{ r.n }}</span>
        </div>
        <div class="w-dim text-xs">
          <template v-if="config.rollHotkey"><WKbd :keys="config.rollHotkey" /> again to stop rolling.</template>
          <WButton v-else size="sm" @click="roll">Stop rolling</WButton>
        </div>
      </div>
      <div :class="$style.tally">
        <div><span class="w-num w-up">{{ tally.run }}</span><span class="w-dim">run</span></div>
        <div><span class="w-num" style="color: var(--w-warn);">{{ tally.careful }}</span><span class="w-dim">careful</span></div>
        <div><span class="w-num w-down">{{ tally.skip }}</span><span class="w-dim">skip</span></div>
      </div>
      <div v-for="e in recent" :key="e.id" :class="[$style.entry, $style[e.verdict]]">
        <span :class="$style.tag">{{ VERDICT_LABEL[e.verdict] }}</span>
        <span class="flex-1 w-trunc">{{ e.label }}</span>
        <span v-if="e.rerolls" class="w-faint text-xs" title="Times this slot was re-read">×{{ e.rerolls + 1 }}</span>
        <span class="w-num w-accent">{{ e.juice }}</span>
      </div>
      <WEmpty v-if="!entries.length" icon="fas fa-crosshairs">
        <template v-if="rolling">Hover the map you're rerolling.</template>
        <template v-else-if="running">Hover your maps. Each one gets a verdict, and rerolls are re-read.</template>
        <template v-else-if="config.hotkey">Press <WKbd :keys="config.hotkey" /> in game to start scanning.</template>
        <template v-else>Start scanning, then hover your maps.</template>
        <div v-if="!rolling && config.rollHotkey" class="text-xs mt-1">Rerolling one map? Hover it and press <WKbd :keys="config.rollHotkey" />.</div>
      </WEmpty>
      <template #footer>
        <span class="flex-1">{{ entries.length }} scanned · profile {{ profileName }}</span>
        <button v-if="entries.length" type="button" class="w-icon-btn" title="Clear" @click="clear"><i class="fas fa-eraser" /></button>
      </template>
    </WPanel>
  </Widget>
  <Teleport to="body">
    <div v-if="running" :class="$style.layer">
      <span v-for="e in entries" :key="e.id" :class="[$style.marker, $style[e.verdict]]"
        :style="{ left: `${e.at.x * 100}%`, top: `${e.at.y * 100}%` }" />
      <div v-if="current" :class="[$style.badge, $style[current.verdict], { [$style.flash]: current.flash }]"
        :style="badgeStyle">
        <div class="flex items-center gap-2">
          <span :class="$style.tag">{{ VERDICT_LABEL[current.verdict] }}</span>
          <span class="flex-1" />
          <span class="w-dim text-xs">Juice</span>
          <span class="w-num w-accent font-semibold">{{ current.juice }}</span>
        </div>
        <div v-if="current.flash" class="w-up text-xs font-semibold">
          {{ current.rollN ? `Stop: reroll ${current.rollN} passes.` : 'This reroll passes. Stop here.' }}
        </div>
        <div v-for="m in current.flagged" :key="m.matcher" class="flex items-center gap-1 text-xs">
          <span :class="[$style.dot, $style[m.rating]]" /><span>{{ m.label }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { MAP_SCAN_TYPE } from './scan'
import type { MapScanWidget } from './scan'

export default {
  widget: {
    type: MAP_SCAN_TYPE,
    instances: 'multi',
    trNameKey: 'Map scan'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { computed, inject, onUnmounted, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WButton, WEmpty, WKbd } from '../ui'
import { hostRequest } from '../shared/host'
import { DEFAULT_JUICE_WEIGHTS, defaultProfile, juiceScore, rateMods, shortLabel } from './rules'
import type { ModRating, Verdict } from './rules'
import { TooltipMatcher } from './tooltip-parse'
import { allAreaMods } from './data'
import { findMapModsConfig } from './check'
import { activeProfile } from './widget'
import { SAME_SLOT, initMapScanWidget, normalizeMapScanWidget, parseScanHotkeyTarget } from './scan'

const props = defineProps<{ config: MapScanWidget }>()
const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  initMapScanWidget(props.config)
  wm.show(props.config.wmId)
}
normalizeMapScanWidget(props.config)

const VERDICT_LABEL: Record<Verdict, string> = { skip: 'SKIP', careful: 'CARE', run: 'RUN' }

interface Entry {
  id: number
  at: { x: number, y: number }
  verdict: Verdict
  juice: number
  label: string
  rerolls: number
  flash: boolean
  // Reroll number while rolling.
  rollN?: number
  flagged: Array<{ matcher: string, label: string, rating: ModRating }>
}

const running = shallowRef(false)
const rolling = shallowRef(false)
const locked = shallowRef(false)
const rolls = shallowRef<Array<{ n: number, verdict: Verdict, juice: number }>>([])
const message = shallowRef<string | null>(null)
const entries = shallowRef<Entry[]>([])
const current = shallowRef<Entry | null>(null)
let nextId = 1
let matcher: TooltipMatcher | null = null

const recent = computed(() => entries.value.slice(-8).reverse())
const tally = computed(() => {
  const t = { run: 0, careful: 0, skip: 0 }
  for (const e of entries.value) {
    if (e.verdict === 'run') t.run++
    else if (e.verdict === 'careful') t.careful++
    else t.skip++
  }
  return t
})

const mapMods = computed(() => findMapModsConfig())
const profileName = computed(() => mapMods.value ? activeProfile(mapMods.value).name : 'default')

const badgeStyle = computed(() => {
  const e = current.value
  if (!e) return {}
  // Map tooltips open to the right of the item, so the badge goes left of the
  // cursor unless there's no room.
  if (e.at.x > 0.2) {
    return { right: `${(1 - e.at.x) * 100 + 1.5}%`, top: `${e.at.y * 100}%` }
  }
  return { left: `${e.at.x * 100}%`, top: `${e.at.y * 100 + 3}%` }
})

interface Reading { lines: string[], at: { x: number, y: number }, rolling?: boolean }

function onReading (reading: Reading) {
  matcher ??= new TooltipMatcher(allAreaMods())
  const scanned = matcher.parse(reading.lines)
  if (!scanned) {
    current.value = null
    return
  }
  const cfg = mapMods.value
  const profile = cfg ? activeProfile(cfg) : defaultProfile()
  const verdict = rateMods(scanned.mods, profile)
  const juice = juiceScore({ ...scanned.props, goodMods: verdict.good.length }, cfg?.weights ?? DEFAULT_JUICE_WEIGHTS)
  const flagged = [...verdict.deadly, ...verdict.warn, ...verdict.good]
    .map(m => ({ matcher: m.matcher, label: shortLabel(m.matcher), rating: m.rating }))
  const label = verdict.deadly.length
    ? flagged.filter(f => f.rating === 'deadly').map(f => f.label).join(' · ')
    : scanned.tier ? `T${scanned.tier} map` : 'Map'

  // Same slot as an earlier reading (rerolling in place): replace it.
  const list = entries.value.slice()
  const idx = list.findIndex(e => Math.hypot(e.at.x - reading.at.x, (e.at.y - reading.at.y)) < SAME_SLOT)
  const prev = idx >= 0 ? list[idx] : null
  let rollN: number | undefined
  if (reading.rolling) {
    rollN = rolls.value.length + 1
    rolls.value = [...rolls.value, { n: rollN, verdict: verdict.verdict, juice: juice.score }]
  }
  const passes = verdict.verdict === 'run' && (rollN != null || Boolean(prev && prev.verdict !== 'run'))
  const entry: Entry = {
    id: nextId++,
    at: prev?.at ?? reading.at,
    verdict: verdict.verdict,
    juice: juice.score,
    label,
    rerolls: prev ? prev.rerolls + 1 : 0,
    flash: props.config.alertOnPass && passes,
    rollN,
    flagged
  }
  if (idx >= 0) list.splice(idx, 1)
  list.push(entry)
  entries.value = list
  current.value = { ...entry, at: reading.at }
}

const events = MainProcess.onEvent('MAIN->CLIENT::woke-event', ({ topic, data }) => {
  if (topic !== 'map-scan') return
  const d = data as { type: string, running?: boolean, rolling?: boolean, locked?: boolean, message?: string, reading?: Reading }
  if (d.type === 'state') {
    running.value = Boolean(d.running)
    const nowRolling = Boolean(d.rolling)
    if (nowRolling && !rolling.value) rolls.value = []
    rolling.value = nowRolling
    locked.value = Boolean(d.locked)
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
      await hostRequest('map-scan-stop', null)
      running.value = false
      current.value = null
    } else {
      await hostRequest('map-scan-start', null)
      running.value = true
      wm.show(props.config.wmId)
    }
  } catch (err) {
    message.value = err instanceof Error ? err.message : String(err)
    wm.show(props.config.wmId)
  }
}

// Rolling mode on/off (starts scanning if needed).
async function roll () {
  message.value = null
  try {
    const s = await hostRequest<{ running: boolean, rolling: boolean }>('map-scan-roll', null)
    running.value = s.running
    if (s.rolling) wm.show(props.config.wmId)
  } catch (err) {
    message.value = err instanceof Error ? err.message : String(err)
    wm.show(props.config.wmId)
  }
}

function clear () {
  entries.value = []
  rolls.value = []
  current.value = null
  hostRequest('map-scan-reread', null).catch(() => {})
}

const hotkeys = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  const t = parseScanHotkeyTarget(e.target)
  if (t?.wmId !== props.config.wmId) return
  if (t.roll) roll()
  else toggle()
})

hostRequest<{ running: boolean, rolling?: boolean }>('map-scan-status', null)
  .then(s => { running.value = s.running; rolling.value = Boolean(s.rolling) })
  .catch(() => {})

onUnmounted(() => {
  events.abort()
  hotkeys.abort()
})
</script>

<style module>
.led { width: 8px; height: 8px; border-radius: 4px; background: var(--w-faint); align-self: center; margin-right: 4px; }
.led.on { background: var(--w-up); }
.roll {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px var(--w-pad);
  border-bottom: 1px solid var(--w-line);
  background: color-mix(in srgb, var(--w-accent) 8%, transparent);
}
.rollTag {
  min-width: 20px;
  text-align: center;
  font-size: 10.5px;
  font-family: var(--w-num);
  border-radius: var(--w-radius-sm);
  color: var(--w-accent-fg);
  background: var(--w-faint);
}
.rollTag.run { background: var(--w-up); }
.rollTag.careful { background: var(--w-warn); }
.rollTag.skip { background: var(--w-down); }
.tally {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 8px var(--w-pad);
  border-bottom: 1px solid var(--w-line);
  text-align: center;
}
.tally > div { display: flex; flex-direction: column; font-size: var(--w-text-sm); }
.tally :global(.w-num) { font-size: 18px; }
.entry { display: flex; align-items: center; gap: 8px; padding: 3px var(--w-pad); font-size: 12.5px; }
.tag {
  flex: none;
  min-width: 38px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--w-radius-sm);
  color: var(--w-accent-fg);
  padding: 0 4px;
}
.run .tag { background: var(--w-up); }
.careful .tag { background: var(--w-warn); }
.skip .tag { background: var(--w-down); }

.layer { position: fixed; inset: 0; pointer-events: none; z-index: 1000; }
.marker {
  position: absolute;
  width: 2.2vh;
  height: 2.2vh;
  margin: -1.1vh 0 0 -1.1vh;
  border-radius: 50%;
  border: 2px solid var(--w-faint);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6);
}
.marker.run { border-color: var(--w-up); }
.marker.careful { border-color: var(--w-warn); }
.marker.skip { border-color: var(--w-down); }
.badge {
  position: absolute;
  min-width: 11rem;
  max-width: 16rem;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  background: var(--w-panel);
  color: var(--w-fg);
  font-family: var(--w-body);
  font-size: var(--w-text);
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-radius);
  box-shadow: var(--w-shadow);
}
.badge.skip { border-color: color-mix(in srgb, var(--w-down) 60%, transparent); }
.badge.run { border-color: color-mix(in srgb, var(--w-up) 60%, transparent); }
.flash { animation: flash 0.5s ease-in-out 4 alternate; }
@keyframes flash {
  from { box-shadow: 0 0 0 0 var(--w-up); }
  to { box-shadow: 0 0 0 6px color-mix(in srgb, var(--w-up) 40%, transparent); }
}
.dot { width: 7px; height: 7px; border-radius: 4px; background: var(--w-panel-3); flex: none; }
.dot.deadly { background: var(--w-down); }
.dot.warn { background: var(--w-warn); }
.dot.good { background: var(--w-up); }
</style>
