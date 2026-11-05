// Every change to your filter settings as a list you can step back and forward
// through. It watches the settings instead of each button, so nothing that
// changes them can be missed, and a step keeps only the parts that changed: 200
// price moves aren't saved again with every font size.
import type { FilterEdit, StylePatch } from './edits'
import { describeEdit } from './edits'
import { ruleLabel } from './parse'
import type { OwnRule } from './rules'
import type { Presets } from './presets'
import type { PriceMove } from './economy'

export interface Settings {
  edits: FilterEdit[]
  rules: OwnRule[]
  presets: Presets
  moves: PriceMove[]
  locks: string[]
}

export type SettingsPart = Partial<Settings>

export interface TimelineStep {
  ts: number
  label: string
  before: SettingsPart
  after: SettingsPart
}

export interface Timeline {
  steps: TimelineStep[]
  // How many steps are in effect; the rest can be redone.
  at: number
}

export const TIMELINE_SIZE = 50

const KEYS: Array<keyof Settings> = ['edits', 'rules', 'presets', 'moves', 'locks']

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function changedParts (before: Settings, after: Settings): Array<keyof Settings> {
  return KEYS.filter(k => !same(before[k], after[k]))
}

function pick (s: Settings, keys: Array<keyof Settings>): SettingsPart {
  const out: Record<string, unknown> = {}
  for (const k of keys) out[k] = JSON.parse(JSON.stringify(s[k]))
  return out as SettingsPart
}

export function emptyTimeline (): Timeline {
  return { steps: [], at: 0 }
}

// A saved timeline, or a new one if it's damaged.
export function normalizeTimeline (t: unknown): Timeline {
  const x = t as Partial<Timeline> | null | undefined
  if (!x || !Array.isArray(x.steps)) return emptyTimeline()
  const steps = x.steps.filter(s => s && typeof s.ts === 'number' && typeof s.label === 'string' && s.before && s.after && typeof s.before === 'object' && typeof s.after === 'object')
  const at = typeof x.at === 'number' ? Math.max(0, Math.min(steps.length, Math.round(x.at))) : steps.length
  return { steps, at }
}

function same3 (s: Settings, part: SettingsPart): boolean {
  return (Object.keys(part) as Array<keyof Settings>).every(k => same(s[k], part[k]))
}

// Settings moved from `before` to `after`. Going back to what the last step
// came from is an undo (an Undo note did it), and to what the next step leads to
// is a redo; anything else is a new step, and steps you'd undone are dropped.
export function observe (t: Timeline, before: Settings, after: Settings, label: string, now = Date.now()): Timeline {
  const parts = changedParts(before, after)
  if (!parts.length) return t
  const last = t.steps[t.at - 1]
  if (last && same3(after, last.before) && same3(before, last.after)) return { ...t, at: t.at - 1 }
  const next = t.steps[t.at]
  if (next && same3(after, next.after) && same3(before, next.before)) return { ...t, at: t.at + 1 }
  const step: TimelineStep = { ts: now, label, before: pick(before, parts), after: pick(after, parts) }
  const steps = [...t.steps.slice(0, t.at), step].slice(-TIMELINE_SIZE)
  return { steps, at: steps.length }
}

export function canUndo (t: Timeline): boolean {
  return t.at > 0
}

export function canRedo (t: Timeline): boolean {
  return t.at < t.steps.length
}

// The settings to apply to go to `at` steps in, from where the timeline is now.
export function settingsAt (t: Timeline, at: number): SettingsPart {
  const out: SettingsPart = {}
  const put = (p: SettingsPart) => Object.assign(out, JSON.parse(JSON.stringify(p)))
  for (let i = t.at - 1; i >= at; i--) put(t.steps[i].before)
  for (let i = t.at; i < at; i++) put(t.steps[i].after)
  return out
}

// ---- in words ----

const COLOUR_NAME: Record<string, string> = { text: 'text colour', border: 'border', background: 'background' }

