// Main-process side of woke modules: one request/response channel,
// with handlers registered by op name.
import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import { listBuilds, openBuild, readBuild, showBuild } from './pob-builds'

type Handler = (args: any) => Promise<unknown> // eslint-disable-line @typescript-eslint/no-explicit-any

const handlers: Record<string, Handler> = {
  'pob-list': listBuilds,
  'pob-read': readBuild,
  'pob-open': openBuild,
  'pob-show': showBuild
}

export function initWoke (server: ServerEvents, logger: Logger): void {
  server.onEventAnyClient('CLIENT->MAIN::woke-request', ({ id, op, args }) => {
    const handler = handlers[op]
    const reply = (payload: { ok: boolean, data?: unknown, error?: string }) => {
      server.sendEventTo('broadcast', { name: 'MAIN->CLIENT::woke-response', payload: { id, ...payload } })
    }
    if (!handler) {
      reply({ ok: false, error: `Unknown op: ${op}` })
      return
    }
    handler(args)
      .then(data => reply({ ok: true, data }))
      .catch((err: unknown) => {
        logger.write(`error [woke] ${op}: ${String(err)}`)
        reply({ ok: false, error: err instanceof Error ? err.message : String(err) })
      })
  })
}
