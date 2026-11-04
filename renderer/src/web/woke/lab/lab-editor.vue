<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <div class="grid gap-2 items-center" style="grid-template-columns: auto 1fr;">
      <span>Hotkey: open in overlay</span>
      <w-hotkey-cell v-model="hotkeyOverlay" />
      <span>Hotkey: open in your browser</span>
      <w-hotkey-cell v-model="hotkeyExternal" />
      <span>Hotkeys open</span>
      <select v-model="defaultDifficulty" class="w-input rounded px-1 leading-6 w-40">
        <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ labLabel(d) }}</option>
      </select>
    </div>
    <div class="w-dim text-sm">Pressing the overlay hotkey again closes the layout.</div>
    <ui-checkbox v-model="autoOpen">Load the layout into the lab icon when I enter Aspirants' Plaza (difficulty from the area level)</ui-checkbox>
    <label class="flex flex-col gap-1">
      <span>Lab notes</span>
      <textarea v-model="notes" rows="4" class="w-input rounded px-1"
        placeholder="Enchants you're after, trial status, tips…" />
    </label>
    <div>
      <div class="mb-1">Layout pages</div>
      <div class="w-dim text-sm mb-1">Leave empty to use poelab.com's daily pages.</div>
      <div class="grid gap-1 items-center" style="grid-template-columns: 6rem 1fr;">
        <template v-for="d in DIFFICULTIES" :key="d">
          <span class="w-dim">{{ labLabel(d) }}</span>
          <input :value="configWidget.urls[d]" @input="setUrl(d, $event)" :placeholder="DEFAULT_LAB_URLS[d]"
            class="w-input rounded px-1 leading-6">
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import WHotkeyCell from '../ui/WHotkeyCell.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import { DEFAULT_LAB_URLS, DIFFICULTIES, labLabel } from './lab'
import type { LabDifficulty, LabWidget } from './lab'

export default defineComponent({
  name: 'Labyrinth',
  components: { WHotkeyCell },
  props: configProp<LabWidget>(),
  setup (props) {
    return {
      autoOpen: computed({
        get: () => props.configWidget.autoOpen !== false,
        set: (v: boolean) => { props.configWidget.autoOpen = v }
      }),
      DIFFICULTIES,
      DEFAULT_LAB_URLS,
      labLabel,
      hotkeyOverlay: configModelValue(() => props.configWidget, 'hotkeyOverlay'),
      hotkeyExternal: configModelValue(() => props.configWidget, 'hotkeyExternal'),
      defaultDifficulty: configModelValue(() => props.configWidget, 'defaultDifficulty'),
      notes: configModelValue(() => props.configWidget, 'notes'),
      setUrl (d: LabDifficulty, e: Event) {
        props.configWidget.urls = { ...props.configWidget.urls, [d]: (e.target as HTMLInputElement).value }
      }
    }
  }
})
</script>
