// Imported past-league histories, in the overlay's IndexedDB.
import type { LeagueHistory } from './dumps'

const DB_NAME = 'woke-invest'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDb (): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('leagues')) {
          db.createObjectStore('leagues', { keyPath: 'league' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => { dbPromise = null; reject(req.error) }
    })
  }
  return dbPromise
}

function request<T> (req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveLeague (history: LeagueHistory): Promise<void> {
  const db = await openDb()
  await request(db.transaction('leagues', 'readwrite').objectStore('leagues').put(history))
}

export async function deleteLeague (league: string): Promise<void> {
  const db = await openDb()
  await request(db.transaction('leagues', 'readwrite').objectStore('leagues').delete(league))
}

export async function loadLeagues (): Promise<LeagueHistory[]> {
  const db = await openDb()
  const all = await request(db.transaction('leagues').objectStore('leagues').getAll()) as LeagueHistory[]
  return all.sort((a, b) => a.start.localeCompare(b.start))
}

// Past leagues shipped with the app (built by scripts/build-invest-bundle.ts,
// marked imported = 0). Loaded on demand so they stay out of startup.
let bundled: Promise<LeagueHistory[]> | null = null
export function loadBundledLeagues (): Promise<LeagueHistory[]> {
  if (!bundled) {
    bundled = import('./bundled/leagues.json')
      .then(m => (m.default as unknown as LeagueHistory[]).map(h => ({ ...h, imported: 0 })))
      .catch(() => [])
  }
  return bundled
}

// Your imports plus built-in leagues you haven't imported yourself.
export async function allLeagues (): Promise<LeagueHistory[]> {
  const [mine, builtIn] = await Promise.all([loadLeagues().catch(() => []), loadBundledLeagues()])
  const have = new Set(mine.map(h => h.league))
  return [...mine, ...builtIn.filter(h => !have.has(h.league))]
    .sort((a, b) => a.start.localeCompare(b.start))
}
