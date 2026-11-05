<template>
  <div :class="[$style.card, $style[insight.confidence]]">
    <div :class="$style.hero">
      <div :class="$style.main">
        <template v-if="!insight.range">
          <div :class="$style.eyebrow">
            <span :class="$style.badge">{{ loading ? '…' : blankSearch ? 'NO MODS' : (headline ? 'NO LISTINGS' : 'NO DATA') }}</span>
            <span>{{ loading ? 'Reading listings…' : (headline ? 'Other sources say' : '') }}</span>
          </div>
          <div v-if="!loading && headline" :class="$style.value" :title="blendTitle">
            <w-price :class="[$style.headline, $style.headlinePrice]" :chaos="headline.chaos" :divine="divine" />
          </div>
          <div v-else-if="ninjaInfo" :class="$style.value">
            <ninja-line :chaos="ninjaInfo.chaos" :divine="divine" :url="ninjaInfo.url" />
          </div>
        </template>
        <template v-else>
          <div :class="$style.eyebrow">
            <span :class="$style.badge" :title="CONFIDENCE_HINT[insight.confidence]">{{ CONFIDENCE_LABEL[insight.confidence] }}</span>
            <span class="whitespace-nowrap" :title="blendTitle">{{ lowValue ? `Under ${LOW_VALUE}c` : 'Asking around' }}</span>
            <span v-if="insight.risk !== 'none'" :class="[$style.risk, $style['risk-' + insight.risk]]" :title="riskTitle"
              @click="verdictExpanded = true">⚑ {{ RISK_LABEL[insight.risk] }}</span>
          </div>
          <div :class="$style.value">
            <span v-if="lowValue" :class="$style.headline">Not worth listing</span>
            <w-price v-else :class="[$style.headline, $style.headlinePrice]" :chaos="headline?.chaos ?? insight.range.fair" :divine="divine" />
          </div>
        </template>
      </div>
      <div :class="$style.side">
        <div :class="$style.sideRow">
          <button v-if="ranges.length" type="button" :class="[$style.sparkBtn, { [$style.on]: historyOpen }]"
            :title="historyOpen ? 'Hide price history' : 'Show price history'" @click="historyOpen = !historyOpen">
            <w-spark :values="sparkValues" :width="60" :height="18" />
            <span class="w-num">
              <span :class="$style.sparkSource">{{ SPARK_LABEL[ranges[0]] }}</span>
              <span v-if="sparkChange != null" class="ml-1" :class="sparkChange >= 0 ? 'w-up' : 'w-down'">{{ sparkChange >= 0 ? '+' : '' }}{{ Math.round(sparkChange * 100) }}%</span>
            </span>
          </button>
          <button type="button" class="w-icon-btn" :title="expanded ? 'Show less' : 'Show sources, listing notes and what drives the price'"
            @click="verdictExpanded = !verdictExpanded">
            <i class="fas text-xs" :class="expanded ? 'fa-chevron-up' : 'fa-chevron-down'" />
          </button>
        </div>
        <span v-if="insight.range" :class="$style.count" :title="droppedTitle">{{ countText }}</span>
      </div>
    </div>

    <p v-if="!insight.range && !loading" :class="$style.note">{{ emptyText }}</p>

    <template v-if="insight.range">
      <price-rail v-if="!lowValue" :input="railInput" :divine="divine" />
      <div v-else :class="$style.note" class="w-num">
        Cheapest <w-price :chaos="insight.range.low" :divine="divine" :unit="rangeUnit" />, top of range <w-price :chaos="insight.range.high" :divine="divine" :unit="rangeUnit" />
      </div>
      <div v-if="showSignals" :class="$style.signals">
        <div v-for="s in insight.signals" :key="s.kind" :class="$style.signal"><span :class="$style.flag">⚑</span> {{ s.text }}</div>
      </div>
      <p v-if="accountMissing" :class="$style.note">Your own listings may be counted here. Add your account name in settings to leave them out.</p>
      <div v-if="!lowValue && notes.length" :class="$style.actions">
        <button v-for="n in notes" :key="n.key" type="button" :class="$style.note2"
          :title="'Copy the listing note: ' + n.text" @click="copy(n)">
          <span class="w-dim">{{ n.label }}</span>
          <span class="w-num">{{ copied === n.key ? 'Copied' : n.text }}</span>
        </button>
      </div>
    </template>

    <price-history-chart v-if="historyOpen && ranges.length" :ranges="ranges" :series="series" :divine="divine"
      :from-ninja="Boolean(ninjaInfo)" :loading="leagueLoading" @range="onRange" />

    <div v-if="expanded && blend.points.length" :class="$style.sources">
      <div v-if="blend.points.length > 1" :class="$style.agree">{{ AGREEMENT_SENTENCE[blend.agreement] }}<template v-if="headline?.from === 'blend'">. The headline blends them, listings count most</template></div>
      <div v-for="p in blend.points" :key="p.key" :class="[$style.source, { [$style.off]: p.weight === 0 }]" :title="p.note">
        <span :class="{ [$style.ninjaName]: p.key === 'ninja' }">{{ p.label }}</span>
        <span class="w-num" :class="$style.sourceNote" :title="p.key === 'ninja' && ninjaGapText ? 'Listings disagree with poe.ninja, which averages recent prices. Trust the listings for rolls and corruption, poe.ninja for the going rate.' : undefined">{{ p.weight === 0 ? 'not counted' : (p.key === 'ninja' ? ninjaGapText : '') }}</span>
        <span class="w-num" :class="$style.sourcePrice">
          <w-price :chaos="p.low" :divine="divine" /><template v-if="p.high > p.low">–<w-price :chaos="p.high" :divine="divine" /></template>
        </span>
      </div>
      <a v-if="ninjaInfo" :class="$style.ninjaLink" :href="ninjaInfo.url" target="_blank">Open on poe.ninja ↗</a>
    </div>
    <label v-if="expanded && canAsk" :class="$style.ppToggle">
      <input type="checkbox" v-model="usePoeprices">
      <span>Ask poeprices.info about rares</span>
      <span v-if="ppStatus" class="w-faint">· {{ ppStatus }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, toRef, watch } from 'vue'
