<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="flex gap-2 min-h-0 items-start">
      <!-- Collapsed: a small see-through icon; hovering it shows the glance card. -->
      <div v-if="!config.expanded" ref="glanceEl" :class="$style.glanceRoot">
        <button v-if="!showGlance" type="button" :class="$style.icon" :title="`League mechanics: ${mech.label}`" @click="config.expanded = true">
          <i :class="mech.icon" />
        </button>

        <WPanel v-else width="19rem" max-height="60vh">
          <template #title>{{ mech.label }}</template>
          <template v-if="wm.active.value" #actions>
            <button class="w-icon-btn" title="Previous mechanic" @click="step(-1)"><i class="fas fa-chevron-left" /></button>
            <button class="w-icon-btn" title="Next mechanic" @click="step(1)"><i class="fas fa-chevron-right" /></button>
            <button class="w-icon-btn" title="Expand" @click="config.expanded = true"><i class="fas fa-expand-alt" /></button>
          </template>
          <div v-if="!hasPrices" :class="$style.warn"><i class="fas fa-exclamation-triangle" /> Add the Market tracker widget for prices.</div>
          <template v-if="mech.id === 'betrayal'">
            <div class="w-group-label">{{ starredGlance.length ? 'Starred slots' : 'Most valuable slots' }}</div>
            <div v-for="row in glanceBetrayal" :key="row.key" class="w-row" :class="$style.glanceBtr">
              <span class="w-trunc"><span class="w-accent">{{ row.member }}</span> · {{ row.reward }}</span>
              <WPrice :chaos="row.chaos" :divine="divine" class="justify-end" />
            </div>
          </template>
          <MechanicPrices v-else :mech="mech" :items="items" :divine="divine" :top="3" />
          <div v-if="scarabs.length" :class="$style.chips">
            <WChip v-for="s in scarabs.slice(0, 2)" :key="s.item.name" :title="s.item.name">
              <span class="w-trunc" style="max-width: 10rem;">{{ shortScarab(s.item.name) }}</span>
              <WPrice :chaos="s.chaos" :divine="divine" />
            </WChip>
          </div>
        </WPanel>
      </div>

      <!-- Expanded: rail of mechanics, prices, then scarabs and tips. -->
      <WPanel v-else :title="config.wmTitle || 'League mechanics'" width="40rem" max-height="70vh" :scroll="false">
        <template #actions>
          <button class="w-icon-btn" :class="{ 'w-icon-btn--on': config.autoSwitch }" @click="config.autoSwitch = !config.autoSwitch"
            :title="config.autoSwitch ? 'Switches mechanic when you enter its zone. Click to turn off.' : 'Click to switch mechanic when you enter its zone'">
            <i class="fas fa-location-arrow" />
          </button>
          <button class="w-icon-btn" title="Collapse to icon" @click="collapse"><i class="fas fa-compress-alt" /></button>
        </template>
        <div :class="$style.split">
          <div :class="$style.rail" class="w-scroll" role="tablist">
            <button v-for="m in visible" :key="m.id" type="button" role="tab" :aria-selected="m.id === mech.id"
              :class="[$style.railBtn, { [$style.railOn]: m.id === mech.id }]" :title="m.label" @click="config.tab = m.id">
              <i :class="m.icon" /><span>{{ m.short }}</span>
              <i v-if="m.id === zoneMech" :class="$style.dot" title="Your current zone" />
            </button>
          </div>

          <div class="w-scroll" :class="$style.col">
            <div v-if="!hasPrices" :class="$style.warn"><i class="fas fa-exclamation-triangle" /> Prices come from the Market tracker. Add that widget and wait for its first snapshot.</div>
            <template v-if="mech.id === 'betrayal'">
              <div :class="$style.toolbar">
                <WSegmented v-model="division" :options="DIVISIONS.map((d, i) => ({ value: String(i), label: d.slice(0, 5) }))" />
              </div>
              <div v-for="row in betrayalRows" :key="row.key" class="w-row" :class="$style.btrGrid">
                <button class="w-icon-btn" :class="{ 'w-icon-btn--on': row.starred }" @click="toggleStar(row.key)" :title="row.starred ? 'Unstar' : 'Star this slot'">
                  <i :class="row.starred ? 'fas fa-star' : 'far fa-star'" />
                </button>
                <span class="w-trunc">{{ row.member }}</span>
                <span class="w-trunc w-dim" :title="rewardTitle(row)">{{ row.reward }}</span>
                <WPrice :chaos="row.chaos" :divine="divine" class="justify-end" :class="{ 'w-up': isHot(row.chaos) }" />
              </div>
            </template>
            <MechanicPrices v-else :mech="mech" :items="items" :divine="divine" />
          </div>

          <div class="w-scroll" :class="$style.col">
            <div v-if="mech.id === 'betrayal'" :class="$style.toolbar">
              <WButton size="sm" icon="fas fa-th" @click="showBoard = !showBoard">{{ showBoard ? 'Hide board' : 'Full board' }}</WButton>
            </div>
            <template v-if="scarabs.length">
              <div class="w-group-label">Scarabs</div>
              <div v-for="s in scarabs" :key="s.item.name" class="w-row" :class="$style.scarabGrid">
                <span class="w-trunc" :title="s.item.name">{{ shortScarab(s.item.name) }}</span>
                <WPrice :chaos="s.chaos" :divine="divine" class="justify-end" />
              </div>
            </template>
            <div class="w-group-label">Rules of thumb</div>
            <ul :class="$style.tips">
              <li v-for="tip in mech.tips" :key="tip">{{ tip }}</li>
            </ul>
          </div>
        </div>
        <template #footer>
          <span>Prices from poe.ninja</span>
          <span v-if="snapshotAge" class="w-faint">· {{ snapshotAge }}</span>
        </template>
      </WPanel>

      <WPanel v-if="config.expanded && mech.id === 'betrayal' && showBoard" title="Syndicate board" width="auto" :class="$style.boardPanel">
        <template #actions>
          <WField v-model="boardQuery" icon="fas fa-search" placeholder="Search rewards" style="width: 12rem;" />
          <button class="w-icon-btn" @click="showBoard = false" title="Close"><i class="fas fa-times" /></button>
        </template>
        <div :class="$style.board">
          <span />
          <span v-for="m in MEMBERS" :key="m" :class="$style.boardHead">{{ m }}</span>
          <template v-for="(d, di) in DIVISIONS" :key="d">
            <span :class="$style.boardDiv">{{ d }}</span>
            <button v-for="m in MEMBERS" :key="m" type="button"
              :class="[$style.cell, {
                [$style.cellOn]: config.betrayalStars.includes(slotKey(m, di)),
                [$style.cellDim]: !boardMatch(m, d, rewardText(m, di))
              }]"
              @click="toggleStar(slotKey(m, di))">
              <span>{{ rewardText(m, di) }}</span>
              <span v-if="boardPrice(m, di) != null" class="text-xs" :class="isHot(boardPrice(m, di)) ? 'w-up' : 'w-faint'">
                <WPrice :chaos="boardPrice(m, di)" :divine="divine" />
              </span>
            </button>
          </template>
        </div>
        <template #footer><span>Click a slot to star it. Rewards from the 3.24 sheet; green = top 10% by value now.</span></template>
      </WPanel>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { MECHANICS_TYPE } from './widget'
