import { shallowRef, getCurrentScope, onScopeDispose } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { usePoeninja } from '@/web/background/Prices'
import { onWokePricesLoaded } from './hook'
import { findDivinePrice, parseDenseChunks } from './parse'
import { saveSnapshot } from './db'
import { utcDate } from './types'
import type { DailyRow, Snapshot } from './types'

// APT only refreshes poe.ninja prices (about every 31 min) while something
// shows interest in them. Poking it on this interval keeps refreshes going
// so history is collected even when no price check happens.
const KEEPALIVE_MS = 10 * 60 * 1000

// Mounted widgets hold the collector: `users` get snapshots saved whenever APT
// loads prices; `pollers` (history modules) also keep the 10 min refresh going.
// With no holders nothing is saved or polled.
let users = 0
let pollers = 0
let keepalive: ReturnType<typeof setInterval> | null = null

export const collectorHolders = shallowRef({ users: 0, pollers: 0 })

const useCollectorState = createGlobalState(() => {
  const lastSnapshot = shallowRef<{ league: string, ts: number, count: number, divine: number | null } | null>(null)
  const lastError = shallowRef<string | null>(null)
  // Bumped after every save so views can reload.
  const revision = shallowRef(0)

  onWokePricesLoaded((league, chunks) => {
    if (users === 0) return
    const items = parseDenseChunks(chunks)
    if (!items.length) return
    const ts = Date.now()
    const divine = findDivinePrice(items)
    const snapshot: Snapshot = { league, ts, divine, items }
    const date = utcDate(ts)
    const daily: DailyRow[] = items.map(item => ({ league, date, divine, ts, ...item }))

    saveSnapshot(snapshot, daily)
      .then(() => {
        lastSnapshot.value = { league, ts, count: items.length, divine }
        lastError.value = null
        revision.value++
      })
      .catch((err: unknown) => {
        lastError.value = String(err)
      })
  })

  return { lastSnapshot, lastError, revision }
})

function retain (poll: boolean) {
  const poeninja = usePoeninja()
  // A fresh holder wants current prices; APT skips the fetch if they are recent.
  if (++users === 1) poeninja.queuePricesFetch()
  if (poll && ++pollers === 1) {
    keepalive = setInterval(() => { poeninja.queuePricesFetch() }, KEEPALIVE_MS)
  }
  collectorHolders.value = { users, pollers }
}

function release (poll: boolean) {
  users--
  if (poll && --pollers === 0 && keepalive) {
    clearInterval(keepalive)
    keepalive = null
  }
  collectorHolders.value = { users, pollers }
}

// Call from a component's setup; released when it unmounts.
// `poll: true` keeps prices refreshing for history (market, investments, lab gems).
export function useMarketCollector (opts: { poll?: boolean } = {}) {
  const state = useCollectorState()
  const poll = Boolean(opts.poll)
  retain(poll)
  if (getCurrentScope()) {
    onScopeDispose(() => { release(poll) })
  }
  return state
}

// Read-only access without holding the collector open.
export { useCollectorState }
