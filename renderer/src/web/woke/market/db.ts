// Local price history in the overlay's IndexedDB (persists in Electron's user data).
import type { DailyRow, Snapshot } from './types'

const DB_NAME = 'woke-market'
const DB_VERSION = 1

// Snapshots are only needed for intraday movers; daily rows keep the long history.
export const SNAPSHOT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000

let dbPromise: Promise<IDBDatabase> | null = null

function openDb (): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: ['league', 'ts'] })
        }
        if (!db.objectStoreNames.contains('daily')) {
          const daily = db.createObjectStore('daily', { keyPath: ['league', 'date', 'type', 'name', 'variant'] })
          daily.createIndex('byItem', ['league', 'type', 'name', 'variant'])
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => { dbPromise = null; reject(req.error) }
    })
  }
  return dbPromise
}

function done (tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function request<T> (req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Several widgets ask for the newest snapshot after every save; it's a few
// thousand items, so read it from disk once and share it.
const latestCache = new Map<string, Promise<Snapshot | null>>()

export async function saveSnapshot (snapshot: Snapshot, daily: DailyRow[]): Promise<void> {
  latestCache.delete(snapshot.league)
  const db = await openDb()
  const tx = db.transaction(['snapshots', 'daily'], 'readwrite')
  tx.objectStore('snapshots').put(snapshot)
  const dailyStore = tx.objectStore('daily')
  for (const row of daily) dailyStore.put(row)
  // Drop old snapshots for this league.
  tx.objectStore('snapshots').delete(
    IDBKeyRange.bound([snapshot.league, 0], [snapshot.league, snapshot.ts - SNAPSHOT_RETENTION_MS]))
  await done(tx)
  latestCache.set(snapshot.league, Promise.resolve(snapshot))
}

export async function latestSnapshots (league: string, count: number): Promise<Snapshot[]> {
  if (count === 1) {
    let cached = latestCache.get(league)
    if (!cached) {
      cached = readLatest(league, 1).then(list => list[0] ?? null)
      latestCache.set(league, cached)
      const mine = cached
      mine.catch(() => { if (latestCache.get(league) === mine) latestCache.delete(league) })
    }
    const snap = await cached
    return snap ? [snap] : []
  }
  return await readLatest(league, count)
}

async function readLatest (league: string, count: number): Promise<Snapshot[]> {
  const db = await openDb()
  const store = db.transaction('snapshots').objectStore('snapshots')
  const out: Snapshot[] = []
  return new Promise((resolve, reject) => {
    const req = store.openCursor(IDBKeyRange.bound([league, 0], [league, Infinity]), 'prev')
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor || out.length >= count) { resolve(out); return }
      out.push(cursor.value as Snapshot)
      cursor.continue()
    }
    req.onerror = () => reject(req.error)
  })
}

// The newest snapshot taken at or before `ts`.
export async function snapshotAtOrBefore (league: string, ts: number): Promise<Snapshot | null> {
  const db = await openDb()
  const store = db.transaction('snapshots').objectStore('snapshots')
  return new Promise((resolve, reject) => {
    const req = store.openCursor(IDBKeyRange.bound([league, 0], [league, ts]), 'prev')
    req.onsuccess = () => resolve((req.result?.value as Snapshot | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function dailyRowsForDate (league: string, date: string): Promise<DailyRow[]> {
  const db = await openDb()
  const store = db.transaction('daily').objectStore('daily')
  return request(store.getAll(IDBKeyRange.bound([league, date], [league, date, []]))) as Promise<DailyRow[]>
}

export async function dailyHistory (league: string, item: { type: string, name: string, variant: string }): Promise<DailyRow[]> {
  const db = await openDb()
  const index = db.transaction('daily').objectStore('daily').index('byItem')
  const rows = await request(index.getAll([league, item.type, item.name, item.variant])) as DailyRow[]
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

// For other modules and for export: every daily row of a league.
export async function allDailyRows (league: string): Promise<DailyRow[]> {
  const db = await openDb()
  const store = db.transaction('daily').objectStore('daily')
  return request(store.getAll(IDBKeyRange.bound([league], [league, []]))) as Promise<DailyRow[]>
}
