<template>
  <div class="p-2 flex flex-col gap-3 max-w-xl">
    <div class="text-gray-500 text-sm">
      While you play, the toolkit shows only a row of small icons, and each one only where it's useful
      (campaign zones, hideout, maps, the lab, boss arenas). Rest the mouse on an icon for its card.
      With the overlay open, drag the row by its grip and click an icon for the full window.
    </div>
    <label class="flex items-center gap-2">
      <input v-model="dock.peeks" type="checkbox">
      <span>Peek: an icon grows into one line for 5 seconds when something happens (new zone, live search hit, map counted)</span>
    </label>
    <label class="flex items-center gap-2">
      <input v-model="dock.vertical" type="checkbox">
      <span>Stand the row on its side (a column)</span>
    </label>
    <table class="text-sm">
      <thead>
        <tr class="text-gray-500 text-left"><th class="font-normal pr-4">Icon</th><th class="font-normal pr-4">Show</th><th class="font-normal">Peek</th></tr>
      </thead>
      <tbody>
        <tr v-for="id in DOCK_ORDER" :key="id">
          <td class="pr-4 py-0.5">{{ DOCK_NAMES[id] }}</td>
          <td class="pr-4"><input type="checkbox" :checked="!dock.hidden.includes(id)" @change="toggle(dock.hidden, id)"></td>
          <td><input type="checkbox" :disabled="!dock.peeks || dock.hidden.includes(id)" :checked="!dock.noPeek.includes(id)" @change="toggle(dock.noPeek, id)"></td>
        </tr>
      </tbody>
    </table>
    <div class="flex items-center gap-2">
      <w-button size="sm" @click="resetPosition">Move the row back to its default spot</w-button>
      <span class="text-gray-500 text-sm">Right of the stash, at the top</span>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Icon row'
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config } from '@/web/Config'
import { WButton } from '../ui'
import { ensureWokeConfig } from '../modules'
import { DEFAULT_DOCK, DOCK_NAMES, DOCK_ORDER } from './dock'
import type { DockConfig } from './dock'

// `config` is the settings window's working copy; Save applies it.
const props = defineProps<{ config: Config }>()

function ensureDock (): DockConfig {
  const woke = ensureWokeConfig(props.config).woke
  woke.dock ??= { ...DEFAULT_DOCK, noPeek: [], hidden: [] }
  woke.dock.noPeek ??= []
  woke.dock.hidden ??= []
  return woke.dock
}
ensureDock()
const dock = computed<DockConfig>(() => props.config.woke?.dock ?? ensureDock())

function toggle (list: string[], id: string) {
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
  else list.push(id)
}

function resetPosition () {
  dock.value.x = DEFAULT_DOCK.x
  dock.value.y = DEFAULT_DOCK.y
  dock.value.vertical = false
}
</script>
