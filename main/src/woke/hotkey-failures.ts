// Hotkeys that failed to register because another program holds them
// (APT's Shortcuts reports them here). The toolkit flags them next to its
// own clash check, since a failed key otherwise just does nothing.
import type { ServerEvents } from '../server'

let failed: string[] = []

export function noteHotkeyFailures (server: ServerEvents, keys: string[]) {
  const same = keys.length === failed.length && keys.every((k, i) => k === failed[i])
  failed = keys
  if (same) return
  server.sendEventTo('broadcast', {
    name: 'MAIN->CLIENT::woke-event',
    payload: { topic: 'hotkeys', data: { failed } }
  })
}

export function hotkeyFailures (): { failed: string[] } {
  return { failed }
}
