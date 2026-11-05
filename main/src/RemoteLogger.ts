import type { ServerEvents } from './server'

// woke: logs last as long as the app does, so they can't grow for ever.
const MAX_HISTORY = 256 * 1024

export class Logger {
  history = ''

  constructor (
    private server: ServerEvents
  ) {}

  write (message: string) {
    message = `[${new Date().toLocaleTimeString()}] ${message}\n`
    this.history += message
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(this.history.indexOf('\n', this.history.length - MAX_HISTORY / 2) + 1)
    }
    this.server.sendEventTo('broadcast', {
      name: 'MAIN->CLIENT::log-entry',
      payload: { message }
    })
  }
}
