<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <div class="flex gap-2 min-h-0 items-start">
      <WPanel :title="config.wmTitle || 'League mechanics'" width="25rem">
        <template #actions>
          <button class="w-icon-btn" :class="{ 'w-icon-btn--on': config.autoSwitch }" @click="config.autoSwitch = !config.autoSwitch"
            :title="config.autoSwitch ? 'Switches tab when you enter a mechanic\'s zone. Click to turn off.' : 'Click to switch tab when you enter a mechanic\'s zone'">
            <i class="fas fa-location-arrow" />
          </button>
        </template>
        <template #tabs>
          <div :class="$style.tabs">
            <WTabs v-model="config.tab" :options="tabOptions" />
          </div>
        </template>
        <template v-if="!prices.snapshot.value" #meta>
          <span style="color: var(--w-warn);"><i class="fas fa-exclamation-triangle" /> Prices come from the Market tracker. Add that widget and wait for its first snapshot.</span>
        </template>

        <template v-if="mech">
          <template v-if="mech.id === 'betrayal'">
            <div :class="$style.toolbar">
              <WSegmented v-model="division" :options="DIVISIONS.map((d, i) => ({ value: String(i), label: d.slice(0, 5) }))" />
              <WButton size="sm" icon="fas fa-th" @click="showBoard = !showBoard">{{ showBoard ? 'Hide board' : 'Board' }}</WButton>
            </div>
            <div class="w-row w-row--head" :class="$style.btrGrid"><span /><span>Member</span><span>{{ DIVISIONS[Number(division)] }} reward</span><span class="text-right">Best</span></div>
            <div v-for="row in betrayalRows" :key="row.key" class="w-row" :class="$style.btrGrid">
              <button class="w-icon-btn" :class="{ 'w-icon-btn--on': row.starred }" @click="toggleStar(row.key)" :title="row.starred ? 'Unstar' : 'Star this slot'">
                <i :class="row.starred ? 'fas fa-star' : 'far fa-star'" />
              </button>
              <span class="w-trunc">{{ row.member }}</span>
              <span class="w-trunc w-dim" :title="row.priced.bestName ? `Best: ${row.priced.bestName}` : undefined">{{ row.reward }}</span>
              <WPrice :chaos="row.priced.chaos" :divine="divine" class="justify-end" :class="{ 'w-up': row.hot }" />
            </div>
          </template>

          <template v-else>
            <div v-if="pick" :class="$style.verdict">
              Best: <b>{{ pick.best.item.name }}</b>
              <span class="w-dim">(<WPrice :chaos="pick.best.chaos" :divine="divine" />{{ pick.best.unit > 1 ? ` per ${pick.best.unit}` : '' }})</span>
              <template v-if="pick.next">, then {{ pick.next.item.name }}</template>
            </div>
            <template v-for="g in groups" :key="g.label">
              <div class="w-group-label">{{ g.label }}</div>
              <WEmpty v-if="!g.rows.length && prices.snapshot.value" icon="fas fa-question" class="py-2">poe.ninja has no prices for these yet.</WEmpty>
              <div v-for="(row, i) in g.rows" :key="row.item.name" class="w-row" :class="$style.priceGrid">
                <span class="w-trunc">
                  {{ row.item.name }}<span v-if="row.tag" class="w-faint ml-1 text-xs">{{ row.tag }}</span>
                  <span v-if="i === 0" class="w-up ml-1" :class="$style.best">best</span>
                </span>
                <span :class="$style.bar"><i :style="{ width: barWidth(row.chaos, g.max) }" /></span>
                <WPrice :chaos="row.chaos" :divine="divine" class="justify-end" />
              </div>
            </template>
          </template>

          <template v-if="scarabs.length">
            <div class="w-group-label">Scarabs</div>
            <div :class="$style.chips">
              <WChip v-for="s in scarabs" :key="s.item.name" :title="s.item.name">
                <span class="w-trunc" style="max-width: 14rem;">{{ shortScarab(s.item.name) }}</span>
                <WPrice :chaos="s.chaos" :divine="divine" />
              </WChip>
            </div>
          </template>

          <ul :class="$style.tips">
            <li v-for="tip in mech.tips" :key="tip">{{ tip }}</li>
          </ul>
        </template>
        <template #footer>
          <span>Prices from poe.ninja</span>
          <span v-if="snapshotAge" class="w-faint">· {{ snapshotAge }}</span>
        </template>
      </WPanel>

      <WPanel v-if="mech?.id === 'betrayal' && showBoard" title="Syndicate board" width="auto" :class="$style.boardPanel">
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
              <span v-if="boardPrice(m, di) != null" class="w-num text-xs" :class="isHot(boardPrice(m, di)) ? 'w-up' : 'w-faint'">
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
import { inject, computed, shallowRef } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WTabs, WSegmented, WButton, WPrice, WChip, WEmpty, WField } from '../ui'
import { usePriceIndex } from '../market/price-index'
import { MECHANICS, mechanicById, priceGroup, priceScarabs, verdict } from './data'
import { DIVISIONS, MEMBERS, REWARDS, priceReward, slotKey } from './betrayal'
import { useMechanicZone } from './zone'

