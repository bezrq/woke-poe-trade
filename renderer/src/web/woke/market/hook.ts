// Called from APT's background/Prices.ts each time poe.ninja prices load.
// Kept dependency-free so Prices.ts can import it without import cycles.
import type { DenseChunk } from './parse'

type Listener = (leagueId: string, chunks: DenseChunk[]) => void

const listeners = new Set<Listener>()

export function onWokePricesLoaded (fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export function emitWokePricesLoaded (leagueId: string, chunks: DenseChunk[]): void {
  for (const fn of listeners) {
    try { fn(leagueId, chunks) } catch (err) { console.error('[woke/market]', err) }
  }
}
