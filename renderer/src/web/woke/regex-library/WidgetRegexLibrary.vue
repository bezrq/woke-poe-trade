<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex flex-col min-h-0" style="min-width: 16rem; max-width: 24rem; max-height: 70vh;">
      <div class="text-gray-100 p-1 flex items-center justify-between gap-2">
        <span class="truncate">{{ config.wmTitle || 'Regex library' }}</span>
        <ui-toggle v-if="hasHotkeys" v-model="config.enableHotkeys">Keys</ui-toggle>
      </div>
      <input v-model="filter" placeholder="Filter by name, tag, category…"
        class="bg-gray-900 rounded px-1 mx-1 mb-1 leading-6 text-gray-100" />
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0 px-1">
        <template v-for="group in groups" :key="group.category">
          <div class="text-gray-500 text-xs uppercase pt-1">{{ group.category }}</div>
          <div v-for="entry in group.entries" :key="entry.id" class="flex gap-x-1">
            <button @click="stashSearch(entry.text)" :class="$style.searchBtn"
              :title="tooltip(entry)">
              <span class="truncate">{{ entry.name || entry.text }}</span>
              <span v-if="entry.text.length > MAX_SEARCH_LENGTH" :class="$style.warn">{{ entry.text.length }}/{{ MAX_SEARCH_LENGTH }}</span>
              <span v-if="entry.hotkey && config.enableHotkeys" :class="$style.hotkey">{{ entry.hotkey }}</span>
            </button>
            <button @click="copy(entry)" :class="$style.iconBtn" title="Copy to clipboard">
              <i :class="copiedId === entry.id ? 'fas fa-check' : 'far fa-copy'" />
            </button>
          </div>
        </template>
        <div v-if="!groups.length" class="text-gray-500 p-2 text-center">
          {{ config.entries.length ? 'No matches' : 'No saved strings yet. Open settings to add some.' }}
        </div>
      </div>
      <div class="flex justify-end gap-x-3 px-1 pt-1 text-xs">
        <a href="https://poe.re/" target="_blank" class="text-gray-400 hover:text-gray-100">Generate on poe.re</a>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { REGEX_LIBRARY_TYPE, starterEntries } from './widget'
import type { RegexLibraryWidget } from './widget'

export default {
  widget: {
    type: REGEX_LIBRARY_TYPE,
    instances: 'multi',
    trNameKey: 'Regex library',
    defaultInstances: (): RegexLibraryWidget[] => [{
      wmId: 0,
      wmType: REGEX_LIBRARY_TYPE,
      wmTitle: 'Regex library',
      wmWants: 'hide',
      wmZorder: null,
      wmFlags: ['invisible-on-blur'],
      anchor: { pos: 'tl', x: 35, y: 30 },
      enableHotkeys: true,
      entries: starterEntries()
    }]
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, watch, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import UiToggle from '@/web/ui/UiToggle.vue'
import { MAX_SEARCH_LENGTH, groupByCategory, matchesFilter } from './widget'
import type { RegexEntry } from './widget'

const props = defineProps<{
  config: RegexLibraryWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Regex library'
  props.config.anchor = { pos: 'tl', x: 30, y: 30 }
  props.config.enableHotkeys = true
  props.config.entries = starterEntries()
  wm.show(props.config.wmId)
}

const filter = shallowRef('')
const copiedId = shallowRef<number | null>(null)

const groups = computed(() => groupByCategory(
  props.config.entries.filter(e => matchesFilter(e, filter.value))))

const hasHotkeys = computed(() => props.config.entries.some(e => e.hotkey != null))

watch(() => props.config.enableHotkeys, () => { pushHostConfig() })

function stashSearch (text: string) {
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}

async function copy (entry: RegexEntry) {
  try {
    await navigator.clipboard.writeText(entry.text)
    copiedId.value = entry.id
    setTimeout(() => { if (copiedId.value === entry.id) copiedId.value = null }, 1200)
  } catch {}
}

function tooltip (entry: RegexEntry) {
  return [entry.text, entry.tags.length ? `Tags: ${entry.tags.join(', ')}` : '', entry.notes]
    .filter(Boolean).join('\n')
}
</script>

<style lang="postcss" module>
.searchBtn {
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

.warn {
  flex-shrink: 0;
  @apply text-red-400 text-xs;
}
</style>