const props = defineProps<{
  config: MechanicsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'League mechanics'
  props.config.anchor = { pos: 'tl', x: 40, y: 20 }
  props.config.tab = 'delve'
  props.config.autoSwitch = true
  props.config.hidden = []
  props.config.betrayalStars = []
  props.config.betrayalOverrides = {}
  wm.show(props.config.wmId)
}

const prices = usePriceIndex()
const items = computed(() => prices.snapshot.value?.items ?? [])
const divine = computed(() => prices.snapshot.value?.divine ?? null)

const visible = computed(() => MECHANICS.filter(m => !props.config.hidden.includes(m.id)))
const tabOptions = computed(() => visible.value.map(m => ({ value: m.id, label: m.label })))
const mech = computed(() => mechanicById(props.config.tab) ?? visible.value[0])

useMechanicZone((id) => {
  if (props.config.autoSwitch && !props.config.hidden.includes(id)) props.config.tab = id
})

const groups = computed(() => (mech.value?.groups ?? []).map(g => {
  const rows = priceGroup(g, items.value)
  return { label: g.unit ? `${g.label} (per ${g.unit})` : g.label, rows, max: rows[0]?.chaos ?? 0 }
}))
const pick = computed(() => mech.value ? verdict(mech.value, items.value) : null)
const scarabs = computed(() => mech.value?.scarabs ? priceScarabs(mech.value.scarabs, items.value) : [])

function barWidth (chaos: number, max: number) {
  return max > 0 ? `${Math.max(3, chaos / max * 100)}%` : '0%'
}

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

const boardPrices = computed(() => {
  const out = new Map<string, number>()
  for (const m of MEMBERS) {
    DIVISIONS.forEach((_, di) => {
      const p = priceReward(rewardText(m, di), items.value)
      if (p.chaos != null) out.set(slotKey(m, di), p.chaos)
    })
  }
  return out
})
const hotCut = computed(() => {
  const vals = [...boardPrices.value.values()].sort((a, b) => b - a)
  return vals.length ? vals[Math.max(0, Math.ceil(vals.length * 0.1) - 1)] : Infinity
})
function boardPrice (m: string, di: number) { return boardPrices.value.get(slotKey(m, di)) ?? null }
function isHot (chaos: number | null) { return chaos != null && chaos >= hotCut.value }

const betrayalRows = computed(() => {
  const di = Number(division.value)
  return MEMBERS.map(member => {
    const key = slotKey(member, di)
    const reward = rewardText(member, di)
    const priced = priceReward(reward, items.value)
    return { key, member, reward, priced, starred: props.config.betrayalStars.includes(key), hot: isHot(priced.chaos ?? null) }
  }).sort((a, b) => Number(b.starred) - Number(a.starred) || (b.priced.chaos ?? -1) - (a.priced.chaos ?? -1))
})

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
.tabs { overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tabs > * { flex-wrap: nowrap; white-space: nowrap; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px var(--w-pad) 4px; }
.verdict {
  margin: 8px var(--w-pad) 4px;
  padding: 6px 10px;
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-radius-sm);
  background: var(--w-accent-soft);
}
.verdict b { color: var(--w-accent); font-weight: 600; }
.priceGrid { grid-template-columns: minmax(0, 1fr) 80px 72px; }
.btrGrid { grid-template-columns: 22px 76px minmax(0, 1fr) 64px; }
.best { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }
.bar { height: 5px; border-radius: 3px; background: var(--w-panel-3); overflow: hidden; }
.bar > i { display: block; height: 100%; background: var(--w-accent); opacity: 0.75; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; padding: 2px var(--w-pad) 6px; }
.tips {
  margin: 6px var(--w-pad) 10px;
  padding: 6px 10px 6px 24px;
  list-style: disc;
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-radius-sm);
  display: grid;
  gap: 3px;
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
</style>
