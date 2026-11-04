// Loads the source filter, applies the widget's edits, and saves the result.
import { computed, onUnmounted, shallowRef, ref, watch } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { hostRequest } from '../shared/host'
import { parseLogLine } from '../campaign/log-parse'
import { parseFilter, serializeFilter } from './parse'
import type { FilterDoc } from './parse'
import { addEdit, applyEdits, nextEditId } from './edits'
import type { EditStatus, FilterEdit, NewFilterEdit } from './edits'
import { outputName } from './widget'
import type { LootFilterWidget } from './widget'
import { buildRuleBlocks, insertBuildBlocks } from './build-rules'
import { useBuildRuleInput } from './build-input'

// First line of every file the editor writes; marks a filter as ours.
export const WOKE_MARK = '# WOKE-LOOT-FILTER-EDITOR'

export interface FilterFile { name: string, size: number, mtime: number, online?: boolean, title?: string }

// Short, stable fingerprint of the build rules (kept in config).
function hash (text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

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
  const buildBlockCount = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  // Rules from the active PoB build; part of what "unsaved" compares.
  const buildInput = useBuildRuleInput()
  const buildSig = computed(() => JSON.stringify(buildInput.value ? [buildInput.value, config.buildRules] : null))
  const signature = () => JSON.stringify([config.edits, hash(buildSig.value)])
  // The build part is only known once the build file is read, so start from
  // what the last save used.
  const savedEdits = ref(JSON.stringify([config.edits, config.savedBuildSig ?? hash(buildSig.value)]))
  const lastSaved = ref<number | null>(null)
  // Version of the base file when it was loaded, to flag NeverSink updates.
  const baseVersion = ref<string | null>(null)

  // AreaLevel conditions use the level of the last map/zone entered.
  const areaLevel = ref<number | null>(null)
  // Town or hideout (null until Client.txt shows an area change).
  const inSafeZone = ref<boolean | null>(null)
  // A reload held until the next town/hideout visit.
  const pendingReload = ref(false)
  // The area line is written while the loading screen is still up, when the
  // game drops the keys we'd type; wait until the zone has loaded.
  const RELOAD_AFTER_LOAD_MS = 4000
  let reloadTimer: ReturnType<typeof setTimeout> | undefined
  const logListener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
    for (const line of e.lines) {
      const ev = parseLogLine(line)
      if (ev?.kind !== 'area') continue
      const safe = /hideout|town/i.test(ev.areaId)
      inSafeZone.value = safe
      if (!safe) areaLevel.value = ev.areaLevel
      clearTimeout(reloadTimer)
      if (safe && pendingReload.value) {
        reloadTimer = setTimeout(() => {
          if (!pendingReload.value || inSafeZone.value !== true) return
          pendingReload.value = false
          sendReload()
        }, RELOAD_AFTER_LOAD_MS)
      }
    }
  })
  onUnmounted(() => {
    logListener.abort()
    clearTimeout(reloadTimer)
  })

  const dirty = computed(() => signature() !== savedEdits.value)
  const failed = computed(() => statuses.value.filter(s => !s.ok))
  const updatedSinceSave = computed(() =>
    baseVersion.value != null && config.lastVersion != null && baseVersion.value !== config.lastVersion)

  function rebuild () {
    if (baseText.value == null) { doc.value = null; return }
    const next = parseFilter(baseText.value)
    // Build rules go in first, so edits to them (restyles) apply on top.
    const input = buildInput.value
    buildBlockCount.value = 0
    if (input) {
      const blocks = buildRuleBlocks(input, config.buildRules)
      insertBuildBlocks(next, blocks)
      buildBlockCount.value = blocks.length
    }
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
      const ns = files.value.find(f => !f.online && /neversink/i.test(f.name) && !/\(woke\)/i.test(f.name)) ??
        files.value.find(f => f.online && /neversink/i.test(f.title ?? ''))
      if (!ns) return
      config.sourceName = ns.name
      config.sourceOnline = Boolean(ns.online)
      config.sourceTitle = ns.title ?? ''
    }
    loading.value = true
    error.value = null
    try {
      let { text } = await hostRequest<{ text: string }>('filter-read', { dir: config.folder, name: config.sourceName, online: config.sourceOnline })
      baseNeedsBackup.value = false
      if (config.sourceOnline) {
        // Read only; saves go to a local copy.
      } else if (text.startsWith(WOKE_MARK)) {
        // Our own output. Overwrite mode keeps the original in the .bak; a
        // copy-mode output names its source in the header instead.
        try {
          text = (await hostRequest<{ text: string }>('filter-read', { dir: config.folder, name: config.sourceName + '.bak' })).text
        } catch (e) {
          const from = /^# Made from "([^"]+\.filter)"/m.exec(text)?.[1]
          if (!from || from === config.sourceName) throw e
          text = (await hostRequest<{ text: string }>('filter-read', { dir: config.folder, name: from })).text
          config.sourceName = from
        }
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

  // Points a failed edit at a new group/tier (after a NeverSink update).
  function replaceEdit (next: FilterEdit) {
    config.edits = config.edits.map(e => e.id === next.id ? next : e)
    rebuild()
  }

  // Returns a function that puts the edit back (for the Undo toast).
  function removeEdit (id: number) {
    const before = config.edits
    config.edits = before.filter(e => e.id !== id)
    rebuild()
    return () => { config.edits = before; rebuild() }
  }

  function header (): string[] {
    const d = doc.value!
    return [
      WOKE_MARK,
      `# Made from "${config.sourceOnline ? `${config.sourceTitle} (online filter, this copy doesn't auto-update)` : config.sourceName}"${d.version ? ` (NeverSink ${d.version})` : ''} with ${config.edits.length} change(s)${buildBlockCount.value ? ` and ${buildBlockCount.value} build rule(s) for ${buildInput.value?.buildName ?? 'your build'}` : ''}.`,
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
      if (!config.sourceOnline && config.saveMode === 'overwrite' && baseNeedsBackup.value) {
        await hostRequest('filter-write', { dir: config.folder, name: config.sourceName + '.bak', text: baseText.value })
        baseNeedsBackup.value = false
      }
      await hostRequest('filter-write', { dir: config.folder, name, text: serializeFilter(doc.value, header()) })
      savedEdits.value = signature()
      config.savedBuildSig = hash(buildSig.value)
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

  // One chat command, sent because the user pressed Save. With
  // reloadWhenSafe it waits until town/hideout, so it never lands mid-fight.
  function reloadInGame (force = false) {
    if (!force && config.reloadWhenSafe && inSafeZone.value !== true) {
      pendingReload.value = true
      return
    }
    pendingReload.value = false
    sendReload()
  }

  function sendReload () {
    MainProcess.sendEvent({
      name: 'CLIENT->MAIN::user-action',
      payload: { action: 'paste-in-chat', text: `/itemfilter ${stem(outputName(config))}` }
    })
  }

  // A new active build, or a rule switched on or off: show it right away.
  watch(buildSig, () => { if (baseText.value != null) rebuild() })

  return {
    buildInput,
    buildBlockCount,
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
    inSafeZone,
    pendingReload,
    listFiles,
    load,
    edit,
    removeEdit,
    replaceEdit,
    save,
    reloadInGame
  }
}

export type LootFilterStore = ReturnType<typeof useLootFilter>
