<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false" :readonly="true">
    <WPanel :title="config.wmTitle || 'Lab gems'" width="30rem">
      <template #tabs>
        <WTabs v-model="config.view" :options="[{ value: 'color', label: 'Colour roll' }, { value: 'specific', label: 'Specific gem' }]" />
      </template>
      <template #toolbar>
        <WSelect v-model="config.gemState" :options="GEM_STATES.map(s => ({ value: s, label: stateLabel(s) }))" title="Gem level / quality" />
        <WSegmented v-if="config.view === 'color'" :model-value="String(config.topN)"
          :options="[{ value: '3', label: 'Top 3' }, { value: '5', label: 'Top 5' }, { value: '8', label: 'Top 8' }]"
          @update:model-value="config.topN = Number($event)" />
        <template v-else>
          <WSelect v-model="config.specificMode" title="Whether the font lets you choose the transfigured version or gives a random one"
            :options="[{ value: 'choose', label: 'I choose the version' }, { value: 'random', label: 'Random version' }]" />
          <WField v-model="config.minProfit" type="number" suffix="c profit min" style="width: 9rem;" />
        </template>
      </template>
      <template #meta>
        <template v-if="snapshot">
          <span>{{ snapshot.league }}</span><span class="w-faint">·</span>
          <span>{{ priceCount }} gem prices</span><span class="w-faint">·</span>
          <span>updated {{ ago(snapshot.ts) }}</span>
        </template>
        <span v-else>Waiting for poe.ninja prices (open the Market tracker once, or price check anything)…</span>
      </template>

      <template v-if="config.view === 'color'">
        <div v-for="(roll, i) in rolls" :key="roll.color" class="pb-1">
          <div class="w-row" :class="$style.poolGrid">
            <span :class="[$style.dot, $style[roll.color]]" />
            <span>{{ COLOR_NAMES[roll.color] }} pool</span>
            <span class="w-faint text-xs whitespace-nowrap">{{ roll.listed }}/{{ roll.poolSize }} priced · each {{ pct(roll.chanceEach) }}</span>
            <span class="w-num text-right" :class="i === 0 ? 'w-up' : ''" title="Expected value of the best of the 3 offered gems">EV {{ fmt(roll.ev) }}</span>
          </div>
          <div v-for="g in roll.top" :key="g.name" class="w-row" :class="$style.gemGrid">
            <span class="w-trunc w-rarity-gem">{{ g.name }}</span>
            <WPrice :chaos="g.chaos ?? 0" :divine="snapshot?.divine" />
          </div>
        </div>
        <div class="w-faint text-xs py-2" style="padding-left: var(--w-pad); padding-right: var(--w-pad);">
          The font shows 3 random transfigured gems of the colour you insert and you take one.
          EV assumes you take the most valuable; unpriced gems count as 0.
        </div>
      </template>

      <template v-else>
        <WEmpty v-if="!picks.length" icon="fas fa-gem">No gems match.</WEmpty>
        <template v-else>
          <div class="w-row w-row--head" :class="$style.pickGrid"><span /><span>Base gem</span><span class="text-right">Base</span><span class="text-right">Value</span><span class="text-right">Profit</span></div>
          <template v-for="p in picks" :key="p.baseName">
            <button class="w-row w-full text-left" :class="$style.pickGrid" @click="toggle(p.baseName)">
              <span :class="[$style.dot, $style[p.color]]" />
              <span class="w-trunc">{{ p.baseName }} <i class="fas text-xs w-faint" :class="expanded === p.baseName ? 'fa-chevron-up' : 'fa-chevron-down'" /></span>
              <span class="text-right w-dim" title="Base gem price"><WPrice v-if="p.baseChaos != null" :chaos="p.baseChaos" :divine="snapshot?.divine" /><template v-else>?</template></span>
              <WPrice :chaos="value(p)" :divine="snapshot?.divine" />
              <span class="text-right w-up w-num" title="Profit after buying the base gem">+<WPrice :chaos="profit(p)" :divine="snapshot?.divine" /></span>
            </button>
            <template v-if="expanded === p.baseName">
              <div v-for="v in p.variants" :key="v.name" class="w-row" :class="$style.gemGrid" style="padding-left: calc(var(--w-pad) + 18px);">
                <span class="w-trunc w-rarity-gem">{{ v.name }}</span>
                <WPrice :chaos="v.chaos" :divine="snapshot?.divine" />
              </div>
            </template>
          </template>
        </template>
      </template>

      <template #footer>
        <span>Maths from GemCheck (MIT) · poe.ninja prices, uncorrupted only</span>
      </template>
    </WPanel>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { LAB_GEMS_TYPE } from './widget'

