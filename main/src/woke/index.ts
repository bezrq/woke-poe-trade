// Main-process side of woke modules: one request/response channel,
// with handlers registered by op name.
import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import type { GameWindow } from '../windowing/GameWindow'
import { importBuild, listBuilds, openBuild, readBuild, showBuild } from './pob-builds'
import { listFilters, readFilter, writeFilter, showFilterFolder } from './loot-filter'
import { ScreenScanner, MAP_SCAN, ESSENCE_SCAN, checkOcr, readAllEssenceLabels } from './map-scan'
import { WokeHoverTracker } from './hover'
import type { OverlayWindow } from '../windowing/OverlayWindow'
import { perfSnapshot, startProcessSampler } from './perf'

type Handler = (args: any) => Promise<unknown> // eslint-disable-line @typescript-eslint/no-explicit-any

const handlers: Record<string, Handler> = {
  'pob-list': listBuilds,
  'pob-read': readBuild,
  'pob-open': openBuild,
  'pob-show': showBuild,
  'pob-import': importBuild,
  'filter-list': listFilters,
  'filter-read': readFilter,
  'filter-write': writeFilter,
  'filter-folder': showFilterFolder,
  'perf-stats': async () => perfSnapshot(),
  'ocr-check': async () => checkOcr()
}

export function initWoke (server: ServerEvents, logger: Logger, poeWindow: GameWindow): void {
  for (const kind of [MAP_SCAN, ESSENCE_SCAN]) {
    const scanner = new ScreenScanner(server, logger, poeWindow, kind)
    handlers[`${kind.topic}-start`] = async () => await scanner.start()
    handlers[`${kind.topic}-stop`] = async () => scanner.stop()
    handlers[`${kind.topic}-reread`] = async () => scanner.reread()
    handlers[`${kind.topic}-status`] = async () => ({ running: scanner.isRunning })
  }
  handlers['essence-scan-once'] = async () => await readAllEssenceLabels(poeWindow)

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
