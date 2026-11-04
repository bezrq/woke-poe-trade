// Main-process side of woke modules: one request/response channel,
// with handlers registered by op name.
import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import type { GameWindow } from '../windowing/GameWindow'
import { listBuilds, openBuild, readBuild, showBuild } from './pob-builds'
import { MapScanner } from './map-scan'
import { WokeHoverTracker } from './hover'
import type { OverlayWindow } from '../windowing/OverlayWindow'
import { perfSnapshot, startProcessSampler } from './perf'

type Handler = (args: any) => Promise<unknown> // eslint-disable-line @typescript-eslint/no-explicit-any

const handlers: Record<string, Handler> = {
  'pob-list': listBuilds,
  'pob-read': readBuild,
  'pob-open': openBuild,
  'pob-show': showBuild,
  'perf-stats': async () => perfSnapshot()
}

export function initWoke (server: ServerEvents, logger: Logger, poeWindow: GameWindow): void {
  const mapScanner = new MapScanner(server, logger, poeWindow)
  handlers['map-scan-start'] = async () => await mapScanner.start()
  handlers['map-scan-stop'] = async () => mapScanner.stop()
  handlers['map-scan-reread'] = async () => mapScanner.reread()
  handlers['map-scan-status'] = async () => ({ running: mapScanner.isRunning })

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

  startProcessSampler(() => poeWindow.isActive)
}

// Needs the overlay window, which main.ts creates later than initWoke runs.
export function initWokeOverlay (server: ServerEvents, overlay: OverlayWindow): void {
  new WokeHoverTracker(server, overlay) // eslint-disable-line no-new
}
