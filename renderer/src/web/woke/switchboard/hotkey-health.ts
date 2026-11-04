// Hotkey problems for the warning in the tab bar and the hotkey list:
// two actions on one key, and keys another program holds (reported by main
// when it registers them).
import { computed, shallowRef } from 'vue'
import { AppConfig, getConfigForHost } from '@/web/Config'
import { MainProcess } from '@/web/background/IPC'
import { hostRequest } from '../shared/host'
import { buildHotkeyList, normalizeKey } from './hotkey-list'

const failed = shallowRef<string[]>([])
let listening = false

function listen () {
  if (listening) return
  listening = true
  MainProcess.onEvent('MAIN->CLIENT::woke-event', ({ topic, data }) => {
    if (topic === 'hotkeys') failed.value = (data as { failed: string[] }).failed
  })
  hostRequest<{ failed: string[] }>('hotkey-failures', null)
    .then(r => { failed.value = r.failed })
    .catch(() => {})
}

export function useHotkeyHealth () {
  listen()
  const rows = computed(() => buildHotkeyList(AppConfig(), getConfigForHost().shortcuts))
  const clashKeys = computed(() => [...new Set(rows.value.filter(r => !r.off && r.conflicts.length).map(r => r.key))])
  const failedNorm = computed(() => new Set(failed.value.map(normalizeKey)))
  const problems = computed(() => clashKeys.value.length + failed.value.length)
  const summary = computed(() => {
    const parts: string[] = []
    if (clashKeys.value.length) parts.push(`Same key on two actions: ${clashKeys.value.join(', ')}`)
    if (failed.value.length) parts.push(`Held by another program: ${failed.value.join(', ')}`)
    return parts.join('. ')
  })
  return { rows, failed, failedNorm, problems, summary }
}
