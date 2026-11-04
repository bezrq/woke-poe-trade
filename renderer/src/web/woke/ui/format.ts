// Shared formatting for data age (P11). One 30 s clock for every panel instead
// of a timer per widget.
import { shallowRef } from 'vue'

export const nowMinute = shallowRef(Date.now())
setInterval(() => { nowMinute.value = Date.now() }, 30_000)

// "just now", "4m", "2h", "3d". Reads nowMinute so callers re-render on tick.
export function ago (ts: number | null | undefined): string {
  if (!ts) return ''
  const s = Math.max(0, (nowMinute.value - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export type Freshness = 'fresh' | 'aging' | 'stale'

// fresh under `freshMin` minutes, stale past `staleMin`.
export function freshness (ts: number | null | undefined, freshMin = 15, staleMin = 120): Freshness {
  if (!ts) return 'stale'
  const m = (nowMinute.value - ts) / 60_000
  return m < freshMin ? 'fresh' : m < staleMin ? 'aging' : 'stale'
}
