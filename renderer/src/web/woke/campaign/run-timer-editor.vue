<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <input class="bg-gray-900 rounded px-1 w-48" placeholder="Widget title" v-model="title" />
    <div class="text-gray-400 text-sm">
      The timer reads Client.txt, so set its path in APT's general settings. A run splits when you first enter
      each new act and finishes when you reach the Epilogue after Kitava. Use the strip's buttons (with the overlay
      active) to start, pause or end a run by hand.
    </div>
    <ui-checkbox v-model="autoStart">Start a new run when a character enters The Twilight Strand</ui-checkbox>
    <label class="flex flex-col gap-1">
      <span>Character name (optional)</span>
      <input v-model="charName" class="bg-gray-900 rounded px-1 leading-6 w-64"
        placeholder="Only follow this character's level-ups">
    </label>
    <div class="flex items-center gap-2">
      <span class="text-gray-400">{{ configWidget.history.length }} saved run(s)</span>
      <button class="btn" :disabled="!configWidget.history.length" @click="confirmClear = true" v-if="!confirmClear">Clear past runs</button>
      <template v-else>
        <span>Delete every saved run, including your PB?</span>
        <button class="btn" @click="clearHistory">Delete</button>
        <button class="btn" @click="confirmClear = false">Keep</button>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'
import UiCheckbox from '@/web/ui/UiCheckbox.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import type { RunTimerWidget } from './run-timer'

export default defineComponent({
  name: 'Campaign run timer',
  components: { UiCheckbox },
  props: configProp<RunTimerWidget>(),
  setup (props) {
    const confirmClear = shallowRef(false)
    return {
      confirmClear,
      title: configModelValue(() => props.configWidget, 'wmTitle'),
      autoStart: configModelValue(() => props.configWidget, 'autoStart'),
      charName: configModelValue(() => props.configWidget, 'charName'),
      clearHistory () {
        props.configWidget.history = []
        props.configWidget.compareTo = null
        confirmClear.value = false
      }
    }
  }
})
</script>
