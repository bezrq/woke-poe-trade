import { shallowRef } from 'vue'
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

export const useMarketCollector = createGlobalState(() => {
  const poeninja = usePoeninja()

  const lastSnapshot = shallowRef<{ league: string, ts: number, count: number, divine: number | null } | null>(null)
  const lastError = shallowRef<string | null>(null)
  // Bumped after every save so views can reload.
  const revision = shallowRef(0)

  onWokePricesLoaded((league, chunks) => {
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

  poeninja.queuePricesFetch()
  setInterval(() => { poeninja.queuePricesFetch() }, KEEPALIVE_MS)

  return { lastSnapshot, lastError, revision }
})
