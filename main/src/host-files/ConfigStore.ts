import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import type { ConfigNotice } from '../../../ipc/types'
import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

// woke: the last good copy is refreshed on the first write of a run (so it holds
// the settings from before any upgrade) and then at most this often, so a bad
// change doesn't overwrite it straight away.
const BACKUP_EVERY_MS = 30 * 60 * 1000
const READ_ATTEMPTS = 4
const READ_RETRY_MS = 250

function isConfigText (text: string): boolean {
  try {
    const value = JSON.parse(text) as unknown
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  } catch {
    return false
  }
}

export class ConfigStore {
  private isTmpFile = false
  private cfgPath = path.join(app.getPath('userData'), 'apt-data', 'config.json')
  private lastBackupAt = 0
  private loaded = false
  private loadedContents: string | null = null
  notice: ConfigNotice | null = null

  constructor (server: ServerEvents, private logger?: Pick<Logger, 'write'>) {
    server.onEventAnyClient('CLIENT->MAIN::save-config', (cfg) => {
      this.save(cfg.contents, cfg.isTemporary)
      // woke: a quiet save only reaches the disk. The echo would swap the page's
      // config and close Settings, which is what it's saving from.
      if (cfg.quiet) return
      server.sendEventTo('broadcast', {
        name: 'MAIN->CLIENT::config-changed',
        payload: { contents: cfg.contents }
      })
    })
  }

  private get backupPath () { return path.join(path.dirname(this.cfgPath), 'config.backup.json') }

  // woke: a file we can't use is never a reason to lose settings. A damaged one
  // is moved aside and the backup takes over. One we can't read right now
  // (antivirus, a sync tool) is left alone, and this run's saves go elsewhere.
  async load (): Promise<string | null> {
    // A later page load in this run (a reload after a crash) must see what the
    // file holds now, and shouldn't move anything aside again.
    if (this.loaded) return await this.readCurrent()
    this.loaded = true
    this.loadedContents = await this.loadFirst()
    return this.loadedContents
  }

  private async readCurrent (): Promise<string | null> {
    // A write in progress may be holding the newest contents.
    await this.writing
    try {
      return await fs.readFile(this.cfgPath, 'utf8')
    } catch {
      return this.loadedContents
    }
  }

  private async loadFirst (): Promise<string | null> {
    let text: string | null = null
    for (let attempt = 1; ; attempt++) {
      try {
        text = await fs.readFile(this.cfgPath, 'utf8')
        break
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') break
        if (attempt >= READ_ATTEMPTS) {
          this.logger?.write(`error [ConfigStore] Can't read the settings file: ${String(e)}`)
          this.useTempFile()
          this.notice = 'unreadable'
          return null
        }
        await new Promise(resolve => setTimeout(resolve, READ_RETRY_MS))
      }
    }

    if (text != null && isConfigText(text)) return text

    const missing = text == null
    if (!missing) {
      const aside = path.join(path.dirname(this.cfgPath), `config.broken-${Date.now()}.json`)
      try {
        await fs.rename(this.cfgPath, aside)
        this.logger?.write(`error [ConfigStore] The settings file was damaged. Kept it as ${path.basename(aside)}.`)
      } catch (e) {
        this.logger?.write(`error [ConfigStore] Couldn't move the damaged settings file: ${String(e)}`)
        this.useTempFile()
      }
    }

    let backup: string | null = null
    try {
      const saved = await fs.readFile(this.backupPath, 'utf8')
      if (isConfigText(saved)) backup = saved
    } catch {}

    // Missing with no backup is simply a first run.
    if (backup != null) this.notice = 'restored'
    else if (!missing) this.notice = 'reset'
    return backup
  }

  private useTempFile () {
    if (this.isTmpFile) return
    this.cfgPath += '.tmp'
    this.isTmpFile = true
  }

  // woke: saves come in bursts (the run timer catching up on Client.txt saves
  // once per line). Overlapping fs.writeFile calls on one file could leave it
  // as a mix of two saves, invalid JSON, and the next start then fell back to
  // default settings. Writes now run one at a time, newest contents only, and
  // replace the file in one step (write a temp file, then rename).
  private pending: string | null = null
  private writing: Promise<void> = Promise.resolve()

  // Everything asked for so far is on disk. For quitting.
  async flushed (): Promise<void> {
    await this.writing
  }

  private save (contents: string, tmp: boolean) {
    // woke: scripts/woke-dev.ps1 opts in, so its dev copy keeps the player's
    // settings. A plain `npm run dev` still can't touch them.
    if (process.env.VITE_DEV_SERVER_URL && !process.env.WOKE_DEV_SAVE_CONFIG) return

    if (tmp) this.useTempFile()
    this.pending = contents
    this.writing = this.writing.then(() => this.flush())
  }

  private async backUp (target: string) {
    if (this.isTmpFile || Date.now() - this.lastBackupAt < BACKUP_EVERY_MS) return
    try {
      const current = await fs.readFile(target, 'utf8')
      if (!isConfigText(current)) return
      await this.writeSynced(this.backupPath, current)
      this.lastBackupAt = Date.now()
    } catch {
      // Nothing there yet, or it's locked: the next write tries again.
    }
  }

  // Temp file, flushed to disk, then renamed: a power cut can't leave an empty
  // file behind, which a plain write and rename can.
  private async writeSynced (target: string, contents: string) {
    const partial = `${target}.writing`
    const file = await fs.open(partial, 'w')
    try {
      await file.writeFile(contents)
      await file.sync()
    } finally {
      await file.close()
    }
    await fs.rename(partial, target)
  }

  private async flush () {
    const contents = this.pending
    if (contents == null) return
    this.pending = null
    const target = this.cfgPath
    try {
      await fs.mkdir(path.dirname(target), { recursive: true })
      await this.backUp(target)
      try {
        await this.writeSynced(target, contents)
      } catch {
        // Windows can refuse the rename while something (antivirus, backup)
        // has the file open; a plain write is still one writer at a time.
        await fs.writeFile(target, contents)
        await fs.rm(`${target}.writing`, { force: true })
      }
    } catch (e) {
      // woke: used to quit the app. The next save tries again.
      this.logger?.write(`error [ConfigStore] Couldn't save settings: ${String(e)}`)
    }
  }
}
