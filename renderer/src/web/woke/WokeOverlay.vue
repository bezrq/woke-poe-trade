<template>
  <HiddenNote />
  <Dock />
  <ToolkitHealth />
  <OverlayLayer />
  <GameTooltip />
  <AppNotices />
</template>

<script setup lang="ts">
import HiddenNote from './switchboard/HiddenNote.vue'
import Dock from './dock/Dock.vue'
import ToolkitHealth from './dock/ToolkitHealth.vue'
import OverlayLayer from './ui/OverlayLayer.vue'
import GameTooltip from './ui/tooltip/GameTooltip.vue'
import AppNotices from './app/AppNotices.vue'
import { MainProcess } from '@/web/background/IPC'
import { onUnmounted } from 'vue'
import { toast } from './ui'
import { LOOT_FILTER_SAMPLE_TARGET } from './loot-filter/widget'

// A hotkey that copies an item found nothing to copy. The loot filter's sample
// key has its own message.
const itemFailed = MainProcess.onEvent('MAIN->CLIENT::item-text-failed', ({ target }) => {
  if (target !== LOOT_FILTER_SAMPLE_TARGET) toast('No item under the mouse. Hover over an item and try again.')
})
onUnmounted(() => { itemFailed.abort() })
</script>
