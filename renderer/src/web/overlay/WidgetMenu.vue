<template>
  <widget :config="config" :hideable="false" :removable="false" readonly move-handles="corners">
    <woke-tab-bar :config="config" @paste="handleItemPaste" />
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { WidgetMenu, WidgetSpec } from './interfaces'
import { Host } from '@/web/background/IPC'
import Widget from './Widget.vue'
// woke: the bar itself (tabs, pins, right-click menu, add list) lives in woke/.
import WokeTabBar from '@/web/woke/tab-bar/TabBar.vue'

export default defineComponent({
  widget: {
    type: 'menu',
    instances: 'single',
    initInstance: (): WidgetMenu => {
      return {
        wmId: 0,
        wmType: 'menu',
        wmTitle: '',
        wmWants: 'show',
        wmZorder: 1,
        wmFlags: ['invisible-on-blur', 'menu::skip'],
        anchor: {
          pos: 'tl',
          x: 5,
          y: 5
        },
        alwaysShow: false
      }
    }
  } satisfies WidgetSpec,
  components: { Widget, WokeTabBar },
  props: {
    config: {
      type: Object as PropType<WidgetMenu>,
      required: true
    }
  },
  setup () {
    return {
      handleItemPaste (e: Event) {
        const target = e.target as HTMLInputElement
        const inputRect = target.getBoundingClientRect()
        Host.selfDispatch({
          name: 'MAIN->CLIENT::item-text',
          payload: {
            clipboard: target.value,
            position: {
              x: window.screenX + inputRect.x + inputRect.width / 2,
              y: window.screenY + inputRect.y + inputRect.height / 2
            },
            focusOverlay: true,
            target: 'price-check'
          }
        })
        target.value = ''
      }
    }
  }
})
</script>
