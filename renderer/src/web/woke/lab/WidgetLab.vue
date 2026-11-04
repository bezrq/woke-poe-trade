<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex min-h-0 gap-x-1 text-gray-100">
      <div class="flex flex-col gap-1" style="width: 13rem;">
        <div class="p-1 flex items-baseline gap-2">
          <span class="truncate grow">{{ config.wmTitle || 'Labyrinth' }}</span>
          <span class="text-xs text-gray-400 whitespace-nowrap" title="Labs reset at 7 PM US Central">resets in {{ resetIn }}</span>
        </div>
        <div v-for="d in DIFFICULTIES" :key="d" class="flex gap-x-1">
          <button @click="open(d, 'overlay')" :class="[$style.entryBtn, { [$style.active]: openDiff === d }]">
            <span>{{ labLabel(d) }}</span>
            <span v-if="d === config.defaultDifficulty && config.hotkeyOverlay" :class="$style.hotkey">{{ config.hotkeyOverlay }}</span>
          </button>
          <button @click="open(d, 'external')" :class="$style.iconBtn" title="Open in your browser">
            <i class="fas fa-external-link-alt" />
          </button>
        </div>
        <div v-if="config.notes.trim()" class="whitespace-pre-wrap text-sm text-gray-300 px-1 pt-1">{{ config.notes }}</div>
      </div>
      <div v-if="openDiff" class="flex flex-col" style="width: 60vw; height: 80vh;">
        <div class="flex items-center gap-x-2 px-1 pb-1">
          <span class="truncate grow">{{ labLabel(openDiff) }} Labyrinth · poelab.com</span>
          <span class="text-gray-500 text-xs whitespace-nowrap">{{ overlayKey }} to interact</span>
          <button @click="openDiff = null" :class="$style.iconBtn" title="Close"><i class="fas fa-times" /></button>
        </div>
        <webview ref="webviewEl" class="pointer-events-auto flex-1" width="100%" height="100%" />
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { LAB_TYPE } from './lab'
import type { LabWidget } from './lab'

export default {
  widget: {
    type: LAB_TYPE,
    instances: 'multi',
    trNameKey: 'Labyrinth'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch, nextTick, onUnmounted } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { DEFAULT_LAB_URLS, DIFFICULTIES, formatDuration, labLabel, msUntilLabReset, parseHotkeyTarget } from './lab'
import type { LabDifficulty, OpenTarget } from './lab'

const props = defineProps<{
  config: LabWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Labyrinth'
  props.config.anchor = { pos: 'tl', x: 30, y: 20 }
  props.config.urls = { normal: '', cruel: '', merciless: '', uber: '' }
  props.config.defaultDifficulty = 'uber'
  props.config.hotkeyOverlay = null
  props.config.hotkeyExternal = null
  props.config.notes = ''
  wm.show(props.config.wmId)
}

const openDiff = shallowRef<LabDifficulty | null>(null)
const webviewEl = shallowRef<HTMLElement & { src: string } | null>(null)
const overlayKey = computed(() => AppConfig().overlayKey)

const now = shallowRef(Date.now())
const clock = setInterval(() => { now.value = Date.now() }, 30 * 1000)
onUnmounted(() => { clearInterval(clock) })
const resetIn = computed(() => formatDuration(msUntilLabReset(now.value)))

function urlFor (d: LabDifficulty): string {
  const url = (props.config.urls?.[d] ?? '').trim() || DEFAULT_LAB_URLS[d]
  return /^https?:\/\//i.test(url) ? url : DEFAULT_LAB_URLS[d]
}

watch(openDiff, (d) => {
  wm.setFlag(props.config.wmId, 'invisible-on-blur', !d)
})

function open (d: LabDifficulty, where: OpenTarget) {
  const url = urlFor(d)
  if (where === 'external' || !Host.isElectron) {
    window.open(url)
    return
  }
  openDiff.value = d
  wm.show(props.config.wmId)
  nextTick(() => {
    if (webviewEl.value) webviewEl.value.src = url
  })
}

const hotkeys = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  const parsed = parseHotkeyTarget(e.target)
  if (!parsed || parsed.wmId !== props.config.wmId) return
  if (parsed.where === 'overlay' && openDiff.value) {
    openDiff.value = null
    wm.hide(props.config.wmId)
    return
  }
  open(props.config.defaultDifficulty, parsed.where)
})
onUnmounted(() => { hotkeys.abort() })
</script>

<style lang="postcss" module>
.entryBtn {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  @apply rounded px-2 py-1 leading-5;
  @apply text-gray-100 bg-gray-800;

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
  @apply text-black bg-gray-400 rounded px-1 text-xs;
}
</style>
