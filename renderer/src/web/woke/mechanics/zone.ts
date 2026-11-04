// Calls back with a mechanic id whenever Client.txt shows the player entering
// one of its zones.
import { onUnmounted } from 'vue'
import { Host } from '@/web/background/IPC'
import { parseLogLine } from '../campaign/log-parse'
import { mechanicForZone } from './data'

export function useMechanicZone (onMechanic: (id: string) => void): void {
  const listener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
    for (const line of e.lines) {
      const ev = parseLogLine(line)
      if (!ev) continue
      const key = ev.kind === 'area' ? ev.areaId : ev.kind === 'zone' ? ev.name : ''
      const mech = mechanicForZone(key)
      if (mech) onMechanic(mech.id)
    }
  })
  onUnmounted(() => { listener.abort() })
}
