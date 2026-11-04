// Code kept out of the startup bundle, fetched once the overlay has started
// and is idle, so the first use doesn't wait for it.
import { whenIdle } from '../shared/perf'

setTimeout(() => {
  whenIdle(() => {
    // The price trend sparkline (price-check/trends/PriceTrend.vue).
    import('vue3-apexcharts').catch(() => {})
  })
}, 3000)
