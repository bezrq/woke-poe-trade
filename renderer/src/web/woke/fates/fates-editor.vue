<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <div class="grid gap-2 items-center" style="grid-template-columns: auto 1fr;">
      <span>Hotkey: read the open Fate window</span>
      <w-hotkey-cell v-model="hotkey" />
      <span>Invoke slots unlocked</span>
      <select v-model.number="slots" class="rounded w-input px-1 block" style="width: 5rem;">
        <option :value="1">1</option>
        <option :value="2">2</option>
        <option :value="3">3</option>
      </select>
      <span>Fate window size</span>
      <span class="flex items-center gap-2">
        <input v-model.number="uiScale" type="number" min="0.6" max="1.6" step="0.01" class="rounded w-input px-1 block" style="width: 5rem;">
        <span class="text-sm" style="color: var(--w-dim);">1 fits any resolution; change only if cards aren't found</span>
      </span>
    </div>
    <div>
      <div class="mb-1">What one of each reward is worth to you</div>
      <div class="grid gap-x-3 gap-y-1" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
        <label v-for="r in rewards" :key="r.icon" class="flex items-center gap-2" :title="r.examples.join('\n')">
          <img :src="`/images/fates/${r.icon}.png`" alt="" style="width: 22px; height: 22px;">
          <span class="flex-1 w-trunc">{{ r.label }}</span>
          <input :value="value(r.icon)" type="number" min="0" step="1" class="rounded w-input px-1 block" style="width: 4rem;"
            @change="setValue(r.icon, ($event.target as HTMLInputElement).valueAsNumber)">
        </label>
      </div>
    </div>
    <div>
      <div class="mb-1">Highest tier you'll fight, per Fate</div>
      <div class="grid gap-x-3 gap-y-1" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
        <label v-for="f in fates" :key="f.id" class="flex items-center gap-2" :title="f.summary">
          <span class="flex-1 w-trunc">{{ f.name }}</span>
          <select :value="maxTierOf(f.id)" class="rounded w-input px-1 block" style="width: 6rem;" @change="setMaxTier(f.id, Number(($event.target as HTMLSelectElement).value))">
            <option :value="3">Any</option>
            <option :value="2">Up to 2</option>
            <option :value="1">Tier 1</option>
            <option :value="0">Never</option>
          </select>
        </label>
      </div>
    </div>
    <div class="flex items-center gap-2 text-sm" style="color: var(--w-dim);">
      How it decides
      <w-info :text="'Press the hotkey with a Fate pick or Invoke Fates open. It reads the cards from the screen (no OCR): each Fate, its tier and its reward icons.\n\nOn Invoke Fates it lists click orders, best first. Cards fill the slots left to right as you click them. A second copy of a Fate uses a slot, triples the first copy\'s rewards and raises its tier; its own rewards are lost. Rewards with a 2- or 3-part bar pay once that many parts are invoked across all your Fates.\n\nOn a pick it marks the Fate to take: the one that makes the best invocation with what you already hold, counting part-done barred rewards at half.\n\nWorth is per reward, in any unit you like; Fates over your tier limit are left out.'" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import WHotkeyCell from '../ui/WHotkeyCell.vue'
import { WInfo } from '../ui'
import { configModelValue, configProp } from '@/web/settings/utils'
import type { FatesWidget } from './widget'
import { normalizeFatesWidget } from './widget'
import { FATES, REWARD_ICONS } from './data'
import { DEFAULT_VALUE } from './rank'

export default defineComponent({
  name: 'Fates',
  components: { WHotkeyCell, WInfo },
  props: configProp<FatesWidget>(),
  setup (props) {
    normalizeFatesWidget(props.configWidget)
    const rewards = REWARD_ICONS.map(r => ({ ...r, label: r.examples[0].split('\n')[0].replace(/^an? /, '') }))
    const fates = [...FATES].sort((a, b) => a.name.localeCompare(b.name))
    return {
      hotkey: configModelValue(() => props.configWidget, 'hotkey'),
      slots: configModelValue(() => props.configWidget, 'slots'),
      uiScale: configModelValue(() => props.configWidget, 'uiScale'),
      rewards,
      fates,
      value: (icon: string) => props.configWidget.values[icon] ?? DEFAULT_VALUE,
      setValue: (icon: string, v: number) => { props.configWidget.values = { ...props.configWidget.values, [icon]: Number.isFinite(v) && v >= 0 ? v : 0 } },
      maxTierOf: (id: string) => props.configWidget.maxTier[id] ?? 3,
      setMaxTier: (id: string, t: number) => { props.configWidget.maxTier = { ...props.configWidget.maxTier, [id]: t } }
    }
  }
})
</script>
