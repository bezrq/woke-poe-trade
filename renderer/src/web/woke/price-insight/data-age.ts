// How old the poe.ninja data behind a verdict is. poe.ninja is loaded every half
// hour or so while the price check is in use, so hours mean loads are failing.

import { shortAge } from './listing-rows'

const STALE_MS = 2 * 60 * 60 * 1000

export interface DataAge {
  text: string
  stale: boolean
}

export function dataAge (divine: number | undefined, updatedAt: number | null, now: number): DataAge | null {
  if (!divine || updatedAt == null) return null
  const age = Math.max(0, now - updatedAt)
  const rate = `1 div = ${Math.round(divine)}c`
  if (age > STALE_MS) {
    return { text: `${rate}, but poe.ninja hasn't updated in ${shortAge(age)}, so that may be off`, stale: true }
  }
  return { text: `${rate} · poe.ninja ${age < 60_000 ? 'just now' : `${shortAge(age)} ago`}`, stale: false }
}
