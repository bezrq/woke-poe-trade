// A trade listing shown in the shared item tooltip, from what the trade site
// sends with each listing.
import { describe, expect, it } from 'vitest'
import { listingTipItem } from '@/web/woke/price-insight/listing-tip'

describe('listingTipItem', () => {
  it('draws a corrupted unique with its mods, defences and sockets', () => {
    const item = listingTipItem({
      name: 'Kaom\'s Heart',
      typeLine: 'Glorious Plate',
      frameType: 3,
      ilvl: 86,
      corrupted: true,
      implicitMods: ['+1 to Level of Socketed Gems'],
      explicitMods: ['37% increased Fire Damage', '+500 to maximum Life'],
      sockets: [{ group: 0, sColour: 'R' }],
      properties: [{ name: 'Armour', values: [['1,013', 1]] }, { name: 'Quality', values: [['+20%', 1]] }]
    })!
    expect(item).toMatchObject({
      rarity: 'UNIQUE',
      name: 'Kaom\'s Heart',
      base: 'Glorious Plate',
      implicits: ['+1 to Level of Socketed Gems'],
      mods: ['37% increased Fire Damage', '+500 to maximum Life'],
      sockets: 'R',
      armour: 1013,
      quality: 20,
      itemLevel: 86,
      corrupted: true
    })
  })

  it('keeps fractured and crafted mods marked, in game order', () => {
    const item = listingTipItem({
      frameType: 2,
      typeLine: 'Two-Stone Ring',
      fracturedMods: ['+60 to maximum Life'],
      explicitMods: ['+40% to Fire Resistance'],
      craftedMods: ['+20% to Cold Resistance'],
      influences: { elder: true }
    })!
    expect(item.mods).toEqual(['+60 to maximum Life', '+40% to Fire Resistance', '+20% to Cold Resistance'])
    expect(item.modKinds).toEqual(['fractured', '', 'crafted'])
    expect(item.influences).toEqual(['Elder'])
  })

  it('groups linked sockets and puts enchants with implicits', () => {
    const item = listingTipItem({
      frameType: 2,
      enchantMods: ['Added Small Passive Skills grant: 12% increased Fire Damage'],
      implicitMods: ['+10 to Strength'],
      sockets: [{ group: 0, sColour: 'R' }, { group: 0, sColour: 'G' }, { group: 1, sColour: 'B' }]
    })!
    expect(item.sockets).toBe('R-G B')
    expect(item.implicits[0]).toContain('Added Small Passive')
  })

  it('shows nothing for what has no mods', () => {
    expect(listingTipItem({ frameType: 4, typeLine: 'Enlighten Support', explicitMods: ['x'] })).toBeNull()
    expect(listingTipItem({ frameType: 5, typeLine: 'Chaos Orb' })).toBeNull()
    expect(listingTipItem({ frameType: 0, typeLine: 'Iron Ring' })).toBeNull()
    expect(listingTipItem({})).toBeNull()
  })
})
