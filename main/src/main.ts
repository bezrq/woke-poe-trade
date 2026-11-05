'use strict'

// woke: must stay the first import (pins the data folder, migrates old data).
import './woke/user-data'
import { app, powerMonitor } from 'electron'
import { uIOhook } from 'uiohook-napi'
import os from 'node:os'
import { startServer, eventPipe, httpRoutes, configFlushed } from './server'
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
import { initWoke, initWokeOverlay, registerWokeHandler } from './woke'
import { gameFilterSetting } from './woke/neversink'
import { perfMark } from './woke/perf'
import { startCrashReporting, attachCrashLogger } from './woke/crash-reports'
import { initSetup, maybeOpenSetup, openSetupWindow, refreshSetupIcon, savedAppIcon } from './woke/setup'
import { setAppIcon } from './woke/app-icon'
import { saveBeforeQuit } from './woke/quit-flush'

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

// woke: crash reports (saved locally, offered for reporting next launch).
startCrashReporting()

if (process.platform !== 'darwin') {
  app.disableHardwareAcceleration()
}
app.enableSandbox()

saveBeforeQuit(eventPipe, configFlushed)

let tray: AppTray | undefined

app.on('second-instance', () => { tray?.notifyAlreadyRunning() })

app.on('ready', async () => {
  perfMark('app ready')
  setAppIcon(savedAppIcon())
  const appTray = new AppTray(eventPipe)
  tray = appTray
  const logger = new Logger(eventPipe)
  attachCrashLogger(logger)
  const gameLogWatcher = new GameLogWatcher(eventPipe, logger)
  const gameConfig = new GameConfig(eventPipe, logger)
  const poeWindow = new GameWindow()
  const appUpdater = new AppUpdater(eventPipe, logger)
  const _httpProxy = new HttpProxy(httpRoutes, logger)
  initWoke(eventPipe, logger, poeWindow, gameLogWatcher)
  registerWokeHandler('game-filter', async () => await gameFilterSetting(gameConfig.actualPath))
  initSetup(appUpdater)
  appTray.onRunSetup = openSetupWindow

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
        if (cfg.wokeGameLog === false) gameLogWatcher.stop()
        else gameLogWatcher.restart(cfg.clientLog ?? '')
        gameConfig.readConfig(cfg.gameConfig ?? '')
        appUpdater.checkAtStartup()
        appTray.overlayKey = cfg.overlayKey
        if (setAppIcon(cfg.appIcon)) {
          appTray.refreshIcon()
          overlay.refreshIcon()
          refreshSetupIcon()
        }
      })
      uIOhook.start()
      // woke: after sleep the keyboard and mouse hook can be dead, which stops
      // the dock, Alt to hide and everything else watching input.
      const restartHook = (triesLeft: number) => {
        try {
          uIOhook.stop()
          uIOhook.start()
        } catch (e) {
          logger.write(`error [main] Couldn't restart the input hook: ${String(e)}`)
          if (triesLeft > 0) setTimeout(() => { restartHook(triesLeft - 1) }, 5000)
        }
      }
      powerMonitor.on('resume', () => {
        logger.write('info [main] Back from sleep, restarting the input hook.')
        restartHook(3)
      })
      const port = await startServer(appUpdater, logger)
      perfMark('server listening')
      // TODO: move up (currently crashes)
      logger.write(`info ${os.type()} ${os.release} / v${app.getVersion()}`)
      overlay.loadAppPage(port)
      perfMark('overlay page requested')
      appTray.serverPort = port
      maybeOpenSetup(port)
    },
    // fixes(linux): window is black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )
})
