// Tracks which league mechanic is in the current zone, from Client.txt.
import { onGameLog } from '../shared/game-log'
import { mechanicForZone } from './data'

// League NPCs log their dialogue to Client.txt ("] Einhar, Beastmaster: …"),
// which tells us a mechanic is in the current map even without its own zone.
// Player chat has a channel prefix (#, $, &, %, @) or a different name, and
// these speaker names are exact, so they don't clash with chat in practice.
// Names are as the game logs them, title included ("Alva, Master Explorer").
const NPC_MECHANIC: Record<string, string> = {
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

const SPEAKER_RE = /\] ([^:#$&%@\]][^:\]]*): /

export function mechanicForSpeaker (line: string): string | undefined {
  const m = SPEAKER_RE.exec(line)
  return m ? NPC_MECHANIC[m[1]] : undefined
}

// Calls back with the mechanic of the zone you're in, or null on entering a
// zone that has none (town, hideout, a plain map), so the icon can hide.
export function useMechanicZone (onMechanic: (id: string | null) => void): void {
  onGameLog((lines) => {
    for (const { line, ev } of lines) {
      const npc = mechanicForSpeaker(line)
      if (npc) { onMechanic(npc); continue }
      if (ev?.kind === 'area') {
        // A new instance: forget the last zone's mechanic unless this one has its own.
        onMechanic(mechanicForZone(ev.areaId)?.id ?? null)
      } else if (ev?.kind === 'zone') {
        const mech = mechanicForZone(ev.name)
        if (mech) onMechanic(mech.id)
      }
    }
  })
}
