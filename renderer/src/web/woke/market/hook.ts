// Called from APT's background/Prices.ts each time poe.ninja prices load.
// Kept dependency-free so Prices.ts can import it without import cycles.
import type { DenseChunk } from './parse'

type Listener = (leagueId: string, chunks: DenseChunk[]) => void

const listeners = new Set<Listener>()
let last: { leagueId: string, chunks: DenseChunk[] } | null = null

export function onWokePricesLoaded (fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

// For a widget placed after prices loaded: APT won't fetch again for 30 minutes.
export function replayWokePrices (): void {
  if (last) emitWokePricesLoaded(last.leagueId, last.chunks)
}

export function emitWokePricesLoaded (leagueId: string, chunks: DenseChunk[]): void {
  last = { leagueId, chunks }
  for (const fn of listeners) {
    try { fn(leagueId, chunks) } catch (err) { console.error('[woke/market]', err) }
  }
}
