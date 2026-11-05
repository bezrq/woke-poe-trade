// Before the app quits (Settings, the tray, restart to update): the page saves
// what it hasn't yet, and main waits for the write to finish. Quitting never
// hangs on this: a page that's gone just doesn't answer. Electron skips this on
// a Windows shutdown; Settings changes are already on disk by then.
import { app } from 'electron'
import type { ServerEvents } from '../server'

const PAGE_WAIT_MS = 500
const WRITE_WAIT_MS = 2000

export function saveBeforeQuit (server: ServerEvents, flushed: () => Promise<void>) {
  let ready = false
  let started = false
  let onAnswer: (() => void) | undefined

  server.onEventAnyClient('CLIENT->MAIN::config-flushed', () => { onAnswer?.() })

  app.on('before-quit', (e) => {
    if (ready) return
    e.preventDefault()
    if (started) return
    started = true
    const answered = new Promise<void>((resolve) => {
      onAnswer = resolve
      setTimeout(resolve, PAGE_WAIT_MS)
    })
    server.sendEventTo('broadcast', { name: 'MAIN->CLIENT::config-flush', payload: undefined })
    answered
      .then(async () => await Promise.race([
        flushed(),
        new Promise<void>((resolve) => { setTimeout(resolve, WRITE_WAIT_MS) })
      ]))
      .catch(() => {})
      .finally(() => {
        ready = true
        app.quit()
      })
  })
}
