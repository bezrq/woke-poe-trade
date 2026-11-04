<template>
  <div v-if="panelsHidden" :class="$style.hiddenNote">
    Toolkit panels hidden<template v-if="hideKey">, press <w-kbd :keys="hideKey" /> to show</template>
    <button type="button" class="w-icon-btn" title="Show panels" @click="setPanelsHidden(false)"><i class="fas fa-eye" /></button>
  </div>
  <div v-if="visible && !expanded" :class="$style.card">
    <i class="fas fa-th-large w-accent" />
    <span class="flex-1">Pick which tools to load. Everything works already; this only trims what runs.</span>
    <w-button size="sm" variant="primary" @click="expanded = true">Choose tools</w-button>
    <w-button size="sm" variant="ghost" title="Ask again next launch" @click="later = true">Later</w-button>
    <button type="button" class="w-icon-btn" title="Don't ask again (Settings → Modules has the same list)" @click="finish(false)"><i class="fas fa-times" /></button>
  </div>
  <div v-if="visible && expanded" :class="$style.dock">
    <w-panel title="Set up your toolkit" width="34rem" max-height="80vh" :class="$style.panel">
      <template #actions>
        <button type="button" class="w-icon-btn" aria-label="Collapse" title="Collapse" @click="expanded = false"><i class="fas fa-minus" /></button>
      </template>
      <div :class="$style.intro" class="w-dim">
        Pick the tools you use. Switched-off modules don't load, don't register hotkeys and don't poll anything.
        You can change this any time in Settings → Modules.
      </div>
      <preset-bar :config="draft" />
      <module-list :config="draft" />
      <template #footer>
        <span class="w-trunc">{{ summary }}</span>
        <span class="flex-1" />
        <w-button variant="ghost" @click="later = true">Later</w-button>
        <w-button variant="primary" @click="finish(true)">Done</w-button>
      </template>
    </w-panel>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, shallowRef, watch } from 'vue'
import { AppConfig, saveConfig, pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import { WPanel, WButton, WKbd } from '../ui'
import { panelsHidden, setPanelsHidden, useHideAllHotkey } from '../shared/hide-all'
import { MODULES, isModuleOn } from '../modules'
import type { WokeModulesConfig } from '../modules'
import ModuleList from './ModuleList.vue'
import PresetBar from './PresetBar.vue'

const wm = inject<WidgetManager>('wm')!

// This component is always mounted, so it also owns the hide-all hotkey.
useHideAllHotkey()
const hideKey = computed(() => AppConfig().woke?.hideAllHotkey ?? null)

// A small card, not a wall: nothing waits on it. "Later" hides it until the
// next launch; the X or Done stops asking.
const expanded = shallowRef(false)
const later = shallowRef(false)

const visible = computed(() => {
  if (later.value || !wm.active.value || AppConfig().woke?.setupDone) return false
  // Don't cover the settings window or another exclusive widget.
  return !wm.widgets.value.some(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')
})

const draft = reactive<{ woke: WokeModulesConfig, widgets: Array<{ wmType: string }> }>({
  woke: { setupDone: false, off: [] },
  widgets: []
})

watch(visible, (show) => {
  if (!show) return
  draft.woke = { setupDone: false, off: [...(AppConfig().woke?.off ?? [])] }
  draft.widgets = AppConfig().widgets.map(w => ({ wmType: w.wmType }))
}, { immediate: true })

const summary = computed(() => {
  const on = MODULES.filter(m => m.group !== 'apt' && isModuleOn(draft, m.id))
  const uses = [
    on.some(m => m.needs.includes('poll')) ? 'poe.ninja' : null,
    on.some(m => m.needs.includes('log')) ? 'Client.txt' : null
  ].filter(Boolean)
  const total = MODULES.filter(m => m.group !== 'apt').length
  return `${on.length} of ${total} on` + (uses.length ? ` · uses ${uses.join(', ')} once placed` : '')
})

function finish (apply: boolean) {
  const config = AppConfig()
  const off = apply ? draft.woke.off : (config.woke?.off ?? [])
  config.woke = { ...config.woke, setupDone: true, off: [...off] }
  saveConfig()
  pushHostConfig()
}
</script>

<style module>
.card {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
  width: 30rem;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font-family: var(--w-body);
  font-size: var(--w-text-sm);
  color: var(--w-fg);
  background: var(--w-panel);
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-radius);
  box-shadow: var(--w-shadow);
}
.hiddenNote {
  position: absolute;
  left: 50%;
  top: 6px;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  font-family: var(--w-body);
  font-size: 11px;
  color: var(--w-dim);
  background: var(--w-panel);
  border: 1px solid var(--w-line);
  border-radius: 999px;
  opacity: 0.85;
}
.dock {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
}
.panel { box-shadow: var(--w-shadow); }
.intro { padding: 10px var(--w-pad) 0; font-size: var(--w-text-sm); }
</style>