export default {
  widget: {
    type: LAB_GEMS_TYPE,
    instances: 'multi',
    trNameKey: 'Lab gems'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch, onUnmounted } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WTabs, WSelect, WSegmented, WField, WPrice, WEmpty } from '../ui'
import { useLeagues } from '@/web/background/Leagues'
import { useMarketCollector } from '../market/collector'
import { latestSnapshots } from '../market/db'
import { formatChaos } from '../market/analysis'
import type { Snapshot } from '../market/types'
import { GEM_STATES, colorRolls, gemPrices, pickProfit, pickValue, specificPicks } from './font'
import type { GemColor, GemState, SpecificPick } from './font'
import type { LabGemsWidget } from './widget'

const props = defineProps<{
  config: LabGemsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Lab gems'
  props.config.anchor = { pos: 'tl', x: 45, y: 20 }
  props.config.view = 'color'
  props.config.gemState = '20/20'
  props.config.specificMode = 'choose'
  props.config.topN = 5
  props.config.minProfit = 0
  wm.show(props.config.wmId)
}

const COLOR_NAMES: Record<GemColor, string> = { r: 'Red', g: 'Green', b: 'Blue' }

const collector = useMarketCollector({ poll: true })
const leagues = useLeagues()
const league = computed(() => leagues.selectedId.value)

const snapshot = shallowRef<Snapshot | null>(null)
const expanded = shallowRef<string | null>(null)
const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 60 * 1000)
onUnmounted(() => { clearInterval(clock) })

async function load () {
  if (!league.value) { snapshot.value = null; return }
  try {
    const [snap] = await latestSnapshots(league.value, 1)
    snapshot.value = snap ?? null
  } catch {
    snapshot.value = null
  }
}
watch([league, collector.revision], load, { immediate: true })

const prices = computed(() => snapshot.value ? gemPrices(snapshot.value.items, props.config.gemState) : new Map<string, number>())
const priceCount = computed(() => prices.value.size)
const rolls = computed(() => colorRolls(prices.value, props.config.topN || 5))
const picks = computed(() => {
  const mode = props.config.specificMode
  return specificPicks(prices.value)
    .filter(p => pickValue(p, mode) > 0 && pickProfit(p, mode) >= (props.config.minProfit || 0))
    .sort((a, b) => pickProfit(b, mode) - pickProfit(a, mode))
    .slice(0, 60)
})

function value (p: SpecificPick) { return pickValue(p, props.config.specificMode) }
function profit (p: SpecificPick) { return pickProfit(p, props.config.specificMode) }
function toggle (name: string) { expanded.value = expanded.value === name ? null : name }
function fmt (chaos: number) { return formatChaos(chaos, snapshot.value?.divine ?? null) }
function pct (p: number) { return `${(p * 100).toFixed(1)}%` }

function stateLabel (s: GemState) {
  const [level, quality] = s.split('/')
  return `Level ${level}${quality ? ` / ${quality}%` : ' / 0%'}`
}

function ago (ts: number) {
  const min = Math.max(0, Math.round((now.value - ts) / 60000))
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  return `${Math.round(min / 60)} h ago`
}
</script>

<style module>
.poolGrid { grid-template-columns: 10px minmax(0, 1fr) auto 84px; }
.gemGrid { grid-template-columns: minmax(0, 1fr) 76px; padding-left: calc(var(--w-pad) + 18px); }
.pickGrid { grid-template-columns: 10px minmax(0, 1fr) 70px 70px 76px; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex: none; }
.r { background: #d0533f; }
.g { background: #57b04d; }
.b { background: #4f7ed6; }
</style>
