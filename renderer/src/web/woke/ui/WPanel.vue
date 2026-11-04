<template>
  <div ref="root" class="w-surface w-enter" :class="$style.panel" :style="{ width, maxHeight }" data-w-panel
    @keydown="onKey">
    <div v-if="title || $slots.title || $slots.actions || icon" :class="$style.head" data-widget-drag>
      <WIcon v-if="icon" v-bind="iconProps" size="md" :class="$style.icon" />
      <span :class="$style.title" class="w-trunc">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="updated != null || hotkey || $slots.actions" :class="$style.actions">
        <span v-if="updated != null" :class="[$style.age, $style[fresh]]" :title="ageTitle">
          <span :class="$style.dot" />{{ busy ? 'refreshing' : ago(updated) }}
        </span>
        <WKbd v-if="hotkey" :keys="hotkey" :title="`Opens with ${hotkey}`" />
        <slot name="actions" />
      </span>
      <span v-if="busy" :class="$style.busy" aria-hidden="true" />
    </div>
    <div v-if="$slots.banner"><slot name="banner" /></div>
    <div v-if="$slots.tabs" :class="$style.tabs"><slot name="tabs" /></div>
    <div v-if="$slots.toolbar" :class="$style.toolbar"><slot name="toolbar" /></div>
    <div v-if="$slots.meta" :class="$style.meta"><slot name="meta" /></div>
    <div :class="[$style.body, { 'w-scroll': scroll, 'w-stale': stale }]"><slot /></div>
    <div v-if="$slots.footer" :class="$style.footer"><slot name="footer" /></div>
  </div>
</template>

<script setup lang="ts">
// Widget shell for every woke module (pick H2): game icon, title, data age and
// the hotkey that opens it, then optional banner/tabs/toolbar/meta, a
// scrolling body and a footer. Keyboard (P8): arrow keys move between rows,
// "/" jumps to the first search field, Esc leaves a field.
import { computed, ref } from 'vue'
import WIcon from './WIcon.vue'
import WKbd from './WKbd.vue'
import { ago, freshness } from './format'

const props = withDefaults(defineProps<{
  title?: string
  width?: string
  maxHeight?: string
  scroll?: boolean
  // Game art for the header: a mechanic id ("essence", "lab"), a currency
  // ("divine"), or an image path.
  icon?: string
  // When the data was fetched (ms). Shows its age with a fresh/aging/stale dot.
  updated?: number | null
  // Fresh/stale thresholds in minutes for `updated`.
  freshMin?: number
  staleMin?: number
  hotkey?: string | null
  // A refresh is running: keeps the rows and shows a thin bar (pick L2).
  busy?: boolean
  // Rows are old data shown under an error banner: dims the body.
  stale?: boolean
}>(), {
  title: undefined,
  width: undefined,
  maxHeight: '75vh',
  scroll: true,
  icon: undefined,
  updated: undefined,
  freshMin: 15,
  staleMin: 120,
  hotkey: undefined,
  busy: false,
  stale: false
})

const root = ref<HTMLElement | null>(null)

const iconProps = computed(() => {
  const i = props.icon!
  if (i.startsWith('/') || i.startsWith('http')) return { src: i }
  if (i === 'chaos' || i === 'divine' || i === 'exalted' || i === 'wisdom' || i === 'dust') return { currency: i }
  return { mechanic: i }
})

const fresh = computed(() => freshness(props.updated, props.freshMin, props.staleMin))
const ageTitle = computed(() => props.updated ? `Data from ${new Date(props.updated).toLocaleString()}` : 'No data yet')

const ROW_SELECTOR = 'button.w-row, a.w-row, .w-row[tabindex], .w-focusable, [data-nav]'

function onKey (e: KeyboardEvent) {
  const el = root.value
  if (!el) return
  const target = e.target as HTMLElement
  const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
  if (typing) {
    if (e.key === 'Escape' && target.tagName !== 'SELECT') target.blur()
    else if (e.key === 'ArrowDown' && target.tagName === 'INPUT') { e.preventDefault(); focusRow(el, 0) }
    return
  }
  if (e.key === '/') {
    const field = el.querySelector<HTMLInputElement>('input:not([type=checkbox]):not([type=radio]):not([type=range])')
    if (field) { e.preventDefault(); field.focus(); field.select() }
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const rows = [...el.querySelectorAll<HTMLElement>(ROW_SELECTOR)].filter(r => r.offsetParent !== null)
    if (!rows.length) return
    e.preventDefault()
    const i = rows.indexOf(document.activeElement as HTMLElement)
    const next = i < 0 ? 0 : Math.min(rows.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))
    rows[next].focus()
    rows[next].scrollIntoView({ block: 'nearest' })
  }
}

function focusRow (el: HTMLElement, i: number) {
  const rows = [...el.querySelectorAll<HTMLElement>(ROW_SELECTOR)].filter(r => r.offsetParent !== null)
  rows[i]?.focus()
}

defineExpose({ el: root })
</script>

<style module>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.head {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--w-s2);
  min-height: 32px;
  padding: 4px 6px 4px var(--w-pad);
  background: var(--w-header-bg);
  border-bottom: 1px solid var(--w-line);
}
.icon { margin-left: -2px; }
.title {
  flex: 1;
  font-family: var(--w-head);
  font-size: var(--w-head-size);
  letter-spacing: var(--w-head-track);
  color: var(--w-fg);
}
:global([data-woke-theme="native"]) .title { color: var(--w-accent); }
/* Diamond marker only when there's no game icon. */
:global(:root:not([data-woke-theme="native"]):not([data-woke-theme="modern"])) .head > .title:first-child::before {
  content: "";
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 9px;
  background: var(--w-accent);
  transform: translateY(-2px) rotate(45deg);
}
.actions { display: flex; align-items: center; gap: var(--w-s1); }
.age {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 2px;
  font-size: var(--w-fs-xs);
  color: var(--w-dim);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.fresh .dot { background: var(--w-up); }
.aging .dot { background: var(--w-warn); }
.stale { color: var(--w-faint); }
.stale .dot { background: var(--w-faint); }
.busy {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 2px;
  width: 35%;
  background: var(--w-accent);
  animation: busy 1.3s ease-in-out infinite;
}
@keyframes busy { from { left: -35%; } to { left: 100%; } }
@media (prefers-reduced-motion: reduce) { .busy { animation: none; left: 0; width: 100%; opacity: 0.5; } }
.tabs { padding: 4px 8px 0; border-bottom: 1px solid var(--w-line); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px; }
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding: 6px var(--w-pad);
  font-size: var(--w-fs-sm);
  color: var(--w-dim);
}
.toolbar + .meta { padding-top: 0; }
.body { min-height: 0; flex: 1; }
.footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px var(--w-pad);
  border-top: 1px solid var(--w-line);
  font-size: var(--w-fs-sm);
  color: var(--w-dim);
}
</style>
