// Farming profit and Atlas strategies share scarab costs; either widget can
// exist in config before it has ever mounted (its module is off). Also what
// Session analytics counts from the saved sessions.
import { describe, it, expect } from 'vitest'
import { strategyScarabCosts } from '@/web/woke/atlas/guide'
import type { AtlasStrategy } from '@/web/woke/atlas/widget'
import { withScarabCosts } from '@/web/woke/farming/farming'
import { exportRows, sessionTotals, strategyRows } from '@/web/woke/analytics/stats'
import type { MapRun, SessionRecord } from '@/web/woke/analytics/types'

const items = [{ type: 'Scarab', name: 'Ambush Scarab', variant: '', chaos: 5 }]
const strategy = { name: 'Boxes', scarabs: '2x Ambush Scarab' } as AtlasStrategy

describe('scarab costs from Atlas strategies', () => {
  it('skips an Atlas widget that never mounted', () => {
    expect(strategyScarabCosts([undefined, [strategy]], 'Boxes', items)).toEqual([{ type: 'Scarab', name: 'Ambush Scarab', variant: '', qty: 2 }])
    expect(strategyScarabCosts([undefined], 'Boxes', items)).toBeNull()
  })

  it('can fill the costs of a Farming widget that never mounted', () => {
    const line = { type: 'Scarab', name: 'Ambush Scarab', variant: '', qty: 2 }
    expect(withScarabCosts(undefined, [line])).toEqual([line])
    const map = { type: 'Map', name: 'Strand', variant: '', qty: 1 }
    expect(withScarabCosts([map, { ...line, qty: 9 }], [line])).toEqual([map, line])
  })
})

function run (over: Partial<MapRun> = {}): MapRun {
  return { areaId: 'MapWorldsStrand', name: 'Strand', level: 83, enteredAt: 1, mapMs: 600_000, otherMs: 0, loot: [], ...over }
}

function session (over: Partial<SessionRecord> = {}): SessionRecord {
  return { id: 's', league: 'L', strategy: 'Boxes', startedAt: 0, endedAt: 1, durationMs: 1_200_000, maps: 2, costPerMapChaos: 10, loot: [], extraChaos: 0, divine: 100, runs: [run(), run()], ...over }
}

describe('session analytics', () => {
  it('maps you left out do not count in maps per hour or cost per map', () => {
    const [row] = strategyRows([session({ runs: [run(), run({ excluded: true })] })], 'chaos', null)
    expect(row.maps).toBe(1)
    expect(row.mapsPerHour).toBeCloseTo(6, 5)
    expect(row.costPerMap).toBe(10)
  })

  it('the CSV adds up to the session, loot not tied to a map included', () => {
    const s = session({
      loot: [{ type: 'Currency', name: 'Divine Orb', variant: '', qty: 1, chaos: 100 }],
      extraChaos: 7,
      runs: [run({ loot: [{ type: 'Currency', name: 'Chaos Orb', variant: '', qty: 3, chaos: 1 }] }), run()]
    })
    const rows = exportRows([s])
    expect(rows).toHaveLength(3)
    expect(rows.reduce((n, r) => n + Number(r.profit_chaos), 0)).toBe(sessionTotals(s).profit)
    expect(Object.keys(rows[2])).toEqual(Object.keys(rows[0]))
    expect(rows[2].drops).toBe('1x Divine Orb')
  })

  it('adds no extra row when everything is tied to a map', () => {
    expect(exportRows([session()])).toHaveLength(2)
  })
})
