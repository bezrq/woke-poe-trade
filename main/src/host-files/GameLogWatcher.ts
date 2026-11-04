import { promises as fs, watchFile, unwatchFile } from 'fs'
import { execFile } from 'child_process'
import path from 'path'
import { app } from 'electron'
import { guessFileLocation } from './utils'
import { ServerEvents } from '../server'
import { Logger } from '../RemoteLogger'

const POSSIBLE_PATH =
  (process.platform === 'win32') ? [
    'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs\\Client.txt',
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs\\Client.txt'
  ] : (process.platform === 'linux') ? [
    path.join(app.getPath('home'), '.wine/drive_c/Program Files (x86)/Grinding Gear Games/Path of Exile/logs/Client.txt'),
    path.join(app.getPath('home'), '.local/share/Steam/steamapps/common/Path of Exile/logs/Client.txt')
  ] : (process.platform === 'darwin') ? [
    path.join(app.getPath('home'), 'Library/Caches/com.GGG.PathOfExile/Logs/Client.txt')
  ] : []

const FIND_GAME_RETRY_MS = 15 * 1000

// woke: the game can be installed anywhere (another Steam library, another
// drive), so ask the running game where it is.
function runningGameLog (): Promise<string | null> {
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
  private _findGameTimer: ReturnType<typeof setTimeout> | undefined
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
    clearTimeout(this._findGameTimer)
    this._wantedPath = null
    if (this._state) {
      unwatchFile(this._state.path)
      const { file } = this._state
      this._state = null
      await file.close()
    }
  }

  async restart (logFile: string) {
    if (this._wantedPath !== logFile) {
      clearTimeout(this._findGameTimer)
      this._wantedPath = logFile
      if (this._state) {
        unwatchFile(this._state.path)
        await this._state.file.close()
        this._state = null
      }
    } else {
      return
    }

    if (!logFile.length) {
      const guessedPath = await runningGameLog() ?? await guessFileLocation(POSSIBLE_PATH)
      if (this._wantedPath !== logFile) return
      if (guessedPath != null) {
        logFile = guessedPath
      } else {
        // Game isn't running yet.
        this._findGameTimer = setTimeout(() => {
          this._wantedPath = null
          this.restart('')
        }, FIND_GAME_RETRY_MS)
        return
      }
    }

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
    if (!this._state) return

    const { file, readBuff, offset } = this._state
    const { bytesRead } = await file.read(readBuff, 0, readBuff.length, offset)

    if (bytesRead) {
      const str = readBuff.toString('utf8', 0, bytesRead)
      const lines = str.split('\n').map(line => line.trim()).filter(line => line.length)
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->CLIENT::game-log',
        payload: { lines }
      })
    }

    if (bytesRead) {
      this._state.offset += bytesRead
      this.readToEOF()
    } else {
      this._state.isReading = false
    }
  }
}
