import { isThin, itemKey } from './types'
import type { PriceItem } from './types'

export interface Mover {
  type: string
  name: string
  variant: string
  now: number
  then: number
  change: number // fraction, 0.25 = +25%, in the unit asked for
  gaps?: number
}

export type MoveUnit = 'chaos' | 'div'

// Items present in both lists, priced at least `minChaos` now or then,
// sorted by the size of the move.
export function computeMovers (
  now: PriceItem[],
  then: PriceItem[],
  opts: {
    minChaos: number
    type?: string
    limit: number
    // 'div' measures the move in divines, so a divine price swing doesn't
    // show up as every item moving.
    unit?: MoveUnit
    divNow?: number | null
    divThen?: number | null
    hideThin?: boolean
  }
): Mover[] {
  const inDiv = opts.unit === 'div' && opts.divNow && opts.divThen
  const ratio = inDiv ? opts.divThen! / opts.divNow! : 1
  const before = new Map<string, number>()
  for (const item of then) before.set(itemKey(item), item.chaos)

  const out: Mover[] = []
  for (const item of now) {
    if (opts.type && item.type !== opts.type) continue
    const prev = before.get(itemKey(item))
    if (prev == null || prev <= 0) continue
    if (Math.max(item.chaos, prev) < opts.minChaos) continue
    if (opts.hideThin && isThin(item)) continue
    if (inDiv && item.type === 'Currency' && item.name === 'Divine Orb' && !item.variant) continue
    out.push({
      type: item.type,
      name: item.name,
      variant: item.variant,
      now: item.chaos,
      then: prev,
      change: (item.chaos / prev) * ratio - 1,
      gaps: item.gaps
    })
  }
  out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  return out.slice(0, opts.limit)
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
