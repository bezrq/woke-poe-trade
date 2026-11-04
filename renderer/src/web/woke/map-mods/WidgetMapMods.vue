<template>
  <Widget :config="card ? { ...config, anchor: cardAnchor } : config"
    :move-handles="card ? 'none' : 'corners'" :inline-edit="false">
    <div v-if="card" class="flex flex-col gap-1 items-stretch">
      <MapVerdictCard v-if="result" :result="result" :config="config" />
      <WPanel v-else :title="config.wmTitle || 'Map mods'" width="22rem">
        <WEmpty icon="fas fa-map">That item isn't a map, invitation or logbook.</WEmpty>
      </WPanel>
      <WButton size="sm" variant="ghost" icon="fas fa-arrow-left" @click="card = false">Map regex</WButton>
    </div>
    <MapRegexBuilder v-else :config="config" />
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { MAP_MODS_TYPE } from './widget'
import type { MapModsWidget } from './widget'

export default {
  widget: {
    type: MAP_MODS_TYPE,
    instances: 'multi',
    trNameKey: 'Map mods'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { computed, inject, onUnmounted, shallowRef, watch } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { parseClipboard } from '@/parser'
import type { ParsedItem } from '@/parser'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WEmpty, WButton } from '../ui'
import MapVerdictCard from './MapVerdictCard.vue'
import MapRegexBuilder from './MapRegexBuilder.vue'
import { MAP_MODS_TARGET, initMapModsWidget, normalizeMapModsWidget } from './widget'
import { checkMap, isMapLike } from './check'

const props = defineProps<{
  config: MapModsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  initMapModsWidget(props.config)
  wm.show(props.config.wmId)
}
normalizeMapModsWidget(props.config)

const item = shallowRef<ParsedItem | null>(null)
const card = shallowRef(false)
const checkPosition = shallowRef({ x: 1, y: 1 })

const result = computed(() => item.value ? checkMap(item.value, props.config) : null)

const handler = MainProcess.onEvent('MAIN->CLIENT::item-text', (e) => {
  if (e.target !== MAP_MODS_TARGET) return
  checkPosition.value = e.position
  const parsed = parseClipboard(e.clipboard).unwrapOr(null)
  item.value = parsed && isMapLike(parsed) ? parsed : null
  card.value = true
  wm.show(props.config.wmId)
})
onUnmounted(() => { handler.abort() })

// Back to the regex builder once the overlay is dismissed.
watch(() => props.config.wmWants, (wants) => {
  if (wants === 'hide') card.value = false
})

// Same placement as APT's item info: next to the stash or inventory panel,
// on the side away from the hovered item.
const cardAnchor = computed(() => {
  const width = wm.size.value.width
  const poePanelWidth = wm.poePanelWidth.value
  const side = checkPosition.value.x > (window.screenX + width / 2) ? 'inventory' : 'stash'
  return {
    pos: side === 'stash' ? 'cl' : 'cr',
    y: 50,
    x: side === 'stash'
      ? (poePanelWidth / width) * 100
      : ((width - poePanelWidth) / width) * 100
  }
})
</script>
