// Latest collected prices for the selected league, for modules that need to
// value items (farming profit, etc.). Requires the market collector.
import { computed, shallowRef, watch } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { useLeagues } from '@/web/background/Leagues'
import { useCollectorState, useMarketCollector } from './collector'
import { latestSnapshots } from './db'
import { itemKey } from './types'
import type { PriceItem, Snapshot } from './types'

const usePriceIndexState = createGlobalState(() => {
  const collector = useCollectorState()
  const leagues = useLeagues()
  const snapshot = shallowRef<Snapshot | null>(null)

  watch([leagues.selectedId, collector.revision], async ([league]) => {
    if (!league) { snapshot.value = null; return }
    try {
      const [snap] = await latestSnapshots(league, 1)
      snapshot.value = snap ?? null
    } catch {
      snapshot.value = null
    }
  }, { immediate: true })

  const byKey = computed(() => new Map((snapshot.value?.items ?? []).map(i => [itemKey(i), i])))

  function price (item: { type: string, name: string, variant: string }): number | null {
    return byKey.value.get(itemKey(item))?.chaos ?? null
  }

  function search (query: string, limit = 8): PriceItem[] {
    const q = query.trim().toLowerCase()
    if (q.length < 2 || !snapshot.value) return []
    const starts: PriceItem[] = []
    const contains: PriceItem[] = []
    for (const item of snapshot.value.items) {
      const name = item.name.toLowerCase()
      if (name.startsWith(q)) starts.push(item)
      else if (name.includes(q)) contains.push(item)
      if (starts.length >= limit) break
    }
    return [...starts, ...contains].slice(0, limit)
  }

  return { snapshot, price, search }
})

// Holds the collector (saving only, no polling) while the caller is mounted.
export function usePriceIndex () {
  useMarketCollector()
  return usePriceIndexState()
}
