<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="flex gap-2 min-h-0 items-start">
      <WPanel :title="config.wmTitle || 'Labyrinth'" width="14rem">
        <template #meta>
          <span title="Labs reset at midnight UTC"><i class="far fa-clock" /> resets in <span class="w-num">{{ resetIn }}</span></span>
        </template>
        <WListItem v-for="d in DIFFICULTIES" :key="d" :active="openDiff === d" @select="open(d, 'overlay')">
          <span class="w-trunc">{{ labLabel(d) }}</span>
          <WKbd v-if="d === config.defaultDifficulty && config.hotkeyOverlay" :keys="config.hotkeyOverlay" class="ml-auto" />
          <template #actions>
            <button @click="open(d, 'external')" class="w-icon-btn" title="Open in your browser">
              <i class="fas fa-external-link-alt" />
            </button>
          </template>
        </WListItem>
        <div v-if="config.notes.trim()" class="whitespace-pre-wrap w-dim py-2" style="padding-left: var(--w-pad); padding-right: var(--w-pad);">{{ config.notes }}</div>
        <template #footer><span>Layouts from poelab.com</span></template>
      </WPanel>
      <WPanel v-if="openDiff" :title="`${labLabel(openDiff)} Labyrinth`" :scroll="false" max-height="none"
        style="width: 60vw; height: 80vh;">
        <template #actions>
          <span class="w-faint text-xs whitespace-nowrap mr-1">{{ overlayKey }} to interact</span>
          <button @click="open(openDiff, 'external')" class="w-icon-btn" title="Open in your browser"><i class="fas fa-external-link-alt" /></button>
          <button @click="openDiff = null" class="w-icon-btn" title="Close"><i class="fas fa-times" /></button>
        </template>
        <webview ref="webviewEl" class="pointer-events-auto w-full h-full flex" width="100%" height="100%" />
      </WPanel>
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
import { WPanel, WKbd, WListItem } from '../ui'
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
