import { computed, Ref } from 'vue'
import { usePoeninja } from '@/web/background/Prices'
import { buildInsight, InsightListing, InsightOptions } from './insight'

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

  // Rates for every convertible currency; re-read when poe.ninja reloads,
  // which also refreshes the divine rate.
  const options = computed<InsightOptions>(() => {
    const otherRates: Record<string, number> = {}
    if (divine.value != null) {
      for (const [id, name] of Object.entries(NINJA_CURRENCY)) {
        const found = ninja.findPriceByQuery({ ns: 'ITEM', name, variant: undefined })
        if (found && found.chaos > 0) otherRates[id] = found.chaos
      }
    }
    return { divine: divine.value, otherRates }
  })

  const insight = computed(() => buildInsight(listings.value, options.value))

  return { insight, divine, options }
}
