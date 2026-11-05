// Tracks which league mechanic is in the current zone, from Client.txt.
import { onGameLog } from '../shared/game-log'
import type { LogEvent } from '../campaign/log-parse'
import { mechanicForZone } from './data'

// League NPCs log their dialogue to Client.txt ("] Einhar, Beastmaster: …"),
// which tells us a mechanic is in the current map even without its own zone.
// Player chat has a channel prefix (#, $, &, %, @) or a different name, and
// these speaker names are exact, so they don't clash with chat in practice.
// Names are as the game logs them, title included ("Alva, Master Explorer").
export const NPC_MECHANIC: Record<string, string> = {
  'Einhar, Beastmaster': 'bestiary',
  'Alva, Master Explorer': 'incursion',
  'Niko, Master of the Depths': 'delve',
  'Jun, Veiled Master': 'betrayal',
  'Sister Cassia': 'blight',
  'Oshabi': 'harvest',
  'Strange Voice': 'delirium',
  'The Trialmaster': 'ultimatum',
  'Dannig, Warrior Skald': 'expedition',
  'Tujen, the Haggler': 'expedition',
  // Rog is logged as just "Rog", greeting or not.
  'Rog': 'expedition',
  'Gwennen, the Gambler': 'expedition'
}

// The Expedition vendor a log speaker stands for.
const SPEAKER_VENDOR: Record<string, string> = {
  'Dannig, Warrior Skald': 'Dannig',
  'Tujen, the Haggler': 'Tujen',
  'Rog': 'Rog',
  'Gwennen, the Gambler': 'Gwennen'
}

const SPEAKER_RE = /\] ([^:#$&%@\]][^:\]]*): /

export function mechanicForSpeaker (line: string): string | undefined {
  const m = SPEAKER_RE.exec(line)
  return m ? NPC_MECHANIC[m[1]] : undefined
}

export function expeditionVendorForSpeaker (line: string): string | undefined {
  const m = SPEAKER_RE.exec(line)
  return m ? SPEAKER_VENDOR[m[1]] : undefined
}

interface InstanceNpcs { mechanic?: string, vendor?: string }

// Seed 1 is what towns and hideouts log, so it doesn't name one instance.
const SHARED_SEED = '1'
const REMEMBERED_INSTANCES = 16

// Turns log lines into the two callbacks below. NPCs only speak once, so what
// they showed is kept per instance for coming back through a portal.
export function zoneTracker (onMechanic: (id: string | null) => void, onVendor: (vendor: string | null) => void) {
  const instances = new Map<string, InstanceNpcs>()
  let here: InstanceNpcs | null = null

  return (line: string, ev: LogEvent | null) => {
    const vendor = expeditionVendorForSpeaker(line)
    if (vendor) {
      onVendor(vendor)
      if (here) here.vendor = vendor
    }
    const npc = mechanicForSpeaker(line)
    if (npc) {
      onMechanic(npc)
      if (here) here.mechanic = npc
      return
    }
    if (ev?.kind === 'area') {
      here = null
      if (ev.seed && ev.seed !== SHARED_SEED) {
        const key = `${ev.areaId}:${ev.seed}`
        here = instances.get(key) ?? {}
        instances.delete(key)
        instances.set(key, here)
        if (instances.size > REMEMBERED_INSTANCES) instances.delete(instances.keys().next().value!)
      }
      // A new instance: forget the last zone's mechanic unless this one has its own.
      onVendor(here?.vendor ?? null)
      onMechanic(mechanicForZone(ev.areaId)?.id ?? here?.mechanic ?? null)
    } else if (ev?.kind === 'zone') {
      const mech = mechanicForZone(ev.name)
      if (mech) onMechanic(mech.id)
    }
  }
}

// Calls back with the mechanic of the zone you're in, or null on entering a
// zone that has none (town, hideout, a plain map), so the icon can hide.
// onVendor: the Expedition vendor who last spoke in this instance, or null.
export function useMechanicZone (onMechanic: (id: string | null) => void, onVendor: (vendor: string | null) => void = () => {}): void {
  const feed = zoneTracker(onMechanic, onVendor)
  onGameLog((lines) => {
    for (const { line, ev } of lines) feed(line, ev)
  })
}
