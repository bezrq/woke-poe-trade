<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <input class="bg-gray-900 rounded px-1 w-48" placeholder="Widget title" v-model="title" />
    <div class="text-gray-400 text-sm">
      The tracker reads Client.txt, so set its path in APT's general settings. It updates on your next zone change.
    </div>
    <label class="flex flex-col gap-1">
      <span>Character name (optional)</span>
      <input v-model="charName" class="bg-gray-900 rounded px-1 leading-6 w-64"
        placeholder="Only follow this character's level-ups">
    </label>
    <ui-checkbox v-model="showBuild">Show the active PoB build's tree and main gems</ui-checkbox>

    <div>
      <div class="mb-1">Act notes</div>
      <div class="flex flex-col gap-1">
        <label v-for="act in acts" :key="act" class="grid gap-1 items-start" style="grid-template-columns: 5rem 1fr;">
          <span class="text-gray-400 pt-1">{{ actLabel(act) }}</span>
          <textarea :value="configWidget.actNotes[String(act)] ?? ''" @input="setActNote(act, $event)"
            rows="2" class="bg-gray-900 rounded px-1" placeholder="Route, quests, gems to buy…" />
        </label>
      </div>
    </div>

    <div>
      <div class="mb-1">Zone notes</div>
      <div class="text-gray-400 text-sm mb-1">Shown when you enter a zone with this exact name, e.g. "The Ledge".</div>
      <div class="flex flex-col gap-2">
        <div v-for="note in configWidget.zoneNotes" :key="note.id" class="grid gap-1" style="grid-template-columns: 1fr auto;">
          <input v-model="note.zone" placeholder="Zone name" class="bg-gray-900 rounded px-1 leading-6">
          <button class="leading-none rounded bg-gray-700 w-6 h-6" @click="removeZoneNote(note.id)">
            <i class="fas fa-times text-gray-400" />
          </button>
          <textarea v-model="note.text" rows="2" placeholder="Layout tip, what to grab…" class="bg-gray-900 rounded px-1 col-span-2" />
        </div>
      </div>
      <button class="btn mt-2" @click="addZoneNote">Add zone note</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import UiCheckbox from '@/web/ui/UiCheckbox.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import { nextId } from '../shared/library'
import { actLabel } from './log-parse'
import type { CampaignWidget } from './widget'

export default defineComponent({
  name: 'Campaign tracker',
  components: { UiCheckbox },
  props: configProp<CampaignWidget>(),
  setup (props) {
    return {
      acts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      actLabel,
      title: configModelValue(() => props.configWidget, 'wmTitle'),
      charName: configModelValue(() => props.configWidget, 'charName'),
      showBuild: configModelValue(() => props.configWidget, 'showBuild'),
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
