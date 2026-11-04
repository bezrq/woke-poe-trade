<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <input class="bg-gray-900 rounded px-1 w-48" placeholder="Widget title" v-model="title" />
    <div class="text-gray-400 text-sm">
      Follows the built-in levelling route from <a href="https://github.com/HeartofPhos/exile-leveling" target="_blank" class="underline">exile-leveling</a>
      (MIT). Steps move on by themselves as you enter each zone. It reads Client.txt, so check its path in the general settings.
    </div>

    <div>
      <div class="mb-1">Route</div>
      <div class="flex flex-col gap-1">
        <ui-checkbox v-model="leagueStart">League start: trials, the Den and other extra stops</ui-checkbox>
        <ui-checkbox v-model="library">Siosa's library gem stop in Act 3</ui-checkbox>
        <label class="flex items-center gap-2">
          <span>Bandits</span>
          <select v-model="bandit" class="bg-gray-900 rounded px-1 leading-6 w-40">
            <option value="kill">Kill all</option>
            <option value="oak">Help Oak</option>
            <option value="kraityn">Help Kraityn</option>
            <option value="alira">Help Alira</option>
          </select>
        </label>
        <div class="flex items-center gap-2">
          <span class="text-gray-400">Step {{ Math.min(configWidget.step + 1, total) }} of {{ total }}</span>
          <button class="btn" @click="configWidget.step = 0">Restart route</button>
        </div>
      </div>
    </div>

    <div>
      <div class="mb-1">Display</div>
      <div class="flex flex-col gap-1">
        <ui-checkbox v-model="cardOpen">Show the guide card (off: one line in the strip)</ui-checkbox>
        <label class="flex items-center gap-2">
          <span>Steps on the card</span>
          <input v-model.number="cardSteps" type="number" min="1" max="8" class="bg-gray-900 rounded px-1 leading-6 w-16">
        </label>
        <ui-checkbox v-model="hideAfterCampaign">Hide in maps and hideouts once the campaign is done</ui-checkbox>
        <ui-checkbox v-model="showBuild">Show the active PoB build's tree and main gems on the card</ui-checkbox>
      </div>
    </div>

    <div class="grid gap-2 items-center" style="grid-template-columns: auto 1fr;">
      <span>Hotkey: show/hide guide</span>
      <hotkey-input v-model="hotkeyCard" />
      <span>Hotkey: step done</span>
      <hotkey-input v-model="hotkeyNext" />
      <span>Hotkey: step back</span>
      <hotkey-input v-model="hotkeyPrev" />
    </div>

    <label class="flex flex-col gap-1">
      <span>Character name (optional)</span>
      <input v-model="charName" class="bg-gray-900 rounded px-1 leading-6 w-64"
        placeholder="Only follow this character's level-ups">
    </label>

    <details>
      <summary class="cursor-pointer">Personal notes (optional)</summary>
      <div class="text-gray-400 text-sm my-1">Extra reminders shown on the card under the route. You don't need these.</div>
      <div class="flex flex-col gap-1">
        <label v-for="act in acts" :key="act" class="grid gap-1 items-start" style="grid-template-columns: 5rem 1fr;">
          <span class="text-gray-400 pt-1">{{ actLabel(act) }}</span>
          <textarea :value="configWidget.actNotes[String(act)] ?? ''" @input="setActNote(act, $event)"
            rows="2" class="bg-gray-900 rounded px-1" placeholder="Note for the whole act" />
        </label>
      </div>
      <div class="mt-2 mb-1">Zone notes</div>
      <div class="flex flex-col gap-2">
        <div v-for="note in configWidget.zoneNotes" :key="note.id" class="grid gap-1" style="grid-template-columns: 1fr auto;">
          <input v-model="note.zone" placeholder="Zone name, e.g. The Ledge" class="bg-gray-900 rounded px-1 leading-6">
          <button class="leading-none rounded bg-gray-700 w-6 h-6" @click="removeZoneNote(note.id)">
            <i class="fas fa-times text-gray-400" />
          </button>
          <textarea v-model="note.text" rows="2" placeholder="Reminder" class="bg-gray-900 rounded px-1 col-span-2" />
        </div>
      </div>
      <button class="btn mt-2" @click="addZoneNote">Add zone note</button>
    </details>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import UiCheckbox from '@/web/ui/UiCheckbox.vue'
import HotkeyInput from '@/web/settings/HotkeyInput.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import { nextId } from '../shared/library'
import { actLabel } from './log-parse'
import { migrateCampaign } from './widget'
import type { CampaignWidget } from './widget'
import { bundledRoute } from './route-data'
import type { RouteOptions } from './route-parse'

export default defineComponent({
  name: 'Campaign tracker',
  components: { UiCheckbox, HotkeyInput },
  props: configProp<CampaignWidget>(),
  setup (props) {
    migrateCampaign(props.configWidget)
    function routeOpt<K extends keyof RouteOptions> (key: K) {
      return computed({
        get: () => props.configWidget.route[key],
        set: (value: RouteOptions[K]) => { props.configWidget.route = { ...props.configWidget.route, [key]: value } }
      })
    }
    return {
      acts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      actLabel,
      total: computed(() => bundledRoute(props.configWidget.route).steps.length),
      title: configModelValue(() => props.configWidget, 'wmTitle'),
      charName: configModelValue(() => props.configWidget, 'charName'),
      showBuild: configModelValue(() => props.configWidget, 'showBuild'),
      cardOpen: configModelValue(() => props.configWidget, 'cardOpen'),
      cardSteps: configModelValue(() => props.configWidget, 'cardSteps'),
      hideAfterCampaign: configModelValue(() => props.configWidget, 'hideAfterCampaign'),
      hotkeyCard: configModelValue(() => props.configWidget, 'hotkeyCard'),
      hotkeyNext: configModelValue(() => props.configWidget, 'hotkeyNext'),
      hotkeyPrev: configModelValue(() => props.configWidget, 'hotkeyPrev'),
      leagueStart: routeOpt('leagueStart'),
      library: routeOpt('library'),
      bandit: routeOpt('bandit'),
      setActNote (act: number, e: Event) {
        props.configWidget.actNotes = { ...props.configWidget.actNotes, [String(act)]: (e.target as HTMLTextAreaElement).value }
      },
      addZoneNote () {
        props.configWidget.zoneNotes.push({ id: nextId(props.configWidget.zoneNotes), zone: '', text: '' })
      },
      removeZoneNote (id: number) {
        props.configWidget.zoneNotes = props.configWidget.zoneNotes.filter(n => n.id !== id)
      }
    }
  }
})
</script>
