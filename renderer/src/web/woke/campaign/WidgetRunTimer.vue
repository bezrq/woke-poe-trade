<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="flex flex-col items-start gap-1">
      <!-- HUD strip: always on while the run is going -->
      <div :class="$style.strip">
        <template v-if="run">
          <span :class="$style.where" class="w-head-font w-accent w-trunc">
            {{ run.finished ? (isComplete(run) ? 'Campaign done' : 'Run ended') : actLabel(run.act) }}<template v-if="!run.finished && run.zone"> · {{ run.zone }}</template>
          </span>
          <span :class="$style.sep" />
          <span><span :class="$style.k">Run</span> <span :class="$style.time" class="w-num">{{ formatRunTime(total) }}</span></span>
          <span v-if="current">
            <span :class="$style.k">Act</span> <span class="w-num">{{ formatRunTime(current.segmentMs ?? 0) }}</span>
            <span v-if="current.cmpSegmentMs != null" class="w-num w-faint"> / {{ formatRunTime(current.cmpSegmentMs) }}</span>
          </span>
          <span v-if="delta != null" class="w-num" :class="delta <= 0 ? 'w-up' : 'w-down'">{{ formatDelta(delta) }}</span>
          <template v-if="!run.finished">
            <span :class="$style.sep" />
            <span class="w-dim">Zone <span class="w-num" style="color: var(--w-fg);">{{ formatRunTime(total - run.zoneSinceMs) }}</span></span>
          </template>
          <span v-if="!run.finished && run.runningSince == null" class="w-num" style="color: var(--w-warn);">paused</span>
        </template>
        <span v-else class="w-dim">Campaign timer · starts on the Twilight Strand</span>

        <span v-if="wm.active.value" class="flex items-center gap-0.5">
          <span :class="$style.sep" />
          <button v-if="!run || run.finished" class="w-icon-btn" title="Start a run now" @click="start"><i class="fas fa-play text-xs" /></button>
          <template v-else>
            <button class="w-icon-btn" :title="run.runningSince != null ? 'Pause' : 'Resume'" @click="togglePause">
              <i class="fas text-xs" :class="run.runningSince != null ? 'fa-pause' : 'fa-play'" />
            </button>
            <button class="w-icon-btn" title="End run (in act 10 this counts as finished)" @click="end"><i class="fas fa-flag-checkered text-xs" /></button>
          </template>
          <button class="w-icon-btn" :class="{ 'w-icon-btn--on': config.expanded }" title="Splits and past runs" @click="config.expanded = !config.expanded">
            <i class="fas text-xs" :class="config.expanded ? 'fa-chevron-up' : 'fa-list'" />
          </button>
        </span>
      </div>

      <!-- Splits panel -->
      <WPanel v-if="config.expanded" width="21rem" max-height="60vh">
        <template #title>
          <template v-if="run">Run<template v-if="run.charName"> · {{ run.charName }}<span class="w-dim"> ({{ run.className }})</span></template></template>
          <template v-else>Campaign runs</template>
        </template>
        <template #tabs>
          <WTabs v-model="tab" :options="[{ value: 'splits', label: 'Splits' }, { value: 'history', label: 'Past runs', count: config.history.length }]" />
        </template>

        <template v-if="tab === 'splits'">
          <div :class="$style.hero">
            <div>
              <div :class="$style.k">Run time</div>
              <div :class="$style.big" class="w-num">{{ formatRunTime(total) }}</div>
            </div>
            <div class="text-right">
              <div :class="$style.k">vs {{ cmpLabel }}</div>
              <div v-if="delta != null" class="w-num" :class="delta <= 0 ? 'w-up' : 'w-down'" style="font-size: 16px;">{{ formatDelta(delta) }}</div>
              <div v-else class="w-num w-faint" style="font-size: 16px;">—</div>
            </div>
          </div>
          <div class="w-row w-row--head" :class="$style.grid">
            <span>Act</span><span class="text-right">Act</span><span class="text-right">Total</span><span class="text-right">±</span>
          </div>
          <div v-for="r in rows" :key="r.act" class="w-row" :class="[$style.grid, r.state === 'current' && $style.now, r.state === 'todo' && 'w-faint']">
            <span class="w-trunc">
              {{ actLabel(r.act) }}
              <span v-if="r.state === 'current'" class="w-faint">now</span>
              <span v-else-if="r.level != null && r.state === 'done'" class="w-faint">lv {{ r.level }}</span>
            </span>
            <span class="text-right w-num" :class="r.gold ? $style.gold : (r.state === 'done' ? 'w-dim' : '')">
              {{ r.segmentMs != null ? formatRunTime(r.segmentMs) : '—' }}
            </span>
            <span class="text-right w-num" :class="r.state !== 'done' && 'w-faint'">
              {{ r.totalMs != null ? formatRunTime(r.totalMs) : (r.cmpTotalMs != null ? formatRunTime(r.cmpTotalMs) : '—') }}
            </span>
            <span class="text-right w-num" :class="r.deltaMs == null ? 'w-faint' : (r.deltaMs <= 0 ? 'w-up' : 'w-down')">
              {{ r.deltaMs != null ? formatDelta(r.deltaMs) : '—' }}
            </span>
          </div>
        </template>

        <template v-else>
          <WEmpty v-if="!config.history.length" icon="fas fa-stopwatch">Finished and abandoned runs show here.</WEmpty>
          <template v-else>
            <div class="w-row w-row--head" :class="$style.histGrid">
              <span>Character</span><span class="text-right">Time</span><span class="text-right">Date</span><span />
            </div>
            <div v-for="r in config.history" :key="r.id" class="w-row cursor-pointer" :class="[$style.histGrid, cmp?.id === r.id && $style.now]"
              :title="isComplete(r) ? 'Race against this run' : 'Unfinished runs can\'t be raced'" @click="pickCompare(r)">
              <span class="w-trunc">
                <template v-if="isComplete(r)">{{ r.charName || 'Unknown' }}</template>
                <span v-else class="w-faint">{{ r.charName || 'Unknown' }} · quit in {{ actLabel(r.act) }}</span>
                <span v-if="r.className && isComplete(r)" class="w-faint"> {{ r.className }} {{ r.level ?? '' }}</span>
                <WChip v-if="pb?.id === r.id" :class="$style.pbChip">PB</WChip>
                <WChip v-else-if="cmp?.id === r.id" active>racing</WChip>
              </span>
              <span class="text-right w-num" :class="!isComplete(r) && 'w-faint'">{{ formatRunTime(runTotal(r) ?? lastSplit(r)) }}</span>
              <span class="text-right w-num w-dim">{{ formatDate(r.startedAt) }}</span>
              <button class="w-icon-btn" title="Delete run" @click.stop="removeRun(r.id)"><i class="fas fa-times text-xs" /></button>
            </div>
          </template>
        </template>

        <template #footer>
          <span v-if="pbTotal != null">PB <span class="w-num">{{ formatRunTime(pbTotal) }}</span></span>
          <span v-if="sob != null">Sum of best <span class="w-num">{{ formatRunTime(sob) }}</span></span>
          <span v-if="config.compareTo != null && cmp && cmp.id !== pb?.id" class="ml-auto">
            <button class="w-accent hover:underline" @click="config.compareTo = null">Race PB instead</button>
          </span>
        </template>
      </WPanel>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { RUN_TIMER_TYPE } from './run-timer'
