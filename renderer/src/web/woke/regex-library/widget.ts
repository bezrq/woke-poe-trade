import type { Widget, Anchor } from '@/web/overlay/widgets'

export const REGEX_LIBRARY_TYPE = 'woke-regex-library'

// PoE's in-game search box accepts at most 250 characters.
export const MAX_SEARCH_LENGTH = 250

export interface RegexEntry {
  id: number
  name: string
  text: string
  category: string
  tags: string[]
  notes: string
  hotkey: string | null
}

export interface RegexLibraryWidget extends Widget {
  anchor: Anchor
  enableHotkeys: boolean
  entries: RegexEntry[]
}

export function nextEntryId (entries: RegexEntry[]): number {
  return Math.max(0, ...entries.map(e => e.id)) + 1
}

export function emptyEntry (entries: RegexEntry[]): RegexEntry {
  return {
    id: nextEntryId(entries),
    name: '',
    text: '',
    category: '',
    tags: [],
    notes: '',
    hotkey: null
  }
}

export function starterEntries (): RegexEntry[] {
  // Examples taken from APT's built-in stash search presets.
  const base = [
    { name: 'Pack size +3', text: '"Pack Size: +3"', category: 'Maps', tags: ['juice'] },
    { name: 'Reflect', text: 'Reflect', category: 'Maps', tags: ['danger'] },
    { name: 'No leech', text: '"Cannot Leech"', category: 'Maps', tags: ['danger'] },
    { name: 'Currency', text: 'Currency', category: 'Dump sorting', tags: [] },
    { name: 'Div cards', text: '"Divination Card"', category: 'Dump sorting', tags: [] },
    { name: 'Maps', text: '"Map Tier"', category: 'Dump sorting', tags: [] }
  ]
  return base.map((e, i) => ({ id: i + 1, notes: '', hotkey: null, ...e }))
}

export function matchesFilter (entry: RegexEntry, filter: string): boolean {
  const q = filter.trim().toLowerCase()
  if (!q) return true
  return [entry.name, entry.text, entry.category, entry.notes, ...entry.tags]
    .some(field => field.toLowerCase().includes(q))
}

export function groupByCategory (entries: RegexEntry[]): Array<{ category: string, entries: RegexEntry[] }> {
  const groups = new Map<string, RegexEntry[]>()
  for (const entry of entries) {
    const key = entry.category.trim() || 'Uncategorized'
    const list = groups.get(key)
    if (list) list.push(entry)
    else groups.set(key, [entry])
  }
  return Array.from(groups, ([category, entries]) => ({ category, entries }))
}

// Import accepts either an array of entries or `{ entries: [...] }`.
// Unknown fields are dropped; ids are reassigned after the existing ones.
export function parseImport (json: string, existing: RegexEntry[]): RegexEntry[] {
  const data: unknown = JSON.parse(json)
  const list = Array.isArray(data)
    ? data
    : (data && typeof data === 'object' && Array.isArray((data as { entries?: unknown }).entries))
        ? (data as { entries: unknown[] }).entries
        : null
  if (!list) throw new Error('Expected a JSON array of entries')

  let id = nextEntryId(existing)
  const out: RegexEntry[] = []
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    if (typeof r.text !== 'string' || !r.text) continue
    out.push({
      id: id++,
      name: typeof r.name === 'string' ? r.name : '',
      text: r.text,
      category: typeof r.category === 'string' ? r.category : '',
      tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : [],
      notes: typeof r.notes === 'string' ? r.notes : '',
      hotkey: null
    })
  }
  return out
}

export function exportEntries (entries: RegexEntry[]): string {
  return JSON.stringify(
    entries.map(({ name, text, category, tags, notes }) => ({ name, text, category, tags, notes })),
    null, 2)
}
