<template>
  <Widget :config="mode === 'card' ? { ...config, anchor: cardAnchor } : config"
    :move-handles="mode === 'card' ? 'none' : 'corners'" :inline-edit="false" :readonly="true">
    <template v-if="mode === 'card'">
      <SampleCard v-if="sample && match" :store="store" :config="config" :facts="sample" :match="match" :area-level="effectiveAreaLevel"
        @close="close" @open-editor="openEditorFromCard" @area-level="areaOverride = $event" />
      <WPanel v-else title="Filter rule for this item" icon="wisdom" width="24rem" :resizable="false">
        <template #actions><button class="w-icon-btn" title="Close" @click="close"><i class="fas fa-times" /></button></template>
        <template v-if="store.error.value" #banner>
          <WBanner>{{ store.error.value }}<template #actions><WButton size="sm" @click="retry">Retry</WButton></template></WBanner>
        </template>
        <WSkeleton v-if="store.loading.value" :rows="3" />
        <WEmpty v-else-if="!store.error.value" :art="{ item: 'Orb of Scouring' }">
          No filter picked yet. Open the editor and choose your NeverSink filter.
        </WEmpty>
        <template #footer><WButton size="sm" variant="primary" @click="mode = 'editor'">Open editor</WButton></template>
      </WPanel>
    </template>
    <FilterEditor v-else :store="store" :config="config" :focus="focus" @close="close" />
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { LOOT_FILTER_TYPE } from './widget'

export default {
  widget: {
    type: LOOT_FILTER_TYPE,
    instances: 'multi',
    trNameKey: 'Loot filter'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { computed, inject, onUnmounted, ref, shallowRef, watch } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { parseClipboard } from '@/parser'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WEmpty, WButton, WBanner, WSkeleton } from '../ui'
import SampleCard from './SampleCard.vue'
import FilterEditor from './FilterEditor.vue'
import { useLootFilter } from './store'
import { itemFacts } from './item-facts'
import type { ItemFacts } from './item-facts'
import { matchItem } from './match'
import { LOOT_FILTER_SAMPLE_TARGET, initLootFilterWidget, normalizeLootFilterWidget, parseEditorHotkeyTarget } from './widget'
import type { LootFilterWidget } from './widget'

const props = defineProps<{
  config: LootFilterWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  initLootFilterWidget(props.config)
  wm.show(props.config.wmId)
}
normalizeLootFilterWidget(props.config)
// Settings can swap in a whole new config object; fill in any new fields.
watch(() => props.config, (c) => normalizeLootFilterWidget(c))

const store = useLootFilter(() => props.config)
const mode = ref<'card' | 'editor'>('editor')
const sample = shallowRef<ItemFacts | null>(null)
const samplePosition = shallowRef({ x: 1, y: 1 })
const focus = shallowRef<{ type: string, tier: string } | null>(null)
const areaOverride = ref<number | null>(null)

const effectiveAreaLevel = computed(() => areaOverride.value ?? store.areaLevel.value ?? props.config.fallbackAreaLevel)

const match = computed(() => {
  const doc = store.doc.value
  if (!doc || !sample.value) return null
  return matchItem(doc, { ...sample.value, areaLevel: effectiveAreaLevel.value })
})

async function ensureLoaded () {
  if (!store.doc.value && !store.loading.value) {
    await store.listFiles()
    await store.load()
  }
}
ensureLoaded()

async function retry () {
  await store.listFiles()
  await store.load()
}

const itemEvents = MainProcess.onEvent('MAIN->CLIENT::item-text', (e) => {
  if (e.target !== LOOT_FILTER_SAMPLE_TARGET) return
  samplePosition.value = e.position
  const parsed = parseClipboard(e.clipboard).unwrapOr(null)
  sample.value = itemFacts(e.clipboard, parsed)
  areaOverride.value = null
  mode.value = 'card'
  wm.show(props.config.wmId)
  ensureLoaded()
})

const hotkeys = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  if (parseEditorHotkeyTarget(e.target) !== props.config.wmId) return
  if (props.config.wmWants === 'show' && mode.value === 'editor') {
    wm.hide(props.config.wmId)
    return
  }
  mode.value = 'editor'
  wm.show(props.config.wmId)
  ensureLoaded()
})

onUnmounted(() => {
  itemEvents.abort()
  hotkeys.abort()
})

function close () {
  wm.hide(props.config.wmId)
}

function openEditorFromCard (at?: { type: string, tier: string }) {
  const b = match.value?.final?.block
  focus.value = at ?? (b?.type && b.tier ? { type: b.type, tier: b.tier } : null)
  mode.value = 'editor'
}

// The card is a one-off; showing the widget again from the menu opens the editor.
watch(() => props.config.wmWants, (wants) => {
  if (wants === 'hide') mode.value = 'editor'
})

// Same placement as APT's item info: next to the stash or inventory panel,
// on the side away from the hovered item.
const cardAnchor = computed(() => {
  const width = wm.size.value.width
  const poePanelWidth = wm.poePanelWidth.value
  const side = samplePosition.value.x > (window.screenX + width / 2) ? 'inventory' : 'stash'
  return {
    pos: side === 'stash' ? 'cl' : 'cr',
    y: 50,
    x: side === 'stash'
      ? (poePanelWidth / width) * 100
      : ((width - poePanelWidth) / width) * 100
  }
})
</script>
