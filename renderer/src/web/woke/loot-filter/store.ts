// Loads the source filter, applies the widget's edits, and saves the result.
import { computed, onUnmounted, shallowRef, ref } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { hostRequest } from '../shared/host'
import { parseLogLine } from '../campaign/log-parse'
import { parseFilter, serializeFilter } from './parse'
import type { FilterDoc } from './parse'
import { addEdit, applyEdits, nextEditId } from './edits'
import type { EditStatus, FilterEdit, NewFilterEdit } from './edits'
import { outputName } from './widget'
import type { LootFilterWidget } from './widget'

// First line of every file the editor writes; marks a filter as ours.
export const WOKE_MARK = '# WOKE-LOOT-FILTER-EDITOR'

export interface FilterFile { name: string, size: number, mtime: number }

function stem (name: string): string {
  return name.replace(/\.filter$/i, '')
}

export function useLootFilter (config: LootFilterWidget) {
  const files = shallowRef<FilterFile[]>([])
  const folder = ref('')
  // The untouched NeverSink text the edits apply to.
  const baseText = shallowRef<string | null>(null)
  // True when baseText came from a fresh source file that needs a .bak
  // (overwrite mode).
  const baseNeedsBackup = ref(false)
  const doc = shallowRef<FilterDoc | null>(null)
  const statuses = shallowRef<EditStatus[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const savedEdits = ref(JSON.stringify(config.edits))
  const lastSaved = ref<number | null>(null)
  // Version of the base file when it was loaded, to flag NeverSink updates.
  const baseVersion = ref<string | null>(null)

  // AreaLevel conditions use the level of the last map/zone entered.
  const areaLevel = ref<number | null>(null)
  const logListener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
    for (const line of e.lines) {
      const ev = parseLogLine(line)
      if (ev?.kind === 'area' && !/hideout|town/i.test(ev.areaId)) areaLevel.value = ev.areaLevel
    }
  })
  onUnmounted(() => { logListener.abort() })

  const dirty = computed(() => JSON.stringify(config.edits) !== savedEdits.value)
  const failed = computed(() => statuses.value.filter(s => !s.ok))
  const updatedSinceSave = computed(() =>
    baseVersion.value != null && config.lastVersion != null && baseVersion.value !== config.lastVersion)

  function rebuild () {
    if (baseText.value == null) { doc.value = null; return }
    const next = parseFilter(baseText.value)
    statuses.value = applyEdits(next, config.edits)
    doc.value = next
  }

  async function listFiles () {
    try {
      const res = await hostRequest<{ dir: string, files: FilterFile[] }>('filter-list', { dir: config.folder })
      folder.value = res.dir
      files.value = res.files
    } catch (e) {
      error.value = `Can't read the filter folder: ${(e as Error).message}`
    }
  }

  async function load () {
    if (!config.sourceName) {
      await listFiles()
      // Pick the most recently changed NeverSink file as a starting point.
      const ns = files.value.find(f => /neversink/i.test(f.name) && !/\(woke\)/i.test(f.name))
      if (ns) config.sourceName = ns.name
      else return
    }
    loading.value = true
    error.value = null
    try {
      let { text } = await hostRequest<{ text: string }>('filter-read', { dir: config.folder, name: config.sourceName })
      baseNeedsBackup.value = false
      if (text.startsWith(WOKE_MARK)) {
        // Our own output (overwrite mode): the original lives in the .bak.
        text = (await hostRequest<{ text: string }>('filter-read', { dir: config.folder, name: config.sourceName + '.bak' })).text
      } else if (config.saveMode === 'overwrite') {
        baseNeedsBackup.value = true
      }
      baseText.value = text
      rebuild()
      baseVersion.value = doc.value?.version ?? null
    } catch (e) {
      error.value = `Can't open ${config.sourceName}: ${(e as Error).message}`
      baseText.value = null
      doc.value = null
    } finally {
      loading.value = false
    }
  }

  function edit (e: NewFilterEdit | FilterEdit) {
    config.edits = addEdit(config.edits, { ...e, id: nextEditId() } as FilterEdit)
    rebuild()
  }

  function removeEdit (id: number) {
    config.edits = config.edits.filter(e => e.id !== id)
    rebuild()
  }

  function header (): string[] {
    const d = doc.value!
    return [
      WOKE_MARK,
      `# Made from "${config.sourceName}"${d.version ? ` (NeverSink ${d.version})` : ''} with ${config.edits.length} change(s).`,
      '# This file is rewritten on every save from the loot filter editor; change it there.',
      ''
    ]
  }

  async function save (): Promise<boolean> {
    if (!doc.value || baseText.value == null) return false
    saving.value = true
    error.value = null
    try {
      const name = outputName(config)
      if (config.saveMode === 'overwrite' && baseNeedsBackup.value) {
        await hostRequest('filter-write', { dir: config.folder, name: config.sourceName + '.bak', text: baseText.value })
        baseNeedsBackup.value = false
      }
      await hostRequest('filter-write', { dir: config.folder, name, text: serializeFilter(doc.value, header()) })
      savedEdits.value = JSON.stringify(config.edits)
      config.lastVersion = doc.value.version
      lastSaved.value = Date.now()
      if (config.reloadViaChat) reloadInGame()
      return true
    } catch (e) {
      error.value = `Couldn't save: ${(e as Error).message}`
      return false
    } finally {
      saving.value = false
    }
  }

  // One chat command, sent because the user pressed Save.
  function reloadInGame () {
    MainProcess.sendEvent({
      name: 'CLIENT->MAIN::user-action',
      payload: { action: 'paste-in-chat', text: `/itemfilter ${stem(outputName(config))}` }
    })
  }

  return {
    files,
    folder,
    doc,
    statuses,
    failed,
    loading,
    saving,
    error,
    dirty,
    lastSaved,
    baseVersion,
    updatedSinceSave,
    areaLevel,
    listFiles,
    load,
    edit,
    removeEdit,
    save,
    reloadInGame
  }
}

export type LootFilterStore = ReturnType<typeof useLootFilter>