import type { MechanicsWidget } from './widget'

export default {
  widget: {
    type: MECHANICS_TYPE,
    instances: 'multi',
    trNameKey: 'League mechanics'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch, onUnmounted } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WSegmented, WButton, WPrice, WChip, WField } from '../ui'
import { usePriceIndex } from '../market/price-index'
import { useHoverZone } from '../shared/hover'
import MechanicPrices from './MechanicPrices.vue'
import { MECHANICS, mechanicById, priceScarabs } from './data'
import { DIVISIONS, MEMBERS, REWARDS, priceReward, slotKey } from './betrayal'
import { useMechanicZone } from './zone'

const props = defineProps<{
  config: MechanicsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  // No 'invisible-on-blur': the icon stays on screen while you play.
  props.config.wmFlags = []
  props.config.wmTitle = 'League mechanics'
  props.config.anchor = { pos: 'tl', x: 2, y: 30 }
  props.config.tab = 'delve'
  props.config.expanded = false
  props.config.autoSwitch = true
  props.config.hidden = []
  props.config.betrayalStars = []
  props.config.betrayalOverrides = {}
  wm.show(props.config.wmId)
}

const prices = usePriceIndex()
const items = computed(() => prices.snapshot.value?.items ?? [])
const divine = computed(() => prices.snapshot.value?.divine ?? null)
const hasPrices = computed(() => items.value.length > 0)

