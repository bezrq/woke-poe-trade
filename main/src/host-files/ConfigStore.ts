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
    const value = JSON.parse(text) as { widgets?: unknown } | null
    return typeof value === 'object' && value !== null && Array.isArray(value.widgets)
  } catch {
    return false
  }
}

export class ConfigStore {
  private isTmpFile = false
  private cfgPath = path.join(app.getPath('userData'), 'apt-data', 'config.json')
  private lastBackupAt = 0
  private firstLoad: Promise<string | null> | null = null
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

  // As at a fresh start. For the test host, whose one process plays many runs.
  startOver () {
    if (this.isTmpFile) this.cfgPath = this.cfgPath.slice(0, -'.tmp'.length)
    this.isTmpFile = false
    this.firstLoad = null
    this.lastBackupAt = 0
    this.notice = null
  }

  private get backupPath () { return path.join(path.dirname(this.cfgPath), 'config.backup.json') }

  // woke: a file we can't use is never a reason to lose settings. A damaged one
  // is moved aside and the backup takes over. One we can't read right now
  // (antivirus, a sync tool) is left alone, and this run's saves go elsewhere.
  async load (): Promise<string | null> {
    if (!this.firstLoad) {
      this.firstLoad = this.loadFirst()
      return await this.firstLoad
    }
    // A later page load in this run (a reload after a crash) must see what the
    // file holds now, and shouldn't move anything aside again.
    const first = await this.firstLoad
    // A write in progress may be holding the newest contents.
    await this.writing
    try {
      return await fs.readFile(this.cfgPath, 'utf8')
    } catch {
      return first
    }
  }

  // Null when the file doesn't exist. Throws if it's there but stays unreadable.
  private async readWithRetries (file: string): Promise<string | null> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fs.readFile(file, 'utf8')
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
        if (attempt >= READ_ATTEMPTS) throw e
        await new Promise(resolve => setTimeout(resolve, READ_RETRY_MS))
      }
    }
  }

  private cantRead (e: unknown): null {
    this.logger?.write(`error [ConfigStore] Can't read the settings file: ${String(e)}`)
    this.useTempFile()
    this.notice = 'unreadable'
    return null
  }

  private async loadFirst (): Promise<string | null> {
    let text: string | null
    try {
      text = await this.readWithRetries(this.cfgPath)
    } catch (e) {
      return this.cantRead(e)
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

    let saved: string | null
    try {
      saved = await this.readWithRetries(this.backupPath)
    } catch (e) {
      // It may be good, so nothing may replace it this run.
      return this.cantRead(e)
    }
    const backup = saved != null && isConfigText(saved) ? saved : null

    if (backup != null) {
      this.notice = 'restored'
      // Back in place now: a crash before the first save must still find it.
      if (!this.isTmpFile) {
        try {
          await fs.mkdir(path.dirname(this.cfgPath), { recursive: true })
          await this.writeSynced(this.cfgPath, backup)
        } catch (e) {
          this.logger?.write(`error [ConfigStore] Couldn't restore the settings file: ${String(e)}`)
        }
      }
      // What's on disk now is this backup; no need to copy it over itself.
      this.lastBackupAt = Date.now()
    } else if (!missing) {
      // Missing with no backup is simply a first run.
      this.notice = 'reset'
    }
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
    try {
      await fs.rename(partial, target)
    } catch {
      // Windows can refuse the rename while something (antivirus, backup) has
      // the file open. Only here: on a full disk the temp write above fails and
      // the real file is never touched.
      await fs.writeFile(target, contents)
      await fs.rm(partial, { force: true })
    }
  }

  private async flush () {
    const contents = this.pending
    if (contents == null) return
    this.pending = null
    const target = this.cfgPath
    try {
      await fs.mkdir(path.dirname(target), { recursive: true })
      await this.backUp(target)
      await this.writeSynced(target, contents)
    } catch (e) {
      // woke: used to quit the app. The next save tries again.
      this.logger?.write(`error [ConfigStore] Couldn't save settings: ${String(e)}`)
    }
  }
}
