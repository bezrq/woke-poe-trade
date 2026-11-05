import fs from 'fs/promises'
import path from 'path'
import ini from 'ini'
import { app } from 'electron'
import { hotkeyToString, CodeToKey } from '../../../ipc/KeyToCode'
import { guessFileLocation } from './utils'
import type { Logger } from '../RemoteLogger'
import type { ServerEvents } from '../server'

const POSSIBLE_PATH =
  (process.platform === 'win32') ? [
    path.join(app.getPath('documents'), 'My Games\\Path of Exile\\production_Config.ini')
  ] : (process.platform === 'linux') ? [
    path.join(app.getPath('documents'), 'My Games/Path of Exile/production_Config.ini'),
    path.join(app.getPath('home'), '.local/share/Steam/steamapps/compatdata/238960/pfx/drive_c/users/steamuser/Documents/My Games/Path of Exile/production_Config.ini')
  ] : (process.platform === 'darwin') ? [
    path.join(app.getPath('appData'), 'Path of Exile/Preferences/production_Config.ini')
  ] : []

export interface GameBind {
  hotkey: string
  action: string
}

// production_Config.ini's values read as strings or booleans, depending on them.
const isTrue = (value: unknown) => value === true || value === 'true'

export function readGameSettings (parsed: Record<string, Record<string, unknown> | undefined>) {
  const binds: GameBind[] = []
  for (const [name, value] of Object.entries(parsed['ACTION_KEYS'] ?? {})) {
    const [code, mod] = String(value).split(' ')
    const key = CodeToKey[code]
    // Mouse buttons and keys with no name here can't clash with a hotkey.
    if (!key || (mod && !['1', '2', '3'].includes(mod))) continue
    const action = name.replace(/_/g, ' ')
    binds.push({
      hotkey: hotkeyToString([key], mod === '2', mod === '1', mod === '3'),
      action: action[0].toUpperCase() + action.slice(1)
    })
  }
  const display = parsed['DISPLAY'] ?? {}
  return {
    binds,
    isExclusiveFullscreen: isTrue(display['fullscreen']) && !isTrue(display['borderless_windowed_fullscreen'])
  }
}

export class GameConfig {
  private _wantedPath: string | null = null
  private _actualPath: string | null = null
  get actualPath () { return this._actualPath }

  private _showModsKey: string | null = null
  get showModsKeyNullable () { return this._showModsKey }
  get showModsKey () { return this._showModsKey ?? 'Alt' }

  // woke: the game's own keys, to warn when a hotkey here takes one of them.
  binds: GameBind[] = []
  // True fullscreen, where no window can draw over the game.
  isExclusiveFullscreen = false

  // woke: the game rewrites its config while running, so look again when it starts.
  async refresh () {
    if (!this._actualPath) return
    try {
      const contents = await fs.readFile(this._actualPath, { encoding: 'utf-8', flag: 'r' })
      const { binds, isExclusiveFullscreen } = readGameSettings(ini.parse(contents.trimStart()))
      this.binds = binds
      this.isExclusiveFullscreen = isExclusiveFullscreen
    } catch {
      this.logger.write('error [GameConfig] Failed to read game configuration file.')
    }
  }

  constructor (
    private server: ServerEvents,
    private logger: Logger
  ) {}

  async readConfig (filePath: string) {
    if (this._wantedPath !== filePath) {
      this._wantedPath = filePath
      this._actualPath = null
    } else {
      return
    }

    if (!filePath.length) {
      const guessedPath = await guessFileLocation(POSSIBLE_PATH)
      if (guessedPath != null) {
        filePath = guessedPath
      } else {
        this.logger.write('error [GameConfig] Failed to find game configuration file in the default location.')
        return
      }
    }

    try {
      let contents = await fs.readFile(filePath, { encoding: 'utf-8', flag: 'r' })
      contents = contents.trimStart() // remove BOM
      const parsed = ini.parse(contents)

      this._showModsKey = this.parseConfigHotkey(
        parsed['ACTION_KEYS']?.['show_advanced_item_descriptions'])
      const { binds, isExclusiveFullscreen } = readGameSettings(parsed)
      this.binds = binds
      this.isExclusiveFullscreen = isExclusiveFullscreen

      this._actualPath = filePath
    } catch {
      this.logger.write('error [GameConfig] Failed to read game configuration file.')
    }
  }

  private parseConfigHotkey (cfgKey?: string): string | null {
    if (!cfgKey) return null

    const [keyMain, keyMod] = cfgKey.split(' ')

    let key1: string
    if (CodeToKey[keyMain]) {
      key1 = CodeToKey[keyMain]
    } else {
      this.logger.write(`error [GameConfig] Failed to read key: ${cfgKey}.`)
      return null
    }

    let key2: string | undefined
    if (keyMod) {
      if (keyMod === '1') {
        key2 = 'Shift'
      } else if (keyMod === '2') {
        key2 = 'Ctrl'
      } else if (keyMod === '3') {
        key2 = 'Alt'
      } else {
        this.logger.write(`error [GameConfig] Failed to read modifier key: ${cfgKey}.`)
        return null
      }
    }

    return hotkeyToString(
      [key1],
      key2 === 'Ctrl',
      key2 === 'Shift',
      key2 === 'Alt'
    )
  }
}
