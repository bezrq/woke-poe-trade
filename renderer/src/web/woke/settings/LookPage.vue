<template>
  <div :class="$style.page">
    <appearance-settings />

    <w-setting-section title="Text and overlay">
      <w-setting-row label="Text size" hint="Sizes APT's windows and this one. The toolkit's panels follow Panel size above.">
        <w-field :model-value="config.fontSize" type="number" suffix="px" :class="$style.num"
          @update:model-value="setFontSize(Number($event))" />
      </w-setting-row>
      <w-setting-row label="Darken the game while the overlay is open">
        <w-toggle :model-value="hasBackdrop" @update:model-value="setBackdrop($event)" />
      </w-setting-row>
      <w-setting-row v-if="hasBackdrop" label="Click the dark area to go back to the game">
        <w-toggle v-model="config.overlayBackgroundClose" />
      </w-setting-row>
      <w-setting-row label="Say when the overlay is ready" hint="A short note after the game starts.">
        <w-toggle v-model="config.showAttachNotification" />
      </w-setting-row>
      <w-setting-row label="Put back what was on the clipboard" hint="After price check copies an item.">
        <w-toggle v-model="config.restoreClipboard" />
      </w-setting-row>
      <w-setting-row label="Game window title" hint="Only change this for a renamed game window." restart>
        <w-field v-model="config.windowTitle" />
      </w-setting-row>
    </w-setting-section>

    <dock-settings :config="config" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config } from '@/web/Config'
import { WField, WSettingRow, WSettingSection, WToggle } from '../ui'
import AppearanceSettings from '../ui/AppearanceSettings.vue'
import DockSettings from '../dock/DockSettings.vue'

const props = defineProps<{ config: Config }>()

const NO_BACKDROP = 'rgba(255, 255, 255, 0)'
const DEFAULT_BACKDROP = 'rgba(129, 139, 149, 0.15)'
const hasBackdrop = computed(() => props.config.overlayBackground !== NO_BACKDROP)
function setBackdrop (on: boolean) { props.config.overlayBackground = on ? DEFAULT_BACKDROP : NO_BACKDROP }
function setFontSize (v: number) {
  if (Number.isFinite(v) && v >= 10 && v <= 32) props.config.fontSize = v
}
</script>

<style module>
.page { display: flex; flex-direction: column; gap: var(--w-s5); }
.num { width: 5.5rem; }
</style>
