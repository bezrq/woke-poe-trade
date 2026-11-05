// The Credits page lists every outside project once, each with a working kind
// of link and a line on what we use it for.
import { describe, it, expect } from 'vitest'
import { CREDIT_GROUPS, CREDIT_NAMES } from '@/web/woke/settings/credits'

const all = CREDIT_GROUPS.flatMap(g => g.credits)

describe('Credits', () => {
  it('gives every project a name, an https link and its use', () => {
    for (const c of all) {
      expect(c.name.trim()).not.toBe('')
      expect(c.url).toMatch(/^https:\/\//)
      expect(c.use.trim()).not.toBe('')
    }
  })

  it('lists each project once', () => {
    expect(new Set(CREDIT_NAMES).size).toBe(CREDIT_NAMES.length)
  })

  it('shows the fork base first, with its license', () => {
    expect(CREDIT_GROUPS[0].credits[0]).toMatchObject({ name: 'Awakened PoE Trade', license: 'MIT' })
  })

  it('states the license of what we copy into the app', () => {
    const copied = ['exile-leveling', 'GemCheck', 'NeverSink filter']
    for (const name of copied) {
      expect(all.find(c => c.name === name)?.license).toBe('MIT')
    }
  })
})
