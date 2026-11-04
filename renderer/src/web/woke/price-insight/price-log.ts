// Every finished price check, saved on this PC: what was searched and what
// the verdict said. Feeds "your last check" as a price source and the
// "My checks" history, for rares too (poe.ninja has no history for those).

import { shallowRef } from 'vue'

export interface PriceLogEntry {
  /** Same search, same key: league + the trade request. */
  key: string
  league: string
  label: string
  ts: number
  fair: number
  low: number
  high: number
  /** Trusted listings behind the verdict. */
  n: number
}

const STORAGE_KEY = 'woke.priceLog'
const MAX_ENTRIES = 2000
// A new check of the same search this soon replaces the last one, so
// re-opening the same item a few times does not flood the history.
const MERGE_MS = 10 * 60 * 1000

function read (): PriceLogEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(v)) return v.filter(e => e && typeof e.key === 'string' && typeof e.fair === 'number')
  } catch {}
  return []
}

export const priceLog = shallowRef<PriceLogEntry[]>(read())

function write (list: PriceLogEntry[]) {
  priceLog.value = list
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) priceLog.value = read()
})

/** Short stable hash, so keys don't store whole trade requests. */
export function hashKey (text: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = (Math.imul(h2, 31) + c) | 0
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)
}

export function addLogEntry (entry: PriceLogEntry, list = priceLog.value): PriceLogEntry[] {
  const out = list.slice()
  const lastIdx = out.map(e => e.key).lastIndexOf(entry.key)
  if (lastIdx !== -1 && entry.ts - out[lastIdx].ts < MERGE_MS) {
    out[lastIdx] = { ...entry, ts: out[lastIdx].ts }
  } else {
    out.push(entry)
  }
  while (out.length > MAX_ENTRIES) out.shift()
  return out
}

export function logPriceCheck (entry: PriceLogEntry) {
  write(addLogEntry(entry))
}

export function entriesFor (key: string, list = priceLog.value): PriceLogEntry[] {
  return list.filter(e => e.key === key)
}

/**
 * The newest earlier check of this search that is not the one running now
 * (anything older than the merge window counts as earlier).
 */
export function previousCheck (key: string, now: number, list = priceLog.value): PriceLogEntry | null {
  const own = entriesFor(key, list)
  for (let i = own.length - 1; i >= 0; i--) {
    if (now - own[i].ts >= MERGE_MS) return own[i]
  }
  return null
}

export function clearPriceLog () { write([]) }
