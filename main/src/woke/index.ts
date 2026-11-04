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
import type { GameLogWatcher } from '../host-files/GameLogWatcher'
import { readGameLogTail } from './game-log-tail'
import { perfSnapshot, startProcessSampler } from './perf'
import { hotkeyFailures } from './hotkey-failures'
import { marketHandlers } from './market-store'
import { labLayoutImage } from './lab-layout'
import { sessionHandlers } from './session-store'

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
  'ocr-check': async () => checkOcr(),
  'hotkey-failures': async () => hotkeyFailures(),
  'lab-layout-image': labLayoutImage,
  ...marketHandlers,
  ...sessionHandlers
}

export function initWoke (server: ServerEvents, logger: Logger, poeWindow: GameWindow, gameLog: GameLogWatcher): void {
  handlers['game-log-tail'] = async (args) => await readGameLogTail(gameLog, args)
  // Follow the running game's Client.txt (another drive, another Steam
  // library) instead of a stale copy in a default folder.
  poeWindow.onAttach(() => { gameLog.gameStarted().catch(() => {}) })
  for (const kind of [MAP_SCAN, ESSENCE_SCAN]) {
    const scanner = new ScreenScanner(server, logger, poeWindow, kind)
    handlers[`${kind.topic}-start`] = async () => await scanner.start()
    handlers[`${kind.topic}-stop`] = async () => scanner.stop()
    handlers[`${kind.topic}-reread`] = async () => scanner.reread()
    handlers[`${kind.topic}-status`] = async () => ({ running: scanner.isRunning, paused: scanner.isPaused, rolling: scanner.isRolling })
    if (kind.canRoll) handlers[`${kind.topic}-roll`] = async () => await scanner.roll()
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