import type { RunTimerWidget } from './run-timer'

export default {
  widget: {
    type: RUN_TIMER_TYPE,
    instances: 'single',
    trNameKey: 'Campaign run timer'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, onUnmounted } from 'vue'
import { Host } from '@/web/background/IPC'
import { saveConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WTabs, WChip, WEmpty } from '../ui'
import { actLabel, parseLogLine } from './log-parse'
import {
  applyRunEvent, comparisonRun, endRun, formatDelta, formatRunTime, headlineDelta, isComplete,
  pauseRun, personalBest, resumeRun, runElapsed, runTotal, splitRows, startRun, sumOfBest
} from './run-timer'
import type { CampaignRun } from './run-timer'

const props = defineProps<{
  config: RunTimerWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = []
  props.config.wmTitle = 'Campaign run timer'
  props.config.anchor = { pos: 'tc', x: 50, y: 1 }
  props.config.autoStart = true
  props.config.charName = ''
  props.config.expanded = false
  props.config.compareTo = null
  props.config.run = null
  props.config.history = []
  wm.show(props.config.wmId)
}

const tab = shallowRef<'splits' | 'history'>('splits')

const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => { clearInterval(clock) })

const run = computed(() => props.config.run)
const total = computed(() => run.value ? runElapsed(run.value, now.value) : 0)
const cmp = computed(() => comparisonRun(props.config))
const pb = computed(() => personalBest(props.config.history))
const pbTotal = computed(() => pb.value ? runTotal(pb.value) : null)
const sob = computed(() => sumOfBest(props.config.history))
const rows = computed(() => splitRows(run.value, cmp.value, props.config.history, now.value))
const current = computed(() => rows.value.find(r => r.state === 'current'))
const delta = computed(() => headlineDelta(rows.value))
const cmpLabel = computed(() => !cmp.value ? 'PB' : cmp.value.id === pb.value?.id ? 'PB' : formatDate(cmp.value.startedAt))

