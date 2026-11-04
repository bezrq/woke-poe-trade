<template>
  <div v-if="visible" :class="$style.backdrop">
    <w-panel title="Set up your toolkit" width="34rem" max-height="85vh" :class="$style.panel">
      <template #actions>
        <button type="button" class="w-icon-btn" aria-label="Skip setup" @click="finish(false)"><i class="fas fa-times" /></button>
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
        <w-button variant="ghost" @click="finish(false)">Skip</w-button>
        <w-button variant="primary" @click="finish(true)">Done</w-button>
      </template>
    </w-panel>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, watch } from 'vue'
import { AppConfig, saveConfig, pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import { WPanel, WButton } from '../ui'
import { MODULES, isModuleOn } from '../modules'
import type { WokeModulesConfig } from '../modules'
import ModuleList from './ModuleList.vue'
import PresetBar from './PresetBar.vue'

const wm = inject<WidgetManager>('wm')!

const visible = computed(() => {
  if (!wm.active.value || AppConfig().woke?.setupDone) return false
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
  config.woke = { setupDone: true, off: [...off] }
  saveConfig()
  pushHostConfig()
}
</script>

<style module>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
}
.panel { box-shadow: var(--w-shadow); }
.intro { padding: 10px var(--w-pad) 0; font-size: var(--w-text-sm); }
</style>
