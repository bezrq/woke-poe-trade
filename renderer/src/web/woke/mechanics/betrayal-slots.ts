// Betrayal slots priced for one mechanics widget, and the goals its stars make.
// Shared by the panel and the glance card, which also draws in settings.
import { computed } from 'vue'
import type { Ref } from 'vue'
import type { PriceItem } from '../market/types'
import { DIVISIONS, MEMBERS, REWARDS, goalsFromStars, priceReward, slotKey } from './betrayal'
import type { MechanicsWidget } from './widget'

export function useBetrayalSlots (config: () => MechanicsWidget, items: Ref<PriceItem[]>) {
  function rewardText (member: string, di: number) {
    return config().betrayalOverrides[slotKey(member, di)]?.trim() || REWARDS[member][di]
  }

  const slots = computed(() => MEMBERS.flatMap(member => DIVISIONS.map((_, di) => {
    const key = slotKey(member, di)
    const reward = rewardText(member, di)
    const priced = priceReward(reward, items.value)
    return { key, member, di, reward, chaos: priced.chaos ?? null, bestName: priced.bestName, upTo: priced.upTo, count: priced.count, starred: config().betrayalStars.includes(key) }
  })))

  const starredGlance = computed(() => slots.value.filter(s => s.starred))
  const glanceBetrayal = computed(() => (starredGlance.value.length
    ? [...starredGlance.value]
    : slots.value.filter(s => s.chaos != null)
  ).sort((a, b) => (b.chaos ?? -1) - (a.chaos ?? -1)).slice(0, 4))

  const goals = computed(() => goalsFromStars(config().betrayalStars))
  const betrayalAt = computed(() => config().betrayalAt ?? {})
  const goalRows = computed(() => goals.value.map(g => {
    const now = betrayalAt.value[g.member]
    return { ...g, done: now === g.di, nowLabel: now == null ? 'where now?' : `now ${DIVISIONS[now]}` }
  }))
  const goalsDone = computed(() => goalRows.value.filter(g => g.done).length)

  return { rewardText, slots, starredGlance, glanceBetrayal, goals, betrayalAt, goalRows, goalsDone }
}
