<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <div class="grid gap-2 items-center" style="grid-template-columns: auto 1fr;">
      <span>Hotkey: show or hide the guide</span>
      <w-hotkey-cell v-model="hotkey" />
      <span>Account name</span>
      <w-field v-model="config.accountName" placeholder="Name#1234" />
    </div>
    <w-banner v-if="!config.accountName.trim()" tone="warn">
      Set your account name to sync progress from your profile. There's no login, but your profile has to be public. Manual ticks work without it.
    </w-banner>
    <div v-else class="w-dim text-sm">No login needed. Your profile has to be public for progress to sync.</div>
    <div class="w-dim text-sm">The hotkey lets you scroll and tick right away. Press it again or Esc to go back to the game.</div>
    <w-toggle v-model="dockIcon">Show an icon in the dock with your count and next challenges</w-toggle>
    <label class="flex flex-col gap-1">
      <span>Guide page</span>
      <input v-model="url" :placeholder="DEFAULT_GUIDE_URL" class="w-input rounded px-1 leading-6">
    </label>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import WBanner from '../ui/WBanner.vue'
import WField from '../ui/WField.vue'
import WHotkeyCell from '../ui/WHotkeyCell.vue'
import WToggle from '../ui/WToggle.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import { DEFAULT_GUIDE_URL } from './widget'
import type { ChallengesWidget } from './widget'

export default defineComponent({
  name: 'Challenges',
  components: { WBanner, WField, WHotkeyCell, WToggle },
  props: configProp<ChallengesWidget>(),
  setup (props) {
    return {
      DEFAULT_GUIDE_URL,
      hotkey: configModelValue(() => props.configWidget, 'hotkey'),
      url: configModelValue(() => props.configWidget, 'url'),
      dockIcon: computed({
        get: () => props.configWidget.dockIcon === true,
        set: (v: boolean) => { props.configWidget.dockIcon = v }
      })
    }
  }
})
</script>
