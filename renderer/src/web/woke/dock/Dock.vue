<template>
  <div v-if="groups.length || wm.active.value" :class="[$style.dock, { [$style.vertical]: cfg.vertical }]"
    :style="{ left: `${cfg.x}%`, top: `${cfg.y}%` }" data-w-panel>
    <span v-if="wm.active.value" :class="$style.grip" title="Drag to move the icon row. Double-click to stand it on its side."
      @pointerdown="startDrag" @dblclick="flip"><i class="fas fa-grip-vertical" /></span>
    <DockIcon v-for="g in groups" :key="g.host.key" :host="g.host" :extras="g.extras" :vertical="cfg.vertical" />
    <span v-if="wm.active.value && !groups.length" :class="$style.empty">Icon row · nothing to show here</span>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import DockIcon from './DockIcon.vue'
import { dockConfig, dockGroups, ensureDockConfig, saveDock } from './dock'
import { useZone } from '../shared/zone'

const wm = inject<WidgetManager>('wm')!

ensureDockConfig()
useZone()

const cfg = computed(() => dockConfig())

// Nothing over the settings window or another exclusive window.
const blocked = computed(() => wm.widgets.value.some(w => w.wmZorder === 'exclusive' && w.wmWants === 'show'))
const groups = computed(() => blocked.value ? [] : dockGroups.value)

let drag: { dx: number, dy: number } | null = null
function startDrag (e: PointerEvent) {
  const el = (e.currentTarget as HTMLElement).parentElement
  if (!el) return
  const r = el.getBoundingClientRect()
  drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', endDrag, { once: true })
  e.preventDefault()
}
function onMove (e: PointerEvent) {
  if (!drag) return
  const d = dockConfig()
  d.x = clamp((e.clientX - drag.dx) / window.innerWidth * 100, 0, 97)
  d.y = clamp((e.clientY - drag.dy) / window.innerHeight * 100, 0, 96)
}
function endDrag () {
  drag = null
  window.removeEventListener('pointermove', onMove)
  saveDock()
}
function flip () {
  const d = dockConfig()
  d.vertical = !d.vertical
  saveDock()
}
function clamp (v: number, lo: number, hi: number) {
  return Math.round(Math.min(hi, Math.max(lo, v)) * 10) / 10
}
onUnmounted(() => { window.removeEventListener('pointermove', onMove) })
</script>

<style module>
.dock {
  position: absolute;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--w-body);
}
.vertical { flex-direction: column; }
.grip {
  width: 16px;
  height: 30px;
  display: grid;
  place-items: center;
  color: var(--w-faint);
  cursor: grab;
  border-radius: var(--w-radius-sm);
}
.grip:hover { color: var(--w-fg); background: var(--w-panel); }
.vertical .grip { width: 30px; height: 16px; }
.vertical .grip i { transform: rotate(90deg); }
.empty {
  padding: 3px 10px;
  font-size: 11px;
  color: var(--w-faint);
  background: var(--w-panel);
  border: 1px dashed var(--w-line);
  border-radius: 999px;
}
</style>
