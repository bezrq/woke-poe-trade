// Calls back with a mechanic id whenever Client.txt shows the player entering
// one of its zones.
import { onUnmounted } from 'vue'
import { Host } from '@/web/background/IPC'
import { parseLogLine } from '../campaign/log-parse'
import { mechanicForZone } from './data'

// League NPCs log their dialogue to Client.txt ("] Einhar, Beastmaster: …"),
// which tells us a mechanic is in the current map even without its own zone.
// Player chat has a channel prefix (#, $, &, %, @) or a different name, and
// these speaker names are exact, so they don't clash with chat in practice.
const NPC_MECHANIC: Record<string, string> = {
  'Einhar, Beastmaster': 'bestiary',
  'Alva Valai': 'incursion',
  'Niko, Master of the Depths': 'delve',
  'Jun Ortoi': 'betrayal',
  'Sister Cassia': 'blight',
  'Oshabi': 'harvest',
  'Strange Voice': 'delirium',
  'The Trialmaster': 'ultimatum',
  'Dannig, Warrior Skald': 'expedition',
  'Tujen, the Haggler': 'expedition',
  'Rog, the Dealer': 'expedition',
  'Gwennen, the Gambler': 'expedition'
}

const SPEAKER_RE = /\] ([^:#$&%@\]][^:\]]*): /

export function mechanicForSpeaker (line: string): string | undefined {
  const m = SPEAKER_RE.exec(line)
  return m ? NPC_MECHANIC[m[1]] : undefined
}

export function useMechanicZone (onMechanic: (id: string) => void): void {
  const listener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
    for (const line of e.lines) {
      const npc = mechanicForSpeaker(line)
      if (npc) { onMechanic(npc); continue }
      const ev = parseLogLine(line)
      if (!ev) continue
      const key = ev.kind === 'area' ? ev.areaId : ev.kind === 'zone' ? ev.name : ''
      const mech = mechanicForZone(key)
      if (mech) onMechanic(mech.id)
    }
  })
  onUnmounted(() => { listener.abort() })
}
