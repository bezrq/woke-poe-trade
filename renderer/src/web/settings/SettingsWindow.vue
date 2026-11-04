<template>
  <div :class="$style.root">
    <WokeSettings :widget="config" />
  </div>
</template>

<script lang="ts">
// woke: the settings window's layout, pages and saving live in
// woke/settings/SettingsShell.vue; this file only registers the widget.
import { defineComponent, nextTick, PropType } from 'vue'
import type { Widget, WidgetSpec } from '@/web/overlay/interfaces'
import { WokeSettings } from '@/web/woke'

export default defineComponent({
  widget: {
    type: 'settings',
    instances: 'single',
    initInstance: () => {
      return {
        wmId: 0,
        wmType: 'settings',
        wmTitle: '{icon=fa-cog}',
        wmWants: 'hide',
        wmZorder: 'exclusive',
        wmFlags: ['invisible-on-blur', 'ignore-ui-visibility']
      }
    }
  } satisfies WidgetSpec,
  components: { WokeSettings },
  props: {
    config: {
      type: Object as PropType<Widget>,
      required: true
    }
  },
  setup (props) {
    nextTick(() => {
      props.config.wmWants = 'hide'
    })
    return {}
  }
})
</script>

<style lang="postcss" module>
.root {
  position: absolute;
  inset: 0;
}
</style>
