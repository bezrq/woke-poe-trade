<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <HotkeysGeneric :hotkeys="hotkeys" />
    <div class="flex items-center gap-3 text-sm">
      <span class="flex-1">Map, heist and chart mod ratings are in Map mods now.</span>
      <button type="button" class="w-accent" @click="emit('open', 'map-mods')">Open Map mods</button>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'item.info'
}
</script>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { configProp, _configModelValue, findWidget } from '../settings/utils.js'
import type { ItemCheckWidget } from './widget.js'

import HotkeysGeneric, { HotkeySchema } from '../settings/HotkeysGeneric.vue'

const props = defineProps(configProp())
const emit = defineEmits<{ (e: 'open', page: string): void }>()

const hotkeys = computed(() => {
  const out: HotkeySchema[] = []

  const isEnglish = props.config.language === 'en'
  const widget = findWidget<ItemCheckWidget>('item-check', props.config)!
  out.push({
    translationKey: 'item.open_on_wiki',
    config: _configModelValue(widget, 'wikiKey')
  })
  out.push({
    translationKey: 'item.open_on_poedb',
    config: _configModelValue(widget, 'poedbKey')
  })
  if (isEnglish) {
    out.push({
      translationKey: 'item.open_on_craftofexile',
      config: _configModelValue(widget, 'craftOfExileKey')
    })
  }
  out.push({
    translationKey: 'item.find_in_stash',
    config: _configModelValue(widget, 'stashSearchKey')
  })
  out.push({
    translationKey: 'item.open_bookmarks',
    config: _configModelValue(widget, 'bookmarksKey')
  })
  return out
})
</script>
