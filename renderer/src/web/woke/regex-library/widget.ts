import type { Widget, Anchor } from '@/web/overlay/widgets'
import { importList, matchesQuery, nextId, str, strList } from '../shared/library'

export { groupByCategory } from '../shared/library'

export const REGEX_LIBRARY_TYPE = 'woke-regex-library'

export { MAX_SEARCH_LENGTH } from '../shared/library'

export interface RegexEntry {
  id: number
  name: string
  text: string
  category: string
  tags: string[]
  notes: string
  hotkey: string | null
  // Search for items WITHOUT this text (wraps it as "!…").
  negate?: boolean
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
  // Strings people actually use: map ones highlight maps you CAN run (the
  // "!" excludes), the rest sort a dump tab. Build longer map strings with
  // the Map regex builder.
  const base = [
    { name: 'No reflect', text: '"!eflec"', category: 'Maps', tags: ['safe'], notes: 'Highlights maps without physical or elemental reflect.' },
    { name: 'No reflect, no regen', text: '"!eflec|t regen"', category: 'Maps', tags: ['safe'], notes: 'Also skips "Players cannot Regenerate…".' },
    { name: 'Quantity 80%+', text: '"tity: \\+([89]\\d|\\d{3})%"', category: 'Maps', tags: ['juice'], notes: 'Item Quantity of 80% or more.' },
    { name: 'Pack size 30%+', text: '"ze: \\+([3-9]\\d|\\d{3})%"', category: 'Maps', tags: ['juice'], notes: 'Monster Pack Size of 30% or more.' },
    { name: 'Chaos recipe (ilvl 60-74)', text: '"m level: (6\\d|7[0-4])"', category: 'Dump sorting', tags: ['vendor'], notes: 'Item level 60 to 74, for the chaos recipe.' },
    { name: 'Unidentified', text: 'unidentified', category: 'Dump sorting', tags: ['vendor'], notes: '' },
    { name: '20% quality', text: '"quality: \\+20%"', category: 'Dump sorting', tags: ['vendor'], notes: 'Gems and flasks for the quality recipe.' }
  ]
  return base.map((e, i) => ({ id: i + 1, hotkey: null, ...e }))
}

// True when the text is one search term (one quoted term, or one word), so
// it can be negated by prefixing "!".
export function canNegate (text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^"[^"]*"$/.test(t)) return true
  return !/[\s"]/.test(t)
}

// What actually goes into the stash search box.
export function effectiveText (entry: { text: string, negate?: boolean }): string {
  const t = entry.text.trim()
  if (!entry.negate || !canNegate(t)) return entry.text
  const inner = t.startsWith('"') ? t.slice(1, -1) : t
  return inner.startsWith('!') ? `"${inner}"` : `"!${inner}"`
}

export function matchesFilter (entry: RegexEntry, filter: string): boolean {
  return matchesQuery([entry.name, entry.text, entry.category, entry.notes, ...entry.tags], filter)
}

// Accepts our JSON export, or plain text: one string per line, optionally
// "name = string" (or name<TAB>string). Lines starting with # are skipped.
export function parseImport (input: string, existing: RegexEntry[]): RegexEntry[] {
  const trimmed = input.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return parseJsonImport(trimmed, existing)
  let id = nextId(existing)
  const out: RegexEntry[] = []
  for (const raw of trimmed.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) continue
    const m = /^(.+?)(?:\t+| = )(.+)$/.exec(line)
    const name = m ? m[1].trim() : ''
    const text = m ? m[2].trim() : line
    if (!text) continue
    out.push({ id: id++, name, text, category: 'Imported', tags: [], notes: '', hotkey: null })
  }
  if (!out.length) throw new Error('Nothing to import: paste one search string per line')
  return out
}

function parseJsonImport (json: string, existing: RegexEntry[]): RegexEntry[] {
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
      hotkey: null,
      negate: r.negate === true
    }))
}

export function exportEntries (entries: RegexEntry[]): string {
  return JSON.stringify(
    entries.map(({ name, text, category, tags, notes, negate }) => ({ name, text, category, tags, notes, ...(negate ? { negate } : {}) })),
    null, 2)
}
