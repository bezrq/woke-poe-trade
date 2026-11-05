// The sources list only earns its space when it says more than the verdict's line.
import { describe, expect, it } from 'vitest'
import { buildBlend, sourcesAddAnything } from '@/web/woke/price-insight/sources'
import { buildInsight } from '@/web/woke/price-insight/insight'
import type { InsightListing } from '@/web/woke/price-insight/insight'

const NOW = Date.parse('2026-11-05T12:00:00Z')

function rows (chaos: number, n: number): InsightListing[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `r${chaos}-${i}`,
    priceAmount: chaos,
    priceCurrency: 'chaos',
    indexedAt: new Date(NOW - 30 * 3600e3).toISOString(),
    hasNote: true,
    hasFee: false,
    isMine: false,
    accountName: `s${chaos}-${i}`,
    accountStatus: 'online' as const,
    listedTimes: 1
  }))
}
const insight = buildInsight(rows(100, 4), { divine: 180, now: NOW })
const blend = (extra: Partial<Parameters<typeof buildBlend>[0]>) => buildBlend({ insight, now: NOW, ...extra })

describe('sourcesAddAnything', () => {
  it('shows it when it explains a blended headline', () => {
    expect(sourcesAddAnything(blend({ ninja: { chaos: 105, gaps: 0 } }), 'blend')).toBe(true)
  })

  it('shows poe.ninja counted lightly, or a gap inside what counts as agreeing', () => {
    expect(sourcesAddAnything(blend({ ninja: { chaos: 105, gaps: 3 } }))).toBe(true)
    expect(sourcesAddAnything(blend({ ninja: { chaos: 78, gaps: 0 } }))).toBe(true)
  })

  it('hides the list when listings stand alone or poe.ninja agrees', () => {
    expect(sourcesAddAnything(blend({}))).toBe(false)
    expect(sourcesAddAnything(blend({ ninja: { chaos: 105, gaps: 0 } }))).toBe(false)
  })

  it('shows it when sources differ', () => {
    expect(sourcesAddAnything(blend({ ninja: { chaos: 170, gaps: 0 } }))).toBe(true)
    expect(sourcesAddAnything(blend({ ninja: { chaos: 500, gaps: 0 } }))).toBe(true)
  })

  it('shows it when poe.ninja is left out', () => {
    expect(sourcesAddAnything(blend({ ninja: { chaos: 105, gaps: 0, fits: false } }))).toBe(true)
  })

  it('shows it for sources the line does not mention', () => {
    expect(sourcesAddAnything(blend({ poeprices: { min: 100, max: 110, confidence: 80 } }))).toBe(true)
    expect(sourcesAddAnything(blend({ mine: { chaos: 100, ts: NOW - 86400e3 } }))).toBe(true)
  })
})
