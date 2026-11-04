<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <div class="grid gap-2 items-center" style="grid-template-columns: auto 1fr;">
      <span>Hotkey: turn scan mode on/off</span>
      <hotkey-input v-model="hotkey" />
    </div>
    <label class="flex items-center gap-2">
      <input type="checkbox" v-model="alertOnPass">
      <span>Flash when a reroll turns a map into a "run"</span>
    </label>
    <div class="text-sm" style="color: var(--w-dim);">
      Scan mode reads the tooltip of the map under your mouse with on-screen text recognition,
      so no key press is needed per map. It re-reads whenever the tooltip changes, so rerolling the same
      map (chaos spamming) updates the verdict. Ratings come from the active profile in the Map mods widget.
      It needs Windows and the OCR files used by APT's heist gem reader.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HotkeyInput from '@/web/settings/HotkeyInput.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import type { MapScanWidget } from './scan'

export default defineComponent({
  name: 'Map scan',
  components: { HotkeyInput },
  props: configProp<MapScanWidget>(),
  setup (props) {
    return {
      hotkey: configModelValue(() => props.configWidget, 'hotkey'),
      alertOnPass: configModelValue(() => props.configWidget, 'alertOnPass')
    }
  }
})
</script>
