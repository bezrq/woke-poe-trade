import { promises as fs, watchFile, unwatchFile } from 'fs'
import { execFile } from 'child_process'
import path from 'path'
import { app } from 'electron'
import { guessFileLocation } from './utils'
import { ServerEvents } from '../server'
import { Logger } from '../RemoteLogger'

export const POSSIBLE_PATH =
  (process.platform === 'win32') ? [
    'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs\\Client.txt',
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs\\Client.txt'
  ] : (process.platform === 'linux') ? [
    path.join(app.getPath('home'), '.wine/drive_c/Program Files (x86)/Grinding Gear Games/Path of Exile/logs/Client.txt'),
    path.join(app.getPath('home'), '.local/share/Steam/steamapps/common/Path of Exile/logs/Client.txt')
  ] : (process.platform === 'darwin') ? [
    path.join(app.getPath('home'), 'Library/Caches/com.GGG.PathOfExile/Logs/Client.txt')
  ] : []

// woke: the game can be installed anywhere (another Steam library, another
// drive), so ask the running game where it is. Runs once at startup and once
// each time the game window appears, never on a timer.
export function runningGameLog (): Promise<string | null> {
  if (process.platform !== 'win32') return Promise.resolve(null)
  return new Promise((resolve) => {
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command',
      '(Get-Process PathOfExile* -ErrorAction SilentlyContinue | Select-Object -First 1).Path'
    ], { windowsHide: true, timeout: 10_000 }, (err, stdout) => {
      const exe = err ? '' : stdout.trim()
      resolve(exe ? path.join(path.dirname(exe), 'logs', 'Client.txt') : null)
    })
  })
}

export class GameLogWatcher {
  private _wantedPath: string | null = null
  get actualPath () { return this._state?.path ?? null }
  private _state: {
    offset: number
    path: string
    file: fs.FileHandle
    isReading: boolean
    readBuff: Buffer
  } | null = null

  constructor (
    private server: ServerEvents,
    private logger: Logger,
  ) {}

  // woke: stop tailing when no enabled module reads the log.
  async stop () {
    this._wantedPath = null
    await this.close()
  }

  async restart (logFile: string) {
    if (this._wantedPath === logFile) return
    this._wantedPath = logFile
    await this.close()

    if (!logFile.length) {
      // woke: an old install's Client.txt in a default folder used to win
      // for good when the app started before the game. Now the default
      // folders are only a stand-in until the game starts (gameStarted).
      const guessedPath = await runningGameLog() ?? await guessFileLocation(POSSIBLE_PATH)
      if (this._wantedPath !== logFile || guessedPath == null) return
      logFile = guessedPath
    }
    await this.open(logFile)
  }

  // woke: the game window appeared. With the path left on auto, follow the
  // running game's own Client.txt if it isn't the one being read.
  async gameStarted () {
    if (this._wantedPath !== '') return
    const found = await runningGameLog()
    if (!found || this._wantedPath !== '' || found === this.actualPath) return
    try {
      await fs.access(found)
    } catch {
      return
    }
    this.logger.write(`info [GameLogWatcher] Switching to the running game's log: ${found}`)
    await this.close()
    await this.open(found)
  }

  private async close () {
    if (!this._state) return
    unwatchFile(this._state.path)
    const { file } = this._state
    this._state = null
    await file.close()
  }

  private async open (logFile: string) {
    try {
      const file = await fs.open(logFile, 'r')
      const stats = await file.stat()
      watchFile(logFile, { interval: 450 }, this.handleFileChange.bind(this))
      this._state = {
        path: logFile,
        file: file,
        offset: stats.size,
        isReading: false,
        readBuff: Buffer.allocUnsafe(64 * 1024),
      }
    } catch {
      this.logger.write('error [GameLogWatcher] Failed to watch file.')
    }
  }

  private handleFileChange () {
    if (this._state && !this._state.isReading) {
      this._state.isReading = true
      this.readToEOF()
    }
  }

  private async readToEOF () {
    const state = this._state
    if (!state) return

    const { file, readBuff, offset } = state
    let bytesRead: number
    try {
      ({ bytesRead } = await file.read(readBuff, 0, readBuff.length, offset))
    } catch {
      // woke: the file was closed meanwhile (switched to the running game's log).
      state.isReading = false
      return
    }
    if (this._state !== state) return

    if (bytesRead) {
      // woke: only whole lines. A chunk can end mid-line (or mid-character);
      // the rest is read with the next chunk instead of arriving as a broken line.
      let used = readBuff.lastIndexOf(10, bytesRead - 1) + 1
      if (used === 0) {
        if (bytesRead < readBuff.length) {
          // Half a line at the end of the file: wait for the game to finish it.
          state.isReading = false
          return
        }
        used = bytesRead
      }
      const str = readBuff.toString('utf8', 0, used)
      const lines = str.split('\n').map(line => line.trim()).filter(line => line.length)
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->CLIENT::game-log',
        payload: { lines }
      })
      state.offset += used
      this.readToEOF()
    } else {
      state.isReading = false
    }
  }
}
