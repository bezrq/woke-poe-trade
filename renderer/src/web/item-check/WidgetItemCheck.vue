<template>
  <Widget :config="widgetConfig" move-handles="none" :removable="false" :hideable="!lookup" :inline-edit="false">
    <ItemLookup v-if="lookup" :key="lookupKey" :request="lookup" @close="closeLookup" />
    <template v-else-if="item">
      <!-- woke: Map mods replaces APT's map check for the items it rates. -->
      <WokeMapVerdictCard v-if="wokeMap"
        :result="wokeMap.result" :config="wokeMap.config" />
      <MapCheck v-else-if="isMapLike"
        :item="item" :config="config.maps" />
      <ItemInfo v-else
        :item="item" />
    </template>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '../overlay/interfaces'
import type { ItemCheckWidget } from './widget.js'

export default {
  widget: {
    type: 'item-check',
    instances: 'single',
    initInstance: (): ItemCheckWidget => {
      return {
        wmId: 0,
        wmType: 'item-check',
        wmTitle: '',
        wmWants: 'hide',
        wmZorder: 'exclusive',
        wmFlags: ['hide-on-blur', 'menu::skip'],
        hotkey: null,
        wikiKey: null,
        poedbKey: null,
        craftOfExileKey: null,
        stashSearchKey: null,
        bookmarksKey: null,
        bookmarks: [],
        maps: {
          profile: 1,
          showNewStats: false,
          selectedStats: [
            { matcher: 'Players have #% to all maximum Resistances', decision: 'w--' },
            { matcher: 'Monsters reflect #% of Physical Damage', decision: 'd--' },
            { matcher: 'Monsters reflect #% of Elemental Damage', decision: 'd--' },
            { matcher: 'Area contains two Unique Bosses', decision: 'g--' }
          ]
        }
      }
    }
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { ItemCategory, ItemRarity, parseClipboard, ParsedItem } from '@/parser'
import { registerActions } from './hotkeyable-actions'
import type { WidgetManager } from '../overlay/interfaces'

import Widget from '../overlay/Widget.vue'
import MapCheck from '../map-check/MapCheck.vue'
import ItemInfo from './ItemInfo.vue'
import WokeMapVerdictCard from '@/web/woke/map-mods/MapVerdictCard.vue'
import ItemLookup from '@/web/woke/item-lookup/ItemLookup.vue'
import { lookupRequest as lookup } from '@/web/woke/item-lookup/lookup'
import { wokeMapCheck, ensureMapModsConfig, isMapLike as wokeIsMapLike } from '@/web/woke/map-mods/check'

const props = defineProps<{
  config: ItemCheckWidget
}>()

const wm = inject<WidgetManager>('wm')!

const checkPosition = ref({ x: 1, y: 1 })
const item = ref<ParsedItem | null>(null)

registerActions()

MainProcess.onEvent('MAIN->CLIENT::item-text', (e) => {
  if (e.target !== 'item-check') return

  lookup.value = null
  checkPosition.value = e.position
  item.value = parseClipboard(e.clipboard).unwrapOr(null)
  if (item.value) {
    wm.show(props.config.wmId)
  }
})

props.config.wmWants = 'hide'

// woke: the wiki, poedb and Craft of Exile keys open a page in this widget. It
// goes when the widget does, so nothing stays loaded over the game.
const lookupKey = ref(0)
watch(lookup, (request) => {
  if (!request) return
  lookupKey.value++
  if (request.position) checkPosition.value = request.position
  wm.show(props.config.wmId)
})
watch(() => props.config.wmWants, (wants) => {
  if (wants === 'hide') lookup.value = null
})
function closeLookup () {
  lookup.value = null
  wm.hide(props.config.wmId)
}

const anchor = computed(() => {
  const width = wm.size.value.width
  const poePanelWidth = wm.poePanelWidth.value

  const side = checkPosition.value.x > (window.screenX + width / 2)
    ? 'inventory'
    : 'stash'

  return {
    pos: side === 'stash' ? 'cl' : 'cr',
    y: 50,
    x: side === 'stash'
      ? (poePanelWidth / width) * 100
      : ((width - poePanelWidth) / width) * 100
  }
})

// The computed anchor over the real config, so a panel's saved size sticks.
const widgetConfig = new Proxy(props.config, {
  get: (target, key, receiver) => key === 'anchor' ? anchor.value : Reflect.get(target, key, receiver)
})

// Sets Map mods up (with APT's ratings brought over) the first time a map is checked.
watch(item, (it) => { if (it && wokeIsMapLike(it)) ensureMapModsConfig() })
const wokeMap = computed(() => item.value ? wokeMapCheck(item.value) : null)

const isMapLike = computed(() => {
  if (!item.value) return false
  const { category, rarity, info: { refName } } = item.value
  return (
    (category === ItemCategory.Map && rarity !== ItemRarity.Unique) ||
    category === ItemCategory.HeistContract ||
    category === ItemCategory.HeistBlueprint ||
    category === ItemCategory.Invitation ||
    category === ItemCategory.Chart ||
    refName === 'Expedition Logbook')
})
</script>