function lookValue (key: keyof StylePatch, v: unknown): string {
  if (v == null) return 'none'
  if (key === 'fontSize') return String(v)
  if (key === 'sound') return `sound ${(v as { id: string }).id}`
  if (key === 'effect') return String((v as { color: string }).color)
  if (key === 'icon') return `${(v as { color: string }).color} ${(v as { shape: string }).shape}`
  return (v as number[]).slice(0, 3).join(' ')
}

// "font size 40 → 45", from the look it had before.
export function describePatch (patch: StylePatch, was: StylePatch): string {
  const names: Record<string, string> = { fontSize: 'font size', sound: 'sound', effect: 'beam', icon: 'map icon', ...COLOUR_NAME }
  return (Object.keys(patch) as Array<keyof StylePatch>)
    .filter(k => !same(patch[k], was[k]))
    .map(k => `${names[k]} ${lookValue(k, was[k])} → ${lookValue(k, patch[k])}`)
    .join(', ')
}

function describeEditStep (prev: FilterEdit | undefined, next: FilterEdit, lookOf: (type: string, tier: string) => StylePatch): string {
  if (next.kind === 'style') {
    const was = { ...lookOf(next.type, next.tier), ...(prev?.kind === 'style' ? prev.patch : {}) }
    const what = describePatch(next.patch, was)
    if (what) return `${ruleLabel(next.type, next.tier)}: ${what}`
  }
  return describeEdit(next)
}

// A step in a line, for the Changes tab.
export function describeStep (before: Settings, after: Settings, lookOf: (type: string, tier: string) => StylePatch = () => ({})): string {
  const parts: string[] = []
  if (!same(before.edits, after.edits)) {
    const prev = new Map(before.edits.map(e => [e.id, e]))
    const ids = new Set(after.edits.map(e => e.id))
    const changed = after.edits.filter(e => !same(prev.get(e.id), e))
    const dropped = before.edits.filter(e => !ids.has(e.id))
    if (changed.length === 1 && !dropped.length) parts.push(describeEditStep(prev.get(changed[0].id), changed[0], lookOf))
    else if (!changed.length && dropped.length === 1) parts.push(`Took back: ${describeEdit(dropped[0])}`)
    else if (!changed.length) parts.push(`Took back ${dropped.length} changes`)
    else if (!dropped.length) parts.push(`${changed.length} changes`)
    else parts.push(`${changed.length + dropped.length} changes`)
  }
  if (!same(before.moves, after.moves)) {
    const n = after.moves.length - before.moves.length
    parts.push(n > 0 ? `Price moves: ${n} more` : (after.moves.length ? `Price moves: ${-n || 'some'} changed` : 'Back to NeverSink\'s tiers'))
  }
  if (!same(before.rules, after.rules)) {
    const names = new Map(before.rules.map(r => [r.id, r]))
    const added = after.rules.filter(r => !names.has(r.id))
    const gone = before.rules.filter(r => !after.rules.some(x => x.id === r.id))
    if (added.length === 1 && !gone.length) parts.push(`New rule: ${added[0].name}`)
    else if (gone.length === 1 && !added.length) parts.push(`Deleted rule: ${gone[0].name}`)
    else {
      const edited = after.rules.find(r => names.has(r.id) && !same(names.get(r.id), r))
      parts.push(edited ? `Changed rule: ${edited.name}` : 'Changed your rules')
    }
  }
  if (!same(before.presets, after.presets)) {
    const key = (Object.keys(after.presets) as Array<keyof Presets>).find(k => !same(before.presets[k], after.presets[k]))
    parts.push(key ? `Preset: ${PRESET_NAMES[key]} ${after.presets[key].on ? (before.presets[key].on ? 'changed' : 'on') : 'off'}` : 'Changed presets')
  }
  if (!same(before.locks, after.locks) && !parts.length) {
    parts.push(after.locks.length > before.locks.length ? 'Kept an item where it is' : 'Let prices move an item again')
  }
  return parts.join('; ') || 'Changed settings'
}

const PRESET_NAMES: Record<keyof Presets, string> = {
  cheapCurrency: 'hide cheap currency',
  chaosRecipe: 'chaos recipe',
  quiet: 'quiet mode',
  bigger: 'bigger labels',
  colourBlind: 'colour-blind colours',
  sixSockets: '6-socket items'
}
