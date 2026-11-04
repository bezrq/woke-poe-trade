// What an offer is worth in chaos, from today's poe.ninja prices.
import type { TradePrice } from './whispers'

export interface PriceLookup {
  // Chaos for one of `name` (null when poe.ninja has no price).
  price: (name: string) => number | null
}

export function priceChaos (p: TradePrice | null, px: PriceLookup): number | null {
  if (!p) return null
  if (p.currency === 'Chaos Orb') return p.amount
  const one = px.price(p.currency)
  return one == null ? null : one * p.amount
}

// Bulk offers: how the price compares with poe.ninja for the same items.
// Negative: they pay less than poe.ninja's value (−0.09 = 9% under).
export function bulkDelta (o: { bulk: boolean, item: string, qty: number, price: TradePrice | null }, px: PriceLookup): number | null {
  if (!o.bulk) return null
  const paid = priceChaos(o.price, px)
  const one = o.item === 'Chaos Orb' ? 1 : px.price(o.item)
  if (paid == null || one == null || one <= 0 || o.qty <= 0) return null
  return paid / (one * o.qty) - 1
}

export function formatValue (chaos: number | null, divine: number | null): string {
  if (chaos == null) return ''
  if (divine && Math.abs(chaos) >= divine) return `${+(chaos / divine).toFixed(1)} div`
  return `${Math.round(chaos)} c`
}
