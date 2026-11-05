// When a dismissed dock icon comes back.
import { describe, expect, it } from 'vitest'
import { endOfToday, hereEnded, hereScope, timeLeft } from '@/web/woke/dock/dismiss-rules'

const map = { areaId: 'MapWorldsJungleValley', seed: '111', kind: 'map' as const }

describe('dismissed for here', () => {
  it('words the chip by where you are', () => {
    expect(hereScope(map).phrase).toBe('this map')
    expect(hereScope({ areaId: 'HideoutLuxurious', seed: '1', kind: 'hideout' }).phrase).toBe('this visit')
    expect(hereScope({ areaId: 'KalguuranSettlersLeague', seed: '8', kind: 'town' }).phrase).toBe('this visit')
    expect(hereScope({ areaId: 'x', seed: '', kind: 'lab' }).phrase).toBe('this lab')
    expect(hereScope({ areaId: 'x', seed: '', kind: 'boss' }).phrase).toBe('this fight')
    expect(hereScope({ areaId: '1_1_1', seed: '', kind: 'campaign' }).phrase).toBe('this zone')
    expect(hereScope({ areaId: '', seed: '', kind: null }).phrase).toBe('this zone')
  })

  it('a map lasts through the hideout and back, and ends with another map', () => {
    const s = hereScope(map)
    expect(hereEnded(s, { areaId: 'HideoutLuxurious', seed: '1', kind: 'hideout' })).toBe(false)
    expect(hereEnded(s, { areaId: 'KalguuranSettlersLeague', seed: '8', kind: 'town' })).toBe(false)
    expect(hereEnded(s, map)).toBe(false)
    // The same map type, a new instance.
    expect(hereEnded(s, { ...map, seed: '222' })).toBe(true)
    expect(hereEnded(s, { areaId: 'MapWorldsDunes', seed: '111', kind: 'map' })).toBe(true)
  })

  it('a visit ends when you leave, even for a place you return from', () => {
    const s = hereScope({ areaId: 'HideoutLuxurious', seed: '1', kind: 'hideout' })
    expect(hereEnded(s, { areaId: 'HideoutLuxurious', seed: '1', kind: 'hideout' })).toBe(false)
    expect(hereEnded(s, map)).toBe(true)
  })

  it('a lab lasts through its rooms', () => {
    const s = hereScope({ areaId: 'Labyrinth_1', seed: '5', kind: 'lab' })
    expect(hereEnded(s, { areaId: 'Labyrinth_2', seed: '6', kind: 'lab' })).toBe(false)
    expect(hereEnded(s, { areaId: 'HideoutLuxurious', seed: '1', kind: 'hideout' })).toBe(true)
  })
})

describe('dismissed for a time', () => {
  it('today ends at the next local midnight', () => {
    const at = new Date(2026, 10, 5, 23, 59, 0).getTime()
    expect(endOfToday(at)).toBe(new Date(2026, 10, 6, 0, 0, 0).getTime())
  })

  it('says what is left, rounded up', () => {
    const now = 1_000_000
    expect(timeLeft(now + 23.5 * 60_000, now)).toBe('24 min left')
    expect(timeLeft(now + 1000, now)).toBe('1 min left')
    expect(timeLeft(now + 90 * 60_000, now)).toBe('2 h left')
  })
})
