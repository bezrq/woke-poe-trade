// Where you are right now, from Client.txt: one shared reading for every
// module, so dock icons can show only where they're useful.
import { shallowReactive } from 'vue'
import { Host } from '@/web/background/IPC'
import { actFromAreaId, isTown, parseLogLine } from '../campaign/log-parse'
import { lineTime, logTail } from '../campaign/log-tail'

export type ZoneKind = 'campaign' | 'town' | 'hideout' | 'map' | 'lab' | 'boss' | 'other'

export interface ZoneState {
  areaId: string
  areaLevel: number | null
  // Display name from "You have entered …".
  name: string
  kind: ZoneKind | null
  // When the current instance was generated (ms), 0 if unknown.
  enteredAt: number
}

// Pinnacle boss arenas by their "You have entered" name. Map ids for these
// fights aren't consistent, so names are the dependable signal. Add names
// here when a fight isn't recognised.
export const BOSS_ARENAS: Record<string, string[]> = {
  "The Shaper's Realm": ['shaper', 'uber-shaper'],
  'Absence of Value and Meaning': ['uber-elder', 'uber-uber-elder'],
  'Eye of the Storm': ['uber-sirus'],
  'Absence of Mercy and Empathy': ['maven', 'uber-maven'],
  "The Maven's Crucible": ['maven', 'uber-maven'],
  'Absence of Patience and Wisdom': ['exarch', 'uber-exarch', 'eater', 'uber-eater'],
  'Absence of Symmetry and Harmony': ['exarch', 'uber-exarch', 'eater', 'uber-eater'],
  'Seething Chyme': ['eater', 'uber-eater'],
  'Polaric Void': ['exarch', 'uber-exarch'],
  'Cortex': ['uber-cortex'],
  'The Feared': ['feared']
}

const LAB_ZONES = new Set(["Aspirants' Plaza", "Aspirant's Trial"])

export function zoneKind (areaId: string, name: string): ZoneKind {
  if (name && BOSS_ARENAS[name]) return 'boss'
  if (/hideout/i.test(areaId) || /hideout/i.test(name)) return 'hideout'
  if (/labyrinth/i.test(areaId) || LAB_ZONES.has(name)) return 'lab'
  if (areaId && isTown(areaId)) return 'town'
  if (/^Map/i.test(areaId)) return 'map'
  if (areaId && actFromAreaId(areaId) != null) return 'campaign'
  return 'other'
}

export const zone = shallowReactive<ZoneState>({ areaId: '', areaLevel: null, name: '', kind: null, enteredAt: 0 })

// Returns whether the line said where you are.
function apply (line: string, at: number): boolean {
  const ev = parseLogLine(line)
  if (!ev) return false
  if (ev.kind === 'area') {
    zone.areaId = ev.areaId
    zone.areaLevel = ev.areaLevel
    zone.name = ''
    zone.enteredAt = at
    zone.kind = zoneKind(ev.areaId, '')
  } else if (ev.kind === 'zone') {
    zone.name = ev.name
    zone.kind = zoneKind(zone.areaId, ev.name)
  } else {
    return false
  }
  return true
}

let started = false
let live = false

// Starts listening (once) and returns the shared state.
export function useZone (): ZoneState {
  if (started) return zone
  started = true
  Host.onEvent('MAIN->CLIENT::game-log', (e) => {
    // Only a zone change makes the startup tail out of date; chat and
    // other lines arrive all the time.
    for (const line of e.lines) if (apply(line, Date.now())) live = true
  })
  // Where you were when the app started, unless a zone change came first.
  logTail().then(tail => {
    if (live) return
    for (const line of tail.lines) apply(line, lineTime(line) ?? 0)
  }).catch(() => {})
  return zone
}

export function inZone (...kinds: ZoneKind[]): boolean {
  return zone.kind != null && kinds.includes(zone.kind)
}
