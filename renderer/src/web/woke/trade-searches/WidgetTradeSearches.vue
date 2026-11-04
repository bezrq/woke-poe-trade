<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="flex gap-2 min-h-0 items-start">
      <WPanel :title="config.wmTitle || 'Trade searches'" width="19rem" max-height="70vh">
        <template #actions>
          <WChip v-if="hasHotkeys" clickable :active="config.enableHotkeys" title="Use each search's hotkey"
            @click="config.enableHotkeys = !config.enableHotkeys"><i class="fas fa-keyboard" /> Hotkeys</WChip>
        </template>
        <template #toolbar>
          <WField v-model="filter" icon="fas fa-search" placeholder="Filter by name, tag, category…" class="grow" />
        </template>

        <template v-for="group in groups" :key="group.category">
          <div class="w-group-label">{{ group.category }}</div>
          <WListItem v-for="entry in group.entries" :key="entry.id" :active="openId === entry.id"
            :title="tooltip(entry)" @select="open(entry, 'overlay')">
            <i v-if="isLiveSearch(entry.url)" class="fas fa-bolt w-accent" title="Live search" />
            <span class="w-trunc">{{ entry.name || entry.url }}</span>
            <WKbd v-if="config.enableHotkeys && entry.hotkeyOverlay" :keys="entry.hotkeyOverlay" class="ml-auto" />
            <template #actions>
              <button @click="open(entry, 'external')" class="w-icon-btn" title="Open in your browser">
                <i class="fas fa-external-link-alt" />
              </button>
            </template>
          </WListItem>
        </template>
        <WEmpty v-if="!groups.length" icon="fas fa-search">
          {{ config.entries.length ? 'No matches' : 'No saved searches yet. Open settings to add some.' }}
        </WEmpty>

        <template #footer>
          <span>Opens the official trade site</span>
        </template>
      </WPanel>

      <WPanel v-if="openEntry" :title="openEntry.name || openEntry.url" :scroll="false" max-height="none"
        style="width: 60vw; height: 75vh;">
        <template #actions>
          <span class="w-faint text-xs whitespace-nowrap mr-1">{{ overlayKey }} to interact</span>
          <button @click="open(openEntry, 'external')" class="w-icon-btn" title="Open in your browser">
            <i class="fas fa-external-link-alt" />
          </button>
          <button @click="closeBrowser" class="w-icon-btn" title="Close">
            <i class="fas fa-times" />
          </button>
        </template>
        <webview ref="webviewEl" class="pointer-events-auto w-full h-full flex"
          width="100%" height="100%" />
      </WPanel>
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
import { WPanel, WField, WChip, WKbd, WEmpty, WListItem } from '../ui'
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