const visible = computed(() => MECHANICS.filter(m => !props.config.hidden.includes(m.id)))
const mech = computed(() => {
  const m = mechanicById(props.config.tab)
  return (m && !props.config.hidden.includes(m.id)) ? m : (visible.value[0] ?? MECHANICS[0])
})

function step (dir: number) {
  const list = visible.value
  const i = list.findIndex(m => m.id === mech.value.id)
  props.config.tab = list[(i + dir + list.length) % list.length].id
}

const zoneMech = shallowRef<string | null>(null)
useMechanicZone((id) => {
  zoneMech.value = id
  if (props.config.autoSwitch && !props.config.hidden.includes(id)) props.config.tab = id
})

// ---- Glance (hover) ----
const glanceEl = shallowRef<HTMLElement | null>(null)
// Read-only over the game: making it clickable would pull the whole overlay up
// and take focus from the game. Its buttons appear when the overlay is open.
const hovering = useHoverZone(glanceEl, {
  enabled: () => !props.config.expanded
})
// Small delay before closing so moving between icon and card doesn't flicker.
const showGlance = shallowRef(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null
watch(hovering, (on) => {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
  if (on) showGlance.value = true
  else closeTimer = setTimeout(() => { showGlance.value = false }, 250)
})
onUnmounted(() => { if (closeTimer) clearTimeout(closeTimer) })

function collapse () {
  props.config.expanded = false
  showGlance.value = false
}

const scarabs = computed(() => mech.value.scarabs ? priceScarabs(mech.value.scarabs, items.value) : [])

function shortScarab (name: string) {
  return name.replace(/ Scarab( of)?/, ':').replace(/:$/, '')
}

const snapshotAge = computed(() => {
  const ts = prices.snapshot.value?.ts
  if (!ts) return ''
  const min = Math.round((Date.now() - ts) / 60000)
  return min < 60 ? `${min}m ago` : `${Math.round(min / 60)}h ago`
})

// ---- Betrayal ----
const division = shallowRef('2')
const showBoard = shallowRef(false)
const boardQuery = shallowRef('')

function rewardText (member: string, di: number) {
  return props.config.betrayalOverrides[slotKey(member, di)] || REWARDS[member][di]
}

const slots = computed(() => MEMBERS.flatMap(member => DIVISIONS.map((_, di) => {
  const key = slotKey(member, di)
  const reward = rewardText(member, di)
  const priced = priceReward(reward, items.value)
  return { key, member, di, reward, chaos: priced.chaos ?? null, bestName: priced.bestName, upTo: priced.upTo, count: priced.count, starred: props.config.betrayalStars.includes(key) }
})))
const slotByKey = computed(() => new Map(slots.value.map(s => [s.key, s])))

const hotCut = computed(() => {
  const vals = slots.value.map(s => s.chaos).filter((c): c is number => c != null).sort((a, b) => b - a)
  return vals.length ? vals[Math.max(0, Math.ceil(vals.length * 0.1) - 1)] : Infinity
})
function rewardTitle (row: { bestName?: string, upTo?: number, count?: number, chaos: number | null }) {
  if (!row.bestName || row.upTo == null) return undefined
  if ((row.count ?? 1) <= 1) return row.bestName
  return `Typical value (median of ${row.count} possible items). Up to ${Math.round(row.upTo)}c: ${row.bestName}`
}

function boardPrice (m: string, di: number) { return slotByKey.value.get(slotKey(m, di))?.chaos ?? null }
function isHot (chaos: number | null) { return chaos != null && chaos >= hotCut.value }

const betrayalRows = computed(() => slots.value
  .filter(s => s.di === Number(division.value))
  .sort((a, b) => Number(b.starred) - Number(a.starred) || (b.chaos ?? -1) - (a.chaos ?? -1)))

const starredGlance = computed(() => slots.value.filter(s => s.starred))
const glanceBetrayal = computed(() => (starredGlance.value.length
  ? [...starredGlance.value]
  : slots.value.filter(s => s.chaos != null)
).sort((a, b) => (b.chaos ?? -1) - (a.chaos ?? -1)).slice(0, 4))

function toggleStar (key: string) {
  const stars = props.config.betrayalStars
  props.config.betrayalStars = stars.includes(key) ? stars.filter(k => k !== key) : [...stars, key]
}

function boardMatch (member: string, div: string, reward: string) {
  const q = boardQuery.value.trim().toLowerCase()
  if (!q) return true
  return member.toLowerCase().includes(q) || div.toLowerCase().includes(q) || reward.toLowerCase().includes(q)
}
</script>

<style module>
.glanceRoot { display: inline-block; }
.icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 15px;
  color: var(--w-accent);
  background: color-mix(in srgb, var(--w-panel) 45%, transparent);
  border: 1px solid var(--w-line);
  opacity: 0.55;
  transition: opacity 0.15s;
}
.icon:hover { opacity: 1; }
.warn { color: var(--w-warn); padding: 6px var(--w-pad); font-size: 12px; }
.glanceBtr { grid-template-columns: minmax(0, 1fr) 64px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px var(--w-pad) 8px; }
.split {
  display: grid;
  grid-template-columns: 52px minmax(0, 1.3fr) minmax(0, 1fr);
  min-height: 0;
  height: 60vh;
  max-height: 30rem;
}
.rail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 4px;
  border-right: 1px solid var(--w-line);
}
.railBtn {
  position: relative;
  width: 42px;
  min-height: 38px;
  display: grid;
  place-items: center;
  gap: 1px;
  padding: 3px 0;
  border-radius: var(--w-radius-sm);
  color: var(--w-dim);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.railBtn > i:first-child { font-size: 14px; }
.railBtn:hover { color: var(--w-fg); background: var(--w-panel-3); }
.railOn { color: var(--w-accent); background: var(--w-accent-soft); }
.dot { position: absolute; top: 4px; right: 5px; width: 6px; height: 6px; border-radius: 50%; background: var(--w-up); }
.col { min-height: 0; }
.col + .col { border-left: 1px solid var(--w-line); }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px var(--w-pad) 4px; }
.btrGrid { grid-template-columns: 22px 70px minmax(0, 1fr) 60px; }
.scarabGrid { grid-template-columns: minmax(0, 1fr) 64px; }
.tips {
  margin: 2px var(--w-pad) 10px;
  padding: 6px 10px 6px 24px;
  list-style: disc;
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius-sm);
  display: grid;
  gap: 4px;
}
.tips li::marker { color: var(--w-accent); }
.boardPanel { max-width: 70vw; }
.board {
  display: grid;
  grid-template-columns: 96px repeat(17, minmax(80px, 1fr));
  font-size: 11.5px;
  overflow-x: auto;
}
.boardHead {
  padding: 6px 4px;
  text-align: center;
  font-family: var(--w-head);
  border-bottom: 1px solid var(--w-line);
  position: sticky;
  top: 0;
  background: var(--w-panel-2);
}
.boardDiv {
  padding: 6px 8px;
  color: var(--w-accent);
  font-family: var(--w-head);
  border-right: 1px solid var(--w-line);
  position: sticky;
  left: 0;
  background: var(--w-panel-2);
}
.cell {
  display: grid;
  gap: 2px;
  align-content: start;
  text-align: left;
  min-height: 56px;
  padding: 5px;
  border-right: 1px solid var(--w-line-soft);
  border-bottom: 1px solid var(--w-line-soft);
}
.cell:hover { background: var(--w-accent-soft); }
.cellOn { background: var(--w-accent-soft); box-shadow: inset 0 0 0 1px var(--w-line-strong); }
.cellDim { opacity: 0.28; }
@media (prefers-reduced-motion: reduce) { .icon { transition: none; } }
</style>