import { ParsedItem } from '@/parser'
import { AppConfig } from '@/web/Config'
import { WPrice, WSpark } from '../ui'
import { useCopy } from '../ui/copy'
import NinjaLine from './NinjaLine.vue'
import PriceRail from './PriceRail.vue'
import PriceHistoryChart from './PriceHistoryChart.vue'
import { verdictExpanded, historyOpen } from './view'
import { DROP_LABEL, DropReason, Insight, Confidence, FixRisk, notePrice, noteText } from './insight'
import type { Agreement } from './sources'
import { seriesChange, HistoryRange } from './history'
import { useSmartPrice } from './useSmartPrice'
import { canAskPoeprices, poepricesState, usePoeprices, loadPoeprices } from './check-state'

const props = defineProps<{
  item: ParsedItem
  insight: Insight
  divine: number | undefined
  loading: boolean
  total: number | null
  /** Identifies this search in the price log, or null before it runs. */
  logKey: string | null
  league: string
  /** A rare searched with no mods: any rare would match, so there's no price to give. */
  blankSearch?: boolean
  /** A rare searched without one of its top mods: the price may still be right, "worthless" isn't. */
  skipsTopMods?: boolean
  /** False when the search looks for something poe.ninja's price doesn't cover. */
  ninjaFits: boolean
}>()

const LOW_VALUE = 3
const expanded = computed(() => verdictExpanded.value)

// 'OK', not 'Fair': this rates the data, and 'fair' already means the price.
const CONFIDENCE_LABEL: Record<Confidence, string> = { high: 'SOLID', medium: 'OK', low: 'THIN', none: 'NO DATA' }
const CONFIDENCE_HINT: Record<Confidence, string> = {
  high: 'Plenty of listings that agree with each other',
  medium: 'Some listings, a bit spread out',
  low: 'Few or widely spread listings: treat the price as a rough guess',
  none: 'No usable listings'
}
const RISK_LABEL: Record<FixRisk, string> = { none: '', low: 'fixing risk: low', medium: 'fixing risk: medium', high: 'fixing risk: high' }

const smart = useSmartPrice(toRef(props, 'item'), toRef(props, 'insight'), toRef(props, 'divine'), toRef(props, 'logKey'), toRef(props, 'league'), toRef(props, 'ninjaFits'))
onUnmounted(smart.stop)
const { ninjaInfo, blend, headline, ranges, series, leagueLoading } = smart

// With divine listings left out, what's left may not be the real price: no advice on it.
const missingDivines = computed(() => props.insight.signals.some(s => s.kind === 'norate'))

const lowValue = computed(() => !props.skipsTopMods && !missingDivines.value && (headline.value?.chaos ?? props.insight.range?.fair ?? 0) < LOW_VALUE)

