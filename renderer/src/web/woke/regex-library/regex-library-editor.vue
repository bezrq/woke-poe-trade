<template>
  <div class="max-w-xl p-2">
    <input class="bg-gray-900 rounded px-1 w-48 mb-2" placeholder="Widget title"
      v-model="title" />
    <dnd-container tag="div" class="flex flex-col gap-y-3"
      v-model="entries" item-key="id"
      handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true">
      <template #item="{ element: entry }">
        <div class="grid gap-0.5" style="grid-template-columns: auto 1fr 1fr auto;">
          <button class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6" data-qa="drag-handle">
            <i class="fas fa-grip-vertical text-gray-400" />
          </button>
          <input v-model="entry.text" placeholder="search string or regex"
            class="px-1 col-span-2 leading-6"
            :class="(entry.text.length > MAX_SEARCH_LENGTH) ? 'bg-red-800' : 'bg-gray-900'">
          <button class="leading-none rounded-r bg-gray-700 w-6 h-6" @click="removeEntry(entry.id)">
            <i class="fas fa-times text-gray-400" />
          </button>
          <input v-model="entry.name" placeholder="name"
            class="bg-gray-900 px-1 col-start-2 leading-6 rounded">
          <input v-model="entry.category" placeholder="category (e.g. Maps, Vendor)"
            class="bg-gray-900 px-1 leading-6 rounded">
          <input :value="entry.tags.join(', ')" @change="setTags(entry, $event)" placeholder="tags, comma separated"
            class="bg-gray-900 px-1 col-start-2 leading-6 rounded">
          <hotkey-input v-model="entry.hotkey" />
          <input v-model="entry.notes" placeholder="notes"
            class="bg-gray-900 px-1 col-start-2 col-span-2 leading-6 rounded">
          <div class="col-start-2 col-span-2 text-xs text-gray-500">
            {{ entry.text.length }}/{{ MAX_SEARCH_LENGTH }} characters
          </div>
        </div>
      </template>
    </dnd-container>
    <div class="flex gap-x-2 mt-3">
      <button class="btn" style="min-width: 6rem;" @click="addEntry">Add</button>
      <button class="btn" @click="openExport">Export</button>
      <button class="btn" @click="openImport">Import</button>
    </div>
    <div v-if="ioMode" class="mt-2 flex flex-col gap-1">
      <div class="text-gray-400 text-sm">
        {{ ioMode === 'export' ? 'Copy this JSON to back up or share your library.' : 'Paste a JSON array of entries. They are added after your existing ones.' }}
      </div>
      <textarea v-model="ioText" rows="8" class="bg-gray-900 rounded p-1 font-mono text-xs"
        :readonly="ioMode === 'export'" />
      <div class="flex gap-x-2 items-center">
        <button v-if="ioMode === 'import'" class="btn" @click="doImport">Add entries</button>
        <button class="btn" @click="ioMode = null">Close</button>
        <span v-if="ioError" class="text-red-400 text-sm">{{ ioError }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'
import DndContainer from 'vuedraggable'
import HotkeyInput from '@/web/settings/HotkeyInput.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import { MAX_SEARCH_LENGTH, emptyEntry, exportEntries, parseImport } from './widget'
import type { RegexEntry, RegexLibraryWidget } from './widget'
import { parseTags } from '../shared/library'

export default defineComponent({
  name: 'Regex library',
  components: { DndContainer, HotkeyInput },
  props: configProp<RegexLibraryWidget>(),
  setup (props) {
    const ioMode = shallowRef<'import' | 'export' | null>(null)
    const ioText = shallowRef('')
    const ioError = shallowRef('')

    return {
      MAX_SEARCH_LENGTH,
      title: configModelValue(() => props.configWidget, 'wmTitle'),
      entries: configModelValue(() => props.configWidget, 'entries'),
      ioMode,
      ioText,
      ioError,
      removeEntry (id: number) {
        props.configWidget.entries = props.configWidget.entries.filter(e => e.id !== id)
      },
      addEntry () {
        props.configWidget.entries.push(emptyEntry(props.configWidget.entries))
      },
      setTags (entry: RegexEntry, e: Event) {
        entry.tags = parseTags((e.target as HTMLInputElement).value)
      },
      openExport () {
        ioMode.value = 'export'
        ioError.value = ''
        ioText.value = exportEntries(props.configWidget.entries)
      },
      openImport () {
        ioMode.value = 'import'
        ioError.value = ''
        ioText.value = ''
      },
      doImport () {
        try {
          const added = parseImport(ioText.value, props.configWidget.entries)
          props.configWidget.entries.push(...added)
          ioError.value = `Added ${added.length} entries`
          ioText.value = ''
        } catch (err) {
          ioError.value = (err as Error).message
        }
      }
    }
  }
})
</script>
