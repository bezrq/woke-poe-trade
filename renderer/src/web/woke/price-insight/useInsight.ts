import { computed, Ref } from 'vue'
import { usePoeninja } from '@/web/background/Prices'
import { buildInsight, InsightListing } from './insight'

// Trade API currency ids we can value through poe.ninja, besides chaos and divine.
const NINJA_CURRENCY: Record<string, string> = {
  exalted: 'Exalted Orb',
  alch: 'Orb of Alchemy',
  fusing: 'Orb of Fusing',
  chrome: 'Chromatic Orb',
  gcp: "Gemcutter's Prism",
  vaal: 'Vaal Orb',
  regal: 'Regal Orb',
  annul: 'Orb of Annulment',
  mirror: 'Mirror of Kalandra'
}

export function useInsight (listings: Ref<InsightListing[]>) {
  const ninja = usePoeninja()

  const divine = computed(() => ninja.xchgRate.value)

  const insight = computed(() => {
    const used = new Set(listings.value.map(l => l.priceCurrency))
    const otherRates: Record<string, number> = {}
    for (const id of used) {
      const name = NINJA_CURRENCY[id]
      if (!name) continue
      const found = ninja.findPriceByQuery({ ns: 'ITEM', name, variant: undefined })
      if (found && found.chaos > 0) otherRates[id] = found.chaos
    }
    return buildInsight(listings.value, { divine: divine.value, otherRates })
  })

  return { insight, divine }
}