const railInput = computed(() => ({
  low: props.insight.range?.low ?? 0,
  likely: headline.value?.chaos ?? props.insight.range?.fair ?? 0,
  high: props.insight.range?.high ?? 0,
  ninja: ninjaInfo.value?.chaos,
  ninjaSuspect: blend.value.points.some(p => p.key === 'ninja' && p.weight === 0)
}))

// Warnings stay out of the way unless they change what the price means.
const showSignals = computed(() => props.insight.signals.length > 0 && (
  expanded.value || props.insight.risk === 'medium' || props.insight.risk === 'high' ||
  props.insight.signals.some(s => s.kind === 'old' || s.kind === 'norate' || s.kind === 'snipe' || s.kind === 'oneseller')
))

const accountMissing = computed(() => !AppConfig().accountName?.trim())

const SPARK_LABEL: Record<HistoryRange, string> = { week: 'poe.ninja 7d', league: 'poe.ninja', mine: 'My checks' }

// Only worth mentioning when listings and poe.ninja are a quarter or more apart.
const ninjaGapText = computed(() => {
  const fair = props.insight.range?.fair
  const ninja = ninjaInfo.value?.chaos
  if (!fair || !ninja) return ''
  const ratio = fair / ninja - 1
  if (Math.abs(ratio) < 0.25) return ''
  const pct = Math.round(ratio * 100)
  return `listings ${pct > 0 ? '+' : ''}${pct}%`
})

const AGREEMENT_SENTENCE: Record<Agreement, string> = {
  single: 'One source counted',
  agree: 'Sources agree',
  mixed: 'Sources differ a bit',
  disagree: 'Sources disagree'
}

const sparkSeries = computed(() => ranges.value.length ? series(ranges.value[0]) : [])
const sparkValues = computed(() => sparkSeries.value.map(p => p.chaos))
const sparkChange = computed(() => seriesChange(sparkSeries.value))

function onRange (r: HistoryRange) {
  if (r === 'league') smart.loadLeague()
}

const canAsk = computed(() => canAskPoeprices(props.item))
watch(usePoeprices, (on) => { if (on) loadPoeprices(props.item) })
const ppStatus = computed(() => {
  const s = poepricesState.value
  if (!s || s.item !== props.item) return ''
  if (s.status === 'loading') return 'asking…'
  if (s.status === 'error') return s.error ?? 'failed'
  return ''
})

const rangeUnit = computed(() => {
  const r = props.insight.range
  if (!r || !props.divine) return 'chaos'
  return r.high >= props.divine ? 'div' : 'chaos'
})

const emptyText = computed(() => {
  if (props.blankSearch) return 'No mods are ticked, so these listings can\'t price this rare. Tick the mods that matter, then search.'
  if (props.total === 0) return 'Nobody is selling this with these filters'
  const noRate = props.insight.signals.find(s => s.kind === 'norate')
  if (noRate) return noRate.text
  if (props.insight.dropped.size) return 'All listings looked unreliable'
  return 'No listings yet'
})

const countText = computed(() => {
  const used = props.insight.kept.length
  const skipped = props.insight.dropped.size
  return skipped ? `${used} trusted · ${skipped} ignored` : `${used} trusted`
})

const droppedTitle = computed(() => {
  const counts = new Map<DropReason, number>()
  for (const reason of props.insight.dropped.values()) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1)
  }
  if (!counts.size) return 'Every fetched listing was used'
  return Array.from(counts, ([reason, n]) => `${n} × ${DROP_LABEL[reason]}`).join('\n')
})

const riskTitle = computed(() => props.insight.signals.map(s => s.text).join('\n') || 'Some listings look placed to fake the price')

const blendTitle = computed(() => {
  const lines = blend.value.points.map(p =>
    `${p.label}: ${Math.round(p.low)}${p.high > p.low ? '–' + Math.round(p.high) : ''}c${p.weight === 0 ? ' (not counted)' : ''}. ${p.note}`)
  if (headline.value?.from === 'blend') lines.unshift('Blend of every source, listings count most:')
  else if (headline.value?.chaos === props.insight.range?.low) lines.unshift('What sellers ask, since the trade site shows no sales: the cheapest trusted listing.')
  else lines.unshift('What sellers ask, since the trade site shows no sales: the middle of the cheapest trusted listings, counting online and recent sellers more.')
  return lines.join('\n')
})

