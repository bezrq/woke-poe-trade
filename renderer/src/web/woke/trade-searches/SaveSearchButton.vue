<template>
  <button v-if="target" type="button" @click="save" class="w-btn-soft w-dim rounded px-2"
    :title="saved ? 'Saved to your trade searches' : 'Save this search to your trade searches'">
    <i :class="saved ? 'fas fa-check' : 'far fa-bookmark'" class="text-xs" />
  </button>
</template>

<script setup lang="ts">
// Shown next to APT's Trade button: saves the current search into the first
// Trade searches widget, under "Saved from price check".
import { computed, shallowRef } from 'vue'
import { AppConfig, saveConfig } from '@/web/Config'
import { TRADE_SEARCHES_TYPE, SAVED_FROM_PRICE_CHECK, emptyEntry, isValidUrl, nameFromTradeUrl } from './widget'
import type { TradeSearchesWidget } from './widget'

const props = defineProps<{ getLink: () => string }>()
const saved = shallowRef(false)

const target = computed(() => AppConfig<TradeSearchesWidget>(TRADE_SEARCHES_TYPE))

function save () {
  const widget = target.value
  if (!widget) return
  const url = props.getLink()
  if (!isValidUrl(url)) return
  if (!widget.entries.some(e => e.url === url)) {
    widget.entries.push({
      ...emptyEntry(widget.entries),
      name: nameFromTradeUrl(url) || 'Saved search',
      url,
      category: SAVED_FROM_PRICE_CHECK
    })
    saveConfig()
  }
  saved.value = true
  setTimeout(() => { saved.value = false }, 1500)
}
</script>
