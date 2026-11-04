'use strict'

import { app } from 'electron'
import { uIOhook } from 'uiohook-napi'
import os from 'node:os'
import { startServer, eventPipe, server } from './server'
import { Logger } from './RemoteLogger'
import { GameWindow } from './windowing/GameWindow'
import { OverlayWindow } from './windowing/OverlayWindow'
import { GameConfig } from './host-files/GameConfig'
import { Shortcuts } from './shortcuts/Shortcuts'
import { AppUpdater } from './AppUpdater'
import { AppTray } from './AppTray'
import { OverlayVisibility } from './windowing/OverlayVisibility'
import { GameLogWatcher } from './host-files/GameLogWatcher'
import { HttpProxy } from './proxy'
import { initWoke, initWokeOverlay } from './woke'
import { perfMark } from './woke/perf'

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

if (process.platform !== 'darwin') {
  app.disableHardwareAcceleration()
}
app.enableSandbox()

let tray: AppTray

app.on('ready', async () => {
  perfMark('app ready')
  tray = new AppTray(eventPipe)
  const logger = new Logger(eventPipe)
  const gameLogWatcher = new GameLogWatcher(eventPipe, logger)
  const gameConfig = new GameConfig(eventPipe, logger)
  const poeWindow = new GameWindow()
  const appUpdater = new AppUpdater(eventPipe)
  const _httpProxy = new HttpProxy(server, logger)
  initWoke(eventPipe, logger, poeWindow)

  setTimeout(
    async () => {
      const overlay = new OverlayWindow(eventPipe, logger, poeWindow)
      perfMark('overlay window created')
      new OverlayVisibility(eventPipe, overlay, gameConfig)
      initWokeOverlay(eventPipe, overlay)
      const shortcuts = await Shortcuts.create(logger, overlay, poeWindow, gameConfig, eventPipe)
      perfMark('hotkeys ready')
      eventPipe.onEventAnyClient('CLIENT->MAIN::update-host-config', (cfg) => {
        overlay.updateOpts(cfg.overlayKey, cfg.windowTitle)
        shortcuts.updateActions(cfg.shortcuts, cfg.stashScroll, cfg.logKeys, cfg.restoreClipboard, cfg.language)
        gameLogWatcher.restart(cfg.clientLog ?? '')
        gameConfig.readConfig(cfg.gameConfig ?? '')
        appUpdater.checkAtStartup()
        tray.overlayKey = cfg.overlayKey
      })
      uIOhook.start()
      const port = await startServer(appUpdater, logger)
      perfMark('server listening')
      // TODO: move up (currently crashes)
      logger.write(`info ${os.type()} ${os.release} / v${app.getVersion()}`)
      overlay.loadAppPage(port)
      perfMark('overlay page requested')
      tray.serverPort = port
    },
    // fixes(linux): window is black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )
})
