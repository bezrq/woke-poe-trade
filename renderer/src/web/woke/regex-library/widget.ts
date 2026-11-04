import type { Widget, Anchor } from '@/web/overlay/widgets'
import { importList, matchesQuery, nextId, str, strList } from '../shared/library'

export { groupByCategory } from '../shared/library'

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

export function emptyEntry (entries: RegexEntry[]): RegexEntry {
  return {
    id: nextId(entries),
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
  return matchesQuery([entry.name, entry.text, entry.category, entry.notes, ...entry.tags], filter)
}

// Unknown fields are dropped; ids are assigned after the existing ones.
export function parseImport (json: string, existing: RegexEntry[]): RegexEntry[] {
  let id = nextId(existing)
  return importList(json)
    .filter(r => typeof r.text === 'string' && r.text)
    .map(r => ({
      id: id++,
      name: str(r.name),
      text: str(r.text),
      category: str(r.category),
      tags: strList(r.tags),
      notes: str(r.notes),
      hotkey: null
    }))
}

export function exportEntries (entries: RegexEntry[]): string {
  return JSON.stringify(
    entries.map(({ name, text, category, tags, notes }) => ({ name, text, category, tags, notes })),
    null, 2)
}
