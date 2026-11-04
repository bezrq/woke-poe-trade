// Farming sessions (with every map run) as files in the app's user data
// folder, for Session analytics. Kept out of config.json so a league of maps
// doesn't slow down every settings save.
//
// Layout: <userData>/woke-sessions/<league>/<session id>.json
import { promises as fs } from 'fs'
import path from 'path'
import { app, shell } from 'electron'

// Same as the renderer's SessionRecord (woke/analytics/types.ts); kept loose here.
interface SessionRecord { id: string, league: string, [k: string]: unknown }

const root = () => path.join(app.getPath('userData'), 'woke-sessions')

function safeName (s: string): string {
  return s.replace(/[^\w .-]/g, '_').slice(0, 80) || '_'
}

function leagueDir (league: unknown): string {
  return path.join(root(), safeName(typeof league === 'string' && league ? league : 'Unknown league'))
}

function sessionFile (s: { id: unknown, league: unknown }): string {
  if (typeof s.id !== 'string' || !s.id) throw new Error('Session has no id.')
  return path.join(leagueDir(s.league), `${safeName(s.id)}.json`)
}

async function writeAtomic (file: string, data: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, data, 'utf8')
  await fs.rename(tmp, file)
}

async function readDir (dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir)
  } catch {
    return []
  }
}

// Every session, read once and kept in memory: a league is a few hundred
// small files at most.
let cache: Promise<Map<string, SessionRecord>> | null = null

function loadAll (): Promise<Map<string, SessionRecord>> {
  if (!cache) {
    cache = (async () => {
      const out = new Map<string, SessionRecord>()
      for (const league of await readDir(root())) {
        const dir = path.join(root(), league)
        for (const name of await readDir(dir)) {
          if (!name.endsWith('.json')) continue
          try {
            const s = JSON.parse(await fs.readFile(path.join(dir, name), 'utf8')) as SessionRecord
            if (s && typeof s.id === 'string') out.set(s.id, s)
          } catch {}
        }
      }
      return out
    })()
    cache.catch(() => { cache = null })
  }
  return cache
}

// Writes go one at a time so two saves never interleave.
let queue: Promise<unknown> = Promise.resolve()
function queued<T> (fn: () => Promise<T>): Promise<T> {
  const next = queue.catch(() => {}).then(fn)
  queue = next
  return next
}

function csvCell (v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Excel reads a CSV without a byte order mark as the PC's ANSI code page,
// which garbles names like "Doppelgänger Guise" or "Maelström of Chaos".
const UTF8_BOM = '\uFEFF'

type Args = Record<string, unknown>

export const sessionHandlers: Record<string, (args: Args) => Promise<unknown>> = {
  'sessions-list': async () => {
    return [...(await loadAll()).values()]
  },
  'sessions-save': async ({ session }) => {
    const s = session as SessionRecord
    return await queued(async () => {
      const all = await loadAll()
      const old = all.get(s.id)
      await writeAtomic(sessionFile(s), JSON.stringify(s))
      // The league can change when a session is edited; drop the old file,
      // once the new one is written (a failed write keeps the session).
      if (old && sessionFile(old) !== sessionFile(s)) await fs.rm(sessionFile(old), { force: true })
      all.set(s.id, s)
      return true
    })
  },
  'sessions-save-many': async ({ sessions }) => {
    return await queued(async () => {
      const all = await loadAll()
      for (const s of (sessions as SessionRecord[]) ?? []) {
        if (all.has(s.id)) continue
        await writeAtomic(sessionFile(s), JSON.stringify(s))
        all.set(s.id, s)
      }
      return true
    })
  },
  'sessions-delete': async ({ id }) => {
    return await queued(async () => {
      const all = await loadAll()
      const old = all.get(id as string)
      if (old) {
        await fs.rm(sessionFile(old), { force: true })
        all.delete(old.id)
      }
      return true
    })
  },
  // One CSV row per map (or per session for sessions without map detail),
  // written next to the session files and shown in the file browser.
  'sessions-export': async ({ rows }) => {
    const list = (rows as Array<Record<string, unknown>>) ?? []
    const cols = list.length ? Object.keys(list[0]) : []
    const text = UTF8_BOM + [cols.join(','), ...list.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\r\n')
    const file = path.join(root(), `maps-${new Date().toISOString().slice(0, 10)}.csv`)
    await writeAtomic(file, text)
    shell.showItemInFolder(file)
    return file
  }
}
