import { CATEGORY_TYPES, SKIPPED_TYPES } from './types'
import type { PriceItem } from './types'

// The shape APT keeps after splitting poe.ninja's dense overview:
// one chunk per category, each holding many `{"name":…,"variant":…,"chaos":…,"graph":[…]}` objects.
export interface DenseChunk {
  ns: string
  url: string
  lines: string
}

const ENTRY_START = '{"name":'

export function parseDenseChunks (chunks: DenseChunk[]): PriceItem[] {
  const out: PriceItem[] = []
  for (const chunk of chunks) {
    const type = CATEGORY_TYPES[chunk.url]
    if (!type || SKIPPED_TYPES.has(type)) continue

    let pos = chunk.lines.indexOf(ENTRY_START)
    while (pos !== -1) {
      // Entries contain no nested objects (graph is a flat array), so the
      // first closing brace ends the entry. APT's own lookup relies on this too.
      const end = chunk.lines.indexOf('}', pos)
      if (end === -1) break
      try {
        const info = JSON.parse(chunk.lines.slice(pos, end + 1)) as {
          name?: unknown, variant?: unknown, chaos?: unknown
        }
        if (typeof info.name === 'string' && typeof info.chaos === 'number' && Number.isFinite(info.chaos)) {
          out.push({
            type,
            name: info.name,
            variant: typeof info.variant === 'string' ? info.variant : '',
            chaos: info.chaos
          })
        }
      } catch {}
      pos = chunk.lines.indexOf(ENTRY_START, end)
    }
  }
  return out
}

export function findDivinePrice (items: PriceItem[]): number | null {
  const divine = items.find(i => i.type === 'Currency' && i.name === 'Divine Orb' && !i.variant)
  return divine && divine.chaos >= 1 ? divine.chaos : null
}