function start () {
  startRun(props.config, Date.now())
  saveConfig()
}
function togglePause () {
  const r = props.config.run
  if (!r) return
  if (r.runningSince != null) pauseRun(r, Date.now())
  else resumeRun(r, Date.now())
  now.value = Date.now()
  saveConfig()
}
function end () {
  endRun(props.config, Date.now())
  saveConfig()
}
function pickCompare (r: CampaignRun) {
  if (!isComplete(r)) return
  props.config.compareTo = r.id === pb.value?.id ? null : r.id
}
function removeRun (id: number) {
  props.config.history = props.config.history.filter(r => r.id !== id)
  if (props.config.compareTo === id) props.config.compareTo = null
}
function lastSplit (r: CampaignRun) {
  return r.splits.length ? r.splits[r.splits.length - 1].totalMs : r.elapsedMs
}
function formatDate (ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const logListener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
  let changed = false
  const ts = Date.now()
  for (const line of e.lines) {
    const ev = parseLogLine(line)
    if (ev && applyRunEvent(props.config, ev, ts)) changed = true
  }
  if (changed) {
    now.value = ts
    // Log events arrive while the game has focus, when APT doesn't save config.
    saveConfig()
  }
})
onUnmounted(() => { logListener.abort() })
</script>

<style module>
.strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 12px;
  background: var(--w-panel);
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius);
  box-shadow: var(--w-shadow);
  font-size: 12.5px;
  white-space: nowrap;
  color: var(--w-fg);
}
.where { font-size: 14px; max-width: 16rem; }
.sep { width: 1px; align-self: stretch; background: var(--w-line); }
.k {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--w-faint);
}
.time { font-size: 14px; }
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  padding: 8px var(--w-pad);
  border-bottom: 1px solid var(--w-line);
}
.big { font-size: 22px; font-weight: 500; }
.grid { grid-template-columns: minmax(0, 1fr) 3.6rem 4.4rem 3.6rem; }
.histGrid { grid-template-columns: minmax(0, 1fr) 4.4rem 3.8rem 22px; }
.now { background: var(--w-accent-soft); box-shadow: inset 2px 0 0 var(--w-accent); }
.gold { color: var(--w-warn); }
.pbChip { color: var(--w-warn); margin-left: 4px; }
</style>
