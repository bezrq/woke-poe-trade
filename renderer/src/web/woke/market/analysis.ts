import { itemKey } from './types'
import type { PriceItem } from './types'

export interface Mover {
  type: string
  name: string
  variant: string
  now: number
  then: number
  change: number // fraction, 0.25 = +25%
}

// Items present in both lists, priced at least `minChaos` now or then,
// sorted by the size of the move.
export function computeMovers (
  now: PriceItem[],
  then: PriceItem[],
  opts: { minChaos: number, type?: string, limit: number }
): Mover[] {
  const before = new Map<string, number>()
  for (const item of then) before.set(itemKey(item), item.chaos)

  const out: Mover[] = []
  for (const item of now) {
    if (opts.type && item.type !== opts.type) continue
    const prev = before.get(itemKey(item))
    if (prev == null || prev <= 0) continue
    if (Math.max(item.chaos, prev) < opts.minChaos) continue
    out.push({
      type: item.type,
      name: item.name,
      variant: item.variant,
      now: item.chaos,
      then: prev,
      change: item.chaos / prev - 1
    })
  }
  out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  return out.slice(0, opts.limit)
}

// Past prices from poe.ninja's trend, for when local history doesn't reach back far enough.
export function trendThen (items: PriceItem[], period: '24h' | '7d'): PriceItem[] {
  const out: PriceItem[] = []
  for (const item of items) {
    const chaos = period === '24h' ? item.d1 : item.d7
    if (chaos != null) out.push({ ...item, chaos })
  }
  return out
}

export function formatChaos (chaos: number, divine: number | null): string {
  const sign = chaos < 0 ? '-' : ''
  const a = Math.abs(chaos)
  if (divine && a >= divine) {
    return `${sign}${(a / divine).toFixed(a >= divine * 10 ? 0 : 1)} div`
  }
  return `${sign}${a >= 10 ? Math.round(a) : a.toFixed(1)} c`
}

export function formatChange (change: number): string {
  const pct = change * 100
  return `${pct >= 0 ? '+' : ''}${Math.abs(pct) >= 10 ? Math.round(pct) : pct.toFixed(1)}%`
}

// SVG polyline points for a small sparkline.
export function sparklinePoints (values: number[], width: number, height: number): string {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / span) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}
