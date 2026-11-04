import { shallowRef } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { usePoeninja } from '@/web/background/Prices'
import { onWokePricesLoaded } from './hook'
import { findDivinePrice, parseDenseChunks } from './parse'
import { saveSnapshot } from './db'
import { utcDate } from './types'
import type { DailyRow, Snapshot } from './types'
import { perfTime, perfTimeAsync, whenIdle } from '../shared/perf'

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
    const ts = Date.now()
    // Parsing and saving a few thousand rows takes a while; wait for a quiet
    // moment so it never delays a price check.
    whenIdle(() => { collect(league, chunks, ts) })
  })

  function collect (league: string, chunks: Parameters<typeof parseDenseChunks>[0], ts: number) {
    const items = perfTime('Prices: read poe.ninja data', () => parseDenseChunks(chunks))
    if (!items.length) return
    const divine = findDivinePrice(items)
    const snapshot: Snapshot = { league, ts, divine, items }
    const date = utcDate(ts)
    const daily: DailyRow[] = items.map(item => ({ league, date, divine, ts, ...item }))

    perfTimeAsync('Prices: save to history', saveSnapshot(snapshot, daily))
      .then(() => {
        lastSnapshot.value = { league, ts, count: items.length, divine }
        lastError.value = null
        revision.value++
      })
      .catch((err: unknown) => {
        lastError.value = String(err)
      })
  }

  poeninja.queuePricesFetch()
  setInterval(() => { poeninja.queuePricesFetch() }, KEEPALIVE_MS)

  return { lastSnapshot, lastError, revision }
})
