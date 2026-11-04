<template>
  <div v-if="scale" :class="$style.wrap">
    <div :class="$style.strip">
      <div :class="$style.axis" />
      <div v-for="b in bands" :key="b.key" :class="$style.band"
        :style="{ left: pct(b.l), width: pct(Math.max(b.r - b.l, 0.012)), background: b.color }"
        :title="b.title" />
      <div v-for="d in dots" :key="d.id" :class="[$style.dot, { [$style.bad]: d.bad }]"
        :style="{ left: pct(d.x) }" :title="d.title" />
      <div v-for="m in marks" :key="m.key" :class="$style.mark"
        :style="{ left: pct(m.x), background: m.color }" :title="m.title" />
      <div v-if="fairX != null" :class="$style.fairLab" :style="{ left: pct(fairX) }">
        <w-price :chaos="fair" :divine="divine" />
      </div>
      <div v-for="t in ticks" :key="t.key" :class="$style.tick" :style="{ left: pct(t.x) }">
        <w-price :chaos="t.chaos" :divine="divine" :unit="unit" />
      </div>
    </div>
    <div :class="$style.legend">
      <span><i :class="$style.ldot" />listing</span>
      <span v-if="hasBad"><i :class="[$style.ldot, $style.bad]" />ignored</span>
      <span v-for="p in otherPoints" :key="p.key" :title="p.note" :class="{ [$style.off]: p.weight === 0 }">
        <i :class="$style.lbar" :style="{ background: SOURCE_COLOR[p.key] }" />{{ p.label }}
        <w-price :chaos="p.mid" :divine="divine" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WPrice } from '../ui'
import { DROP_LABEL, Insight } from './insight'
import { Blend, SourceKey, stripScale } from './sources'

const props = defineProps<{
  insight: Insight
  blend: Blend
  fair: number | null
  divine: number | undefined
}>()

const SOURCE_COLOR: Record<SourceKey, string> = {
  listings: 'var(--w-fg)',
  ninja: 'var(--w-ninja, #7fb2e5)',
  poeprices: 'var(--w-pp, #c9a0f0)',
  mine: 'var(--w-mine, #9fd3c7)'
}

const otherPoints = computed(() => props.blend.points.filter(p => p.key !== 'listings'))

const scale = computed(() => {
  const values = [...props.insight.prices.values()]
  for (const p of otherPoints.value) values.push(p.low, p.high)
  if (props.fair != null) values.push(props.fair)
  return values.length >= 2 ? stripScale(values) : null
})

const pct = (x: number) => `${(x * 100).toFixed(2)}%`

const dots = computed(() => {
  const s = scale.value!
  const out: Array<{ id: string, x: number, bad: boolean, title: string }> = []
  for (const [id, chaos] of props.insight.prices) {
    const reason = props.insight.dropped.get(id)
    out.push({
      id,
      x: s(chaos),
      bad: Boolean(reason),
      title: `${Math.round(chaos * 10) / 10}c${reason ? ` · ignored: ${DROP_LABEL[reason]}` : ''}`
    })
  }
  return out
})
const hasBad = computed(() => dots.value.some(d => d.bad))

const bands = computed(() => {
  const s = scale.value!
  return otherPoints.value
    .filter(p => p.high > p.low)
    .map(p => ({ key: p.key, l: s(p.low), r: s(p.high), color: SOURCE_COLOR[p.key], title: `${p.label}: ${Math.round(p.low)}–${Math.round(p.high)}c. ${p.note}` }))
})

const marks = computed(() => {
  const s = scale.value!
  return otherPoints.value
    .filter(p => p.high <= p.low)
    .map(p => ({ key: p.key, x: s(p.mid), color: SOURCE_COLOR[p.key], title: `${p.label}: ${Math.round(p.mid)}c. ${p.note}` }))
})

const fairX = computed(() => props.fair != null ? scale.value!(props.fair) : null)

const unit = computed(() => {
  const values = [...props.insight.prices.values()]
  return props.divine && values.length && Math.max(...values) >= props.divine ? 'div' : 'chaos'
})

// Cheapest and dearest listing under the line, skipped when they would sit
// on top of the fair label.
const ticks = computed(() => {
  const s = scale.value!
  const values = [...props.insight.prices.values()]
  if (!values.length) return []
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const out = [{ key: 'lo', x: s(lo), chaos: lo }]
  if (hi > lo) out.push({ key: 'hi', x: s(hi), chaos: hi })
  return out
})
</script>

<style module>
.wrap { display: flex; flex-direction: column; gap: 3px; }
.strip { position: relative; height: 46px; margin: 0 14px; }
.axis { position: absolute; left: 0; right: 0; top: 22px; height: 1px; background: var(--w-line-strong); }
.band { position: absolute; top: 16px; height: 13px; border-radius: var(--w-r-sm); opacity: 0.35; }
.dot {
  position: absolute; top: 18px; width: 9px; height: 9px; margin-left: -4.5px;
  border-radius: 50%; background: var(--w-fg); border: 1px solid var(--w-panel);
}
.dot.bad { background: var(--w-down); }
.mark { position: absolute; top: 11px; width: 2px; height: 23px; margin-left: -1px; border-radius: var(--w-r-sm); }
.fairLab {
  position: absolute; top: -3px; transform: translateX(-50%);
  font-size: var(--w-fs-xs); color: var(--w-accent); white-space: nowrap;
}
.fairLab::after {
  content: ''; position: absolute; left: 50%; top: 15px; width: 2px; height: 20px; margin-left: -1px;
  background: var(--w-accent);
}
.tick { position: absolute; top: 32px; transform: translateX(-50%); font-size: var(--w-fs-xs); color: var(--w-faint); white-space: nowrap; }
.tick img { width: 11px !important; height: 11px !important; }
.fairLab img { width: 12px !important; height: 12px !important; }
.legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: var(--w-fs-sm); color: var(--w-dim); }
.legend > span { display: inline-flex; align-items: center; gap: 4px; }
.legend > span.off { text-decoration: line-through; opacity: 0.7; }
.ldot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--w-fg); }
.ldot.bad { background: var(--w-down); }
.lbar { display: inline-block; width: 10px; height: 3px; border-radius: var(--w-r-sm); }
</style>
