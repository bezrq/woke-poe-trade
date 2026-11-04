<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex min-h-0 gap-x-1">
      <div class="flex flex-col min-h-0" style="width: 18rem; max-height: 70vh;">
        <div class="text-gray-100 p-1 flex items-center justify-between gap-2">
          <span class="truncate">{{ config.wmTitle || 'Trade searches' }}</span>
          <ui-toggle v-if="hasHotkeys" v-model="config.enableHotkeys">Keys</ui-toggle>
        </div>
        <input v-model="filter" placeholder="Filter by name, tag, category…"
          class="bg-gray-900 rounded px-1 mx-1 mb-1 leading-6 text-gray-100" />
        <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0 px-1">
          <template v-for="group in groups" :key="group.category">
            <div class="text-gray-500 text-xs uppercase pt-1">{{ group.category }}</div>
            <div v-for="entry in group.entries" :key="entry.id" class="flex gap-x-1">
              <button @click="open(entry, 'overlay')" :class="[$style.entryBtn, { [$style.active]: openId === entry.id }]"
                :title="tooltip(entry)">
                <i v-if="isLiveSearch(entry.url)" class="fas fa-bolt text-yellow-500" title="Live search" />
                <span class="truncate">{{ entry.name || entry.url }}</span>
                <span v-if="config.enableHotkeys && entry.hotkeyOverlay" :class="$style.hotkey">{{ entry.hotkeyOverlay }}</span>
              </button>
              <button @click="open(entry, 'external')" :class="$style.iconBtn" title="Open in your browser">
                <i class="fas fa-external-link-alt" />
              </button>
            </div>
          </template>
          <div v-if="!groups.length" class="text-gray-500 p-2 text-center">
            {{ config.entries.length ? 'No matches' : 'No saved searches yet. Open settings to add some.' }}
          </div>
        </div>
      </div>
      <div v-if="openEntry" class="flex flex-col" style="width: 60vw; height: 75vh;">
        <div class="flex items-center gap-x-2 px-1 pb-1 text-gray-100">
          <span class="truncate grow">{{ openEntry.name || openEntry.url }}</span>
          <span class="text-gray-500 text-xs whitespace-nowrap">{{ overlayKey }} to interact</span>
          <button @click="open(openEntry, 'external')" :class="$style.iconBtn" title="Open in your browser">
            <i class="fas fa-external-link-alt" />
          </button>
          <button @click="closeBrowser" :class="$style.iconBtn" title="Close">
            <i class="fas fa-times" />
          </button>
        </div>
        <webview ref="webviewEl" class="pointer-events-auto flex-1"
          width="100%" height="100%" />
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { TRADE_SEARCHES_TYPE } from './widget'
import type { TradeSearchesWidget } from './widget'

export default {
  widget: {
    type: TRADE_SEARCHES_TYPE,
    instances: 'multi',
    trNameKey: 'Trade searches'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, watch, shallowRef, nextTick, onUnmounted } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { AppConfig, pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import UiToggle from '@/web/ui/UiToggle.vue'
import { groupByCategory, isLiveSearch, isValidUrl, matchesFilter, parseHotkeyTarget } from './widget'
import type { OpenTarget, TradeSearchEntry } from './widget'

const props = defineProps<{
  config: TradeSearchesWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Trade searches'
  props.config.anchor = { pos: 'tl', x: 30, y: 25 }
  props.config.enableHotkeys = true
  props.config.entries = []
  wm.show(props.config.wmId)
}

const filter = shallowRef('')
const openId = shallowRef<number | null>(null)
const webviewEl = shallowRef<HTMLElement & { src: string } | null>(null)

const openEntry = computed(() => props.config.entries.find(e => e.id === openId.value))
const groups = computed(() => groupByCategory(
  props.config.entries.filter(e => matchesFilter(e, filter.value))))
const hasHotkeys = computed(() => props.config.entries.some(e => e.hotkeyOverlay || e.hotkeyExternal))
const overlayKey = computed(() => AppConfig().overlayKey)

watch(() => props.config.enableHotkeys, () => { pushHostConfig() })

// While a search is open, keep it visible over the game (useful for live
// searches); the list alone hides when the game has focus, like stash search.
watch(openEntry, (entry) => {
  wm.setFlag(props.config.wmId, 'invisible-on-blur', !entry)
})

function open (entry: TradeSearchEntry, where: OpenTarget) {
  // Only http(s): the host passes window.open URLs to the OS shell.
  if (!isValidUrl(entry.url)) return
  if (where === 'external' || !Host.isElectron) {
    window.open(entry.url)
    return
  }
  openId.value = entry.id
  wm.show(props.config.wmId)
  nextTick(() => {
    if (webviewEl.value) webviewEl.value.src = entry.url
  })
}

function closeBrowser () {
  openId.value = null
}

const hotkeyController = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  const parsed = parseHotkeyTarget(e.target)
  if (!parsed || parsed.wmId !== props.config.wmId) return
  const entry = props.config.entries.find(en => en.id === parsed.entryId)
  if (entry) open(entry, parsed.where)
})
onUnmounted(() => { hotkeyController.abort() })

function tooltip (entry: TradeSearchEntry) {
  return [entry.url, entry.tags.length ? `Tags: ${entry.tags.join(', ')}` : '', entry.notes]
    .filter(Boolean).join('\n')
}
</script>

<style lang="postcss" module>
.entryBtn {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  @apply rounded p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  text-align: left;

  &:hover {
    @apply bg-gray-700;
  }
}

.active {
  @apply bg-gray-600;
}

.iconBtn {
  flex-shrink: 0;
  @apply rounded px-2;
  @apply text-gray-400 bg-gray-800;

  &:hover {
    @apply bg-gray-700 text-gray-100;
  }
}

.hotkey {
  margin-left: auto;
  flex-shrink: 0;
  @apply text-black bg-gray-400 rounded px-1;
}
</style>
