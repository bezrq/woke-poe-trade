// One list of every hotkey (APT's and the toolkit's), with clashes flagged
// and the keys of switched-off modules shown as free. No Vue imports.
import type { ShortcutAction } from '@ipc/types'
import type { Widget } from '@/web/overlay/widgets'
import { MODULES } from '../modules'
import { wokeGlobalShortcuts, wokeShortcutsFor } from '../shortcuts'

export interface HotkeyRow {
  key: string
  // Normalised key, for spotting clashes ("Alt + E" == "alt+e").
  norm: string
  label: string
  module: string
  off: boolean
  conflicts: string[]
}

export function normalizeKey (key: string): string {
  const parts = key.split('+').map(p => p.trim().toLowerCase()).filter(Boolean)
  const mods = ['ctrl', 'shift', 'alt'].filter(m => parts.includes(m))
  const rest = parts.filter(p => !mods.includes(p))
  return [...mods, ...rest].join(' + ')
}

const APT_COPY_LABELS: Record<string, string> = {
  'price-check': 'Price check',
  'item-check': 'Item info',
  'open-wiki': 'Open item on the wiki',
  'open-craft-of-exile': 'Open item on Craft of Exile',
  'open-poedb': 'Open item on poedb',
  'search-similar': 'Search similar items in stash'
}

function aptLabel (a: ShortcutAction): string {
  const act = a.action
  switch (act.type) {
    case 'copy-item': return (APT_COPY_LABELS[act.target] ?? act.target) + (act.target === 'price-check' && act.focusOverlay ? ' (locked)' : '')
    case 'toggle-overlay': return 'Show / hide overlay'
    case 'stash-search': return `Stash search: ${act.text}`
    case 'paste-in-chat': return `Chat: ${act.text}`
    case 'ocr-text': return 'Read heist gems'
    case 'trigger-event': return act.target === 'delve-grid' ? 'Delve grid' : act.target
    default: return 'Other'
  }
}

function actionLabel (a: ShortcutAction, widget: Widget): string {
  const act = a.action
  const title = widget.wmTitle || widget.wmType
  switch (act.type) {
    case 'paste-in-chat': return `${title}: chat ${act.text}`
    case 'stash-search': return `${title}: paste ${act.text.length > 30 ? act.text.slice(0, 30) + '…' : act.text}`
    case 'copy-item': return `${title}: read hovered item`
    case 'trigger-event': {
      const kind = /:(overlay|external)$/.exec(act.target)?.[1]
      if (/once/.test(act.target)) return `${title}: read whole screen`
      return kind ? `${title}: open (${kind === 'overlay' ? 'overlay browser' : 'your browser'})` : `${title}: open / toggle`
    }
    default: return title
  }
}

function moduleName (wmType: string): string {
  return MODULES.find(m => m.widgetTypes.includes(wmType))?.name ?? 'Toolkit'
}

const sig = (a: ShortcutAction) => `${normalizeKey(a.shortcut)}|${JSON.stringify(a.action)}`

interface ConfigLike {
  woke?: { setupDone: boolean, off: string[], hideAllHotkey?: string | null }
  widgets: Widget[]
}

// `host`: the shortcuts the app registers now (APT's and the toolkit's).
export function buildHotkeyList (config: ConfigLike, host: ShortcutAction[]): HotkeyRow[] {
  const rows: HotkeyRow[] = []
  const woke = new Set<string>()
  const allOn = { ...config, woke: { setupDone: true, off: [] as string[], hideAllHotkey: config.woke?.hideAllHotkey } }

  for (const widget of config.widgets) {
    const active = wokeShortcutsFor(widget, config)
    const all = active.length ? active : wokeShortcutsFor(widget, allOn)
    const off = !active.length && all.length > 0
    for (const a of all) {
      woke.add(sig(a))
      rows.push({ key: a.shortcut, norm: normalizeKey(a.shortcut), label: actionLabel(a, widget), module: moduleName(widget.wmType), off, conflicts: [] })
    }
  }
  for (const a of wokeGlobalShortcuts(config)) {
    woke.add(sig(a))
    const isMapCheck = a.action.type === 'copy-item'
    rows.push({
      key: a.shortcut,
      norm: normalizeKey(a.shortcut),
      label: isMapCheck ? 'Map check (default profile)' : 'Hide all toolkit panels',
      module: isMapCheck ? moduleName('woke-map-mods') : 'Toolkit',
      off: false,
      conflicts: []
    })
  }
  for (const a of host) {
    if (woke.has(sig(a))) continue
    rows.push({ key: a.shortcut, norm: normalizeKey(a.shortcut), label: aptLabel(a), module: 'APT', off: false, conflicts: [] })
  }

  const byKey = new Map<string, HotkeyRow[]>()
  for (const r of rows) {
    if (r.off) continue
    const list = byKey.get(r.norm) ?? []
    list.push(r)
    byKey.set(r.norm, list)
  }
  for (const list of byKey.values()) {
    if (list.length < 2) continue
    for (const r of list) r.conflicts = list.filter(o => o !== r).map(o => o.label)
  }
  // A switched-off module's key that something else now uses: it would
  // clash when the module is turned back on.
  for (const r of rows) {
    if (r.off) r.conflicts = (byKey.get(r.norm) ?? []).map(o => o.label)
  }
  const live = (r: HotkeyRow) => (r.off ? 0 : r.conflicts.length)
  return rows.sort((a, b) => live(b) - live(a) || Number(a.off) - Number(b.off) || a.module.localeCompare(b.module) || a.label.localeCompare(b.label))
}
