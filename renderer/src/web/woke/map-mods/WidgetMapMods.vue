<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <MapRegexBuilder :config="config" />
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
import { inject } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import MapRegexBuilder from './MapRegexBuilder.vue'
import { initMapModsWidget, normalizeMapModsWidget } from './widget'

const props = defineProps<{
  config: MapModsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  initMapModsWidget(props.config)
  wm.show(props.config.wmId)
}
normalizeMapModsWidget(props.config)
</script>