const notes = computed(() => {
  const s = props.insight.suggest
  if (!s || missingDivines.value) return []
  const fast = noteText(notePrice(s.fast, props.divine))
  // Listings nobody has bought say little: being patient means asking the blended price.
  const oldOnly = props.insight.signals.some(sig => sig.kind === 'old')
  const patient = noteText(notePrice(oldOnly ? Math.max(headline.value?.chaos ?? s.patient, s.patient) : s.patient, props.divine))
  if (fast === patient) return [{ key: 'fast', label: 'List', text: fast }]
  return [
    { key: 'fast', label: 'Sell fast', text: fast },
    { key: 'patient', label: 'Patient', text: patient }
  ]
})

const { copied, copy: copyText } = useCopy(1500)
async function copy (n: { key: string, text: string }) {
  await copyText(n.text, n.key)
}
</script>

<style module>
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* Runs edge to edge: the answer gets its own band across the window. */
  margin: 0 -1rem 8px;
  padding: 10px 1rem;
  border-top: 1px solid var(--w-line-soft);
  border-bottom: 1px solid var(--w-line);
  background: var(--w-pc-well, var(--w-panel-solid));
  color: var(--w-fg);
  font-family: var(--w-body);
  font-size: var(--w-text);
  font-variant-numeric: tabular-nums;
}
.hero { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.main { display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; min-width: 0; }
.side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex: none; }
.sideRow { display: flex; align-items: center; gap: 2px; }
.eyebrow { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; color: var(--w-dim); font-size: 12px; line-height: 16px; }
.value { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
.count { color: var(--w-dim); font-size: var(--w-fs-xs); white-space: nowrap; padding-right: 2px; }
.note { margin: 0; color: var(--w-dim); font-size: 12px; line-height: 17px; }
.badge {
  flex: none;
  font-size: var(--w-fs-xs);
  font-weight: 600;
  letter-spacing: .05em;
  line-height: 14px;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid var(--w-line);
  color: var(--w-dim);
}
.high .badge { color: var(--w-up); border-color: currentColor; }
.medium .badge { color: var(--w-accent); border-color: currentColor; }
.low .badge { color: var(--w-warn); border-color: currentColor; }
.headline {
  font-family: var(--w-head);
  font-size: 22px;
  line-height: 32px;
  color: var(--w-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Fontin's old-style digits dip and rise: a price wants even figures. */
.headlinePrice { font-family: var(--w-num); font-size: 28px; font-weight: 600; letter-spacing: 0; }
.headlinePrice img { width: 24px; height: 24px; }
.risk {
  flex: none;
  font-size: var(--w-fs-xs);
  padding: 0 6px;
  border-radius: var(--w-r-sm);
  border: 1px solid var(--w-line);
  white-space: nowrap;
  cursor: pointer;
}
.risk-low { color: var(--w-dim); }
.risk-medium { color: var(--w-warn); border-color: currentColor; }
.risk-high { color: var(--w-down); border-color: currentColor; }
.sparkBtn {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex: none;
  padding: 3px 6px;
  border-radius: var(--w-r-sm);
  border: 1px solid var(--w-line-soft);
  font-size: var(--w-fs-xs);
  line-height: 14px;
}
.sparkBtn:hover, .sparkBtn.on { border-color: var(--w-line-strong); background: var(--w-panel-3); }
.sparkSource { color: var(--w-dim); }
.signals { display: flex; flex-direction: column; gap: 2px; color: var(--w-dim); }
.signal { font-size: 12px; line-height: 17px; }
.flag { color: var(--w-down); }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.note2 {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 8px;
  border-radius: var(--w-r-sm);
  border: 1px solid var(--w-line);
  background: var(--w-panel-3);
  font-size: 12px;
  white-space: nowrap;
}
.note2:hover { border-color: var(--w-accent); }
.sources { display: flex; flex-direction: column; gap: 2px; padding-top: 6px; border-top: 1px solid var(--w-line-soft); font-size: 12px; color: var(--w-dim); }
.agree { color: var(--w-dim); margin-bottom: 2px; }
.source { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; align-items: center; }
.source.off { opacity: .6; }
.sourceNote { color: var(--w-faint); }
.sourcePrice { display: inline-flex; align-items: center; gap: 2px; color: var(--w-fg); font-weight: 600; }
.ninjaName { color: var(--w-ninja); }
.ninjaLink { color: var(--w-ninja); justify-self: start; }
.ninjaLink:hover { text-decoration: underline; }
.ppToggle { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--w-dim); }
</style>
