<template>
  <WPanel size-key="item-lookup" :title="request.item.info.name" :scroll="false"
    width="60vw" height="88vh" max-height="none">
    <template #actions>
      <span v-if="activeKey" class="flex items-center gap-1 w-dim text-xs whitespace-nowrap mr-1">
        <WKbd :keys="activeKey" /> Your browser
      </span>
      <span class="flex items-center gap-1 w-dim text-xs whitespace-nowrap mr-1">
        <WKbd keys="Esc" /> Back to game
      </span>
      <button class="w-icon-btn" :title="popOutTitle" :aria-label="popOutTitle" @click="popOut">
        <i class="fas fa-external-link-alt" />
      </button>
      <button class="w-icon-btn" title="Back to game" aria-label="Back to game" @click="close">
        <i class="fas fa-times" />
      </button>
    </template>
    <template #tabs>
      <WTabs :model-value="tab" :options="tabOptions" @update:model-value="selectTab($event as LookupTab)" />
    </template>
    <!-- Tabs load when first opened and keep their place when you flip between them. -->
    <webview v-for="t in opened" :key="t" v-show="t === tab" :ref="(el: unknown) => setView(t, el)" :src="urls[t]"
      class="pointer-events-auto w-full h-full flex" width="100%" height="100%" />
  </WPanel>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import type { ItemCheckWidget } from '@/web/item-check/widget'
import { WKbd, WPanel, WTabs } from '../ui'
import {
  POP_OUT_GUARD_MS, TAB_LABELS, lookupKeyAction, lookupTabs, lookupUrl, popOutUrl
} from './lookup'
import type { LookupKeys, LookupRequest, LookupTab } from './lookup'

const props = defineProps<{
  request: LookupRequest
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

type ViewEl = HTMLElement & { getURL?: () => string }

const tab = shallowRef<LookupTab>(props.request.tab)
const opened = shallowRef<LookupTab[]>([props.request.tab])
const views = new Map<LookupTab, ViewEl>()
const openedAt = performance.now()

function setView (t: LookupTab, el: unknown) {
  if (el) views.set(t, el as ViewEl)
  else views.delete(t)
}

const keys = computed<LookupKeys>(() => {
  const w = AppConfig('item-check') as ItemCheckWidget
  return { wiki: w.wikiKey, poedb: w.poedbKey, coe: w.craftOfExileKey }
})
const activeKey = computed(() => keys.value[tab.value])
const popOutTitle = computed(() => activeKey.value ? `Open in your browser (${activeKey.value})` : 'Open in your browser')

const tabs = computed(() => lookupTabs(props.request.item, props.request.tab))
const tabOptions = computed(() => tabs.value.map(t => ({ value: t, label: TAB_LABELS[t], count: keys.value[t] ?? undefined })))

const urls = computed(() => {
  const language = AppConfig().language
  return Object.fromEntries(tabs.value.map(t => [t, lookupUrl(t, props.request.item, language)])) as Record<LookupTab, string>
})

function selectTab (t: LookupTab) {
  if (!opened.value.includes(t)) opened.value = [...opened.value, t]
  tab.value = t
}

function popOut () {
  const url = popOutUrl(views.get(tab.value)?.getURL?.(), urls.value[tab.value])
  window.open(url)
  emit('close')
}

function close () {
  emit('close')
  Host.sendEvent({ name: 'OVERLAY->MAIN::focus-game', payload: undefined })
}

// With the overlay focused the game's hotkeys are off, so main passes these on.
const keyController = MainProcess.onEvent('MAIN->OVERLAY::woke-panel-key', ({ key }) => {
  const action = lookupKeyAction(key, tab.value, tabs.value, keys.value)
  if (!action) return
  if (action.type === 'switch') selectTab(action.tab)
  else if (performance.now() - openedAt >= POP_OUT_GUARD_MS) popOut()
})

function sendKeys (list: string[]) {
  Host.sendEvent({ name: 'OVERLAY->MAIN::woke-panel-keys', payload: { keys: list } })
}

onMounted(() => {
  sendKeys(Object.values(keys.value).filter((k): k is string => k != null))
})
onBeforeUnmount(() => {
  keyController.abort()
  sendKeys([])
})
</script>
