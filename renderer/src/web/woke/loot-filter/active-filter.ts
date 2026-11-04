// The loaded loot filter, shared with other modules (price check's filter
// verdict). The editor widget publishes its store here on every rebuild.
import { shallowRef, triggerRef } from 'vue'
import type { LootFilterStore } from './store'

const active = shallowRef<LootFilterStore | null>(null)

export function publishActiveFilter (store: LootFilterStore) {
  if (active.value === store) triggerRef(active)
  else active.value = store
}

export function useActiveFilter () {
  return active
}
