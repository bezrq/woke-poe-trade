import { describe, expect, it } from 'vitest'
import { dataAge } from '@/web/woke/price-insight/data-age'

const NOW = Date.parse('2026-11-05T12:00:00Z')
const MIN = 60_000

describe('dataAge', () => {
  it('shows the rate and how old it is', () => {
    expect(dataAge(180.4, NOW - 14 * MIN, NOW)).toEqual({ text: '1 div = 180c · poe.ninja 14m ago', stale: false })
    expect(dataAge(180, NOW - 5000, NOW)?.text).toContain('just now')
  })

  it('warns once loads have been failing for hours', () => {
    const age = dataAge(180, NOW - 360 * MIN, NOW)!
    expect(age.stale).toBe(true)
    expect(age.text).toContain('6h')
    expect(dataAge(180, NOW - 119 * MIN, NOW)?.stale).toBe(false)
  })

  it('does not warn while a new load is on its way', () => {
    const age = dataAge(180, NOW - 360 * MIN, NOW, true)!
    expect(age.stale).toBe(false)
    expect(age.text).toContain('updating')
  })

  it('says nothing with no rate or no load yet', () => {
    expect(dataAge(undefined, NOW, NOW)).toBeNull()
    expect(dataAge(180, null, NOW)).toBeNull()
  })
})
