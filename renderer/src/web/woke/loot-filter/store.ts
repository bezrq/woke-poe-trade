// Loads the source filter, applies the widget's edits, and saves the result.
import { computed, onUnmounted, shallowRef, ref, watch } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { hostRequest } from '../shared/host'
import { parseLogLine } from '../campaign/log-parse'
import { parseFilter, serializeFilter } from './parse'
import type { FilterDoc } from './parse'
import { addEdit, applyEdits, nextEditId } from './edits'
import type { EditStatus, FilterEdit, NewFilterEdit } from './edits'
import { HISTORY_SIZE, outputName } from './widget'
import type { LootFilterWidget } from './widget'
import { buildRuleBlocks, insertBuildBlocks } from './build-rules'
import { useBuildRuleInput } from './build-input'
import { applyPriceMoves, lockKey, lockedByEdits, mergeMoves, planRetier } from './economy'
import type { PriceMove, RetierPlan } from './economy'
import { SAFETY_RULE_TYPE, auditBases, safetyBases, safetyBlocks } from './safety'
import type { BaseVerdict } from './safety'
import { describeProblem, validateFilter } from './validate'
import type { FilterProblem } from './validate'
import { useFilterPrices } from './prices'
import { publishActiveFilter } from './active-filter'

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
  // Price moves and the safety net's current list are part of the file too.
  const safetyList = shallowRef<string>('')
  const extraSig = () => hash(JSON.stringify([config.priceTiers.on ? config.priceTiers.moves : [], config.safetyNet.on ? safetyList.value : '']))
  const signature = () => JSON.stringify([config.edits, hash(buildSig.value), extraSig()])
  // The build part is only known once the build file is read, so start from
  // what the last save used.
  const savedEdits = ref(JSON.stringify([config.edits, config.savedBuildSig ?? hash(buildSig.value), config.savedExtraSig ?? extraSig()]))
  const prices = useFilterPrices(() => config.priceTiers.uniqueRule)
  // Problems found by the last save attempt.
  const problems = shallowRef<FilterProblem[]>([])
  const safetyCount = ref(0)
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
    // Price moves next: your own moves (edits) are applied after them and win.
    if (config.priceTiers.on && config.priceTiers.moves.length) applyPriceMoves(next, config.priceTiers.moves)
    const isNetEdit = (e: FilterEdit) => e.type === SAFETY_RULE_TYPE
    const results = new Map(applyEdits(next, config.edits.filter(e => !isNetEdit(e))).map(r => [r.edit.id, r]))
    // The safety net goes on top, listing only what the rest still hides.
    // Restyles of the net apply after it exists.
    safetyCount.value = 0
    safetyList.value = ''
    const lookup = prices.lookup.value
    if (config.safetyNet.on && lookup) {
      const bases = safetyBases(next, lookup, config.safetyNet.minChaos)
      const blocks = safetyBlocks(bases)
      insertBuildBlocks(next, blocks)
      safetyCount.value = bases.plain.length + bases.unique.length
      safetyList.value = JSON.stringify(bases)
    }
    for (const r of applyEdits(next, config.edits.filter(isNetEdit))) results.set(r.edit.id, r)
    statuses.value = config.edits.map(e => results.get(e.id)!)
    doc.value = next
    publishActiveFilter(api)
  }

  // ---- prices ----

  const locked = computed(() => lockedByEdits(config.edits, config.priceTiers.locks))
  const plan = computed<RetierPlan | null>(() => {
    const d = doc.value
    const lookup = prices.lookup.value
    if (!d || !lookup || !config.priceTiers.on) return null
    return planRetier(d, lookup, { locked: locked.value })
  })
  // Valuable items the filter (without the safety net) hides or shows small.
  const health = computed<BaseVerdict[]>(() => {
    const d = doc.value
    const lookup = prices.lookup.value
    if (!d || !lookup) return []
    return auditBases(d, lookup, Math.min(config.safetyNet.minChaos, 10)).filter(v => v.state !== 'ok' && !v.thin)
  })

  // Applies the planned moves (all, or the ones passed).
  function applyPrices (moves?: PriceMove[]) {
    const list = moves ?? plan.value?.moves ?? []
    if (!list.length) return () => {}
    const before = config.priceTiers.moves
    config.priceTiers.prev = before
    config.priceTiers.moves = mergeMoves(before, list)
    config.priceTiers.appliedAt = Date.now()
    rebuild()
    return () => {
      config.priceTiers.moves = before
      config.priceTiers.prev = null
      rebuild()
    }
  }

  // Keeps an item where it is: prices won't move it again.
  function lockItem (type: string, base: string) {
    const key = lockKey(type, base)
    if (!config.priceTiers.locks.includes(key)) config.priceTiers.locks = [...config.priceTiers.locks, key]
    return () => { config.priceTiers.locks = config.priceTiers.locks.filter(k => k !== key) }
  }

  // Back to NeverSink's own tiers for every price group.
  function resetPrices () {
    const before = config.priceTiers.moves
    config.priceTiers.prev = before
    config.priceTiers.moves = []
    rebuild()
    return () => { config.priceTiers.moves = before; rebuild() }
  }

  // Price index updates, or settings that change the net: refresh.
  watch(() => [prices.lookup.value, config.safetyNet.on, config.safetyNet.minChaos, config.priceTiers.on], () => {
    if (baseText.value != null) rebuild()
  })

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
    prices.wantPrices()
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

  // Adds an edit and returns a function that takes it back out (for Undo).
  function editWithUndo (e: NewFilterEdit | FilterEdit): () => void {
    const before = config.edits
    edit(e)
    return () => { config.edits = before; rebuild() }
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

  function pushHistory () {
    const last = config.history[0]
    const moves = config.priceTiers.moves
    if (last && JSON.stringify([last.edits, last.moves]) === JSON.stringify([config.edits, moves])) return
    const label = `${config.edits.length} change(s)${moves.length ? `, ${moves.length} price move(s)` : ''}`
    config.history = [{ ts: Date.now(), label, edits: config.edits, moves }, ...config.history].slice(0, HISTORY_SIZE)
  }

  // Puts the changes back as they were at an earlier save.
  function restore (ts: number) {
    const point = config.history.find(h => h.ts === ts)
    if (!point) return () => {}
    const before = { edits: config.edits, moves: config.priceTiers.moves }
    config.edits = point.edits
    config.priceTiers.moves = point.moves
    rebuild()
    return () => { config.edits = before.edits; config.priceTiers.moves = before.moves; rebuild() }
  }

  async function save (): Promise<boolean> {
    if (!doc.value || baseText.value == null) return false
    problems.value = validateFilter(doc.value)
    if (problems.value.length) {
      error.value = `Not saved, the game would reject it: ${describeProblem(problems.value[0])}${problems.value.length > 1 ? ` (and ${problems.value.length - 1} more)` : ''}`
      return false
    }
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
      config.savedExtraSig = extraSig()
      pushHistory()
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

  const api = {
    config,
    prices,
    plan,
    health,
    safetyCount,
    problems,
    applyPrices,
    lockItem,
    resetPrices,
    editWithUndo,
    restore,
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
  return api
}

export type LootFilterStore = ReturnType<typeof useLootFilter>
