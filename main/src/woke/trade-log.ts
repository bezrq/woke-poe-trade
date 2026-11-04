// The trade assistant's sales log: one JSON file per league in the app's user
// data folder, kept out of config.json so a league of trades doesn't slow
// down every settings save.
//
// Layout: <userData>/woke-trades/<league>.json  (an array of trades)
import { promises as fs } from 'fs'
import path from 'path'
import { app } from 'electron'

// Same as the renderer's TradeRecord (woke/trade/book.ts); kept loose here.
interface TradeRecord { id: string, league: string, at: number, [k: string]: unknown }

const root = () => path.join(app.getPath('userData'), 'woke-trades')

function safeName (s: string): string {
  return s.replace(/[^\w .-]/g, '_').slice(0, 80) || '_'
}

function leagueFile (league: unknown): string {
  return path.join(root(), `${safeName(typeof league === 'string' && league ? league : 'Unknown league')}.json`)
}

async function writeAtomic (file: string, data: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, data, 'utf8')
  await fs.rename(tmp, file)
}

async function readFile (file: string): Promise<TradeRecord[]> {
  try {
    const list = JSON.parse(await fs.readFile(file, 'utf8')) as unknown
    return Array.isArray(list) ? list.filter((t): t is TradeRecord => t && typeof t.id === 'string') : []
  } catch {
    return []
  }
}

// Writes go one at a time so two saves never interleave.
let queue: Promise<unknown> = Promise.resolve()
function queued<T> (fn: () => Promise<T>): Promise<T> {
  const next = queue.catch(() => {}).then(fn)
  queue = next
  return next
}

type Args = Record<string, unknown>

export const tradeLogHandlers: Record<string, (args: Args) => Promise<unknown>> = {
  'trades-list': async () => {
    let names: string[] = []
    try { names = await fs.readdir(root()) } catch {}
    const out: TradeRecord[] = []
    for (const name of names) {
      if (name.endsWith('.json')) out.push(...await readFile(path.join(root(), name)))
    }
    return out
  },
  'trades-add': async ({ trade }) => {
    const t = trade as TradeRecord
    if (!t || typeof t.id !== 'string') throw new Error('Trade has no id.')
    return await queued(async () => {
      const file = leagueFile(t.league)
      const list = await readFile(file)
      const i = list.findIndex(x => x.id === t.id)
      if (i >= 0) list[i] = t
      else list.push(t)
      await writeAtomic(file, JSON.stringify(list))
      return true
    })
  },
  'trades-delete': async ({ id, league }) => {
    return await queued(async () => {
      const file = leagueFile(league)
      const list = await readFile(file)
      const keep = list.filter(x => x.id !== id)
      if (keep.length !== list.length) await writeAtomic(file, JSON.stringify(keep))
      return true
    })
  }
}
