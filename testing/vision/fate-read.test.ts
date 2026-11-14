// Reading the Covens Fate windows from real screenshots of a 3440x1100 game
// window (Snipping Tool crops, blacked out around the window): which Fates,
// their tier and reward icons, barred rewards, and which window it is. The crops
// are smaller than the window, so the window's height goes in as the UI scale.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { decodePng } from '../fake-host/png'
import { readFates } from '../../main/src/woke/fate-read'
import type { FateReadCard } from '../../main/src/woke/fate-read'

const SCREENS = path.resolve(__dirname, '../fixtures/screens')
const WINDOW_HEIGHT = 1100

function read (file: string) {
  const img = decodePng(fs.readFileSync(path.join(SCREENS, file)))
  const data = new Uint8Array(img.width * img.height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = img.data[i + 2]
    data[i + 1] = img.data[i + 1]
    data[i + 2] = img.data[i]
    data[i + 3] = 255
  }
  return readFates(data, img.width, img.height, WINDOW_HEIGHT / img.height)
}

// "Fate tier: icon icon/2 ..." per card, top row first.
const brief = (c: FateReadCard) => `${c.role} ${c.fate} ${c.tier}: ` + c.rewards.map(r => r.need > 1 ? `${r.icon}/${r.need}` : r.icon).join(' ')

describe('Fate windows', () => {
  it('reads a pick: three offers and the Fate already held', () => {
    const r = read('fates-pick-stormcaller.png')
    expect(r.found && r.window).toBe('pick')
    expect(r.found && r.cards.map(brief)).toEqual([
      'offer Dryad 2: Ring',
      'offer Stormcaller 2: Divination Mace IncreasedRarityAffectedMonster/2',
      'offer Torchbearer 2: Currency',
      'held Stormcaller 2: Currency Gloves'
    ])
  })

  it('reads a pick with nothing held yet', () => {
    const r = read('fates-pick-sanguine.png')
    expect(r.found && r.cards.map(brief)).toEqual([
      'offer Sanguine 2: Gold Gems/2',
      'offer Gravewalker 2: Boots',
      'offer Deathbringer 2: Mace Wand'
    ])
  })

  it('reads a coven boss Fate and shows held parts on a barred reward', () => {
    const r = read('fates-pick-pestilent.png')
    expect(r.found && r.cards.map(brief)).toEqual([
      'offer Pestilent 2: UniqueWeapon Staff Currency/2',
      'offer BloodMoon 2: Bow BodyArmour',
      'offer Golemancer 2: Dagger Gems/2',
      'held Sanguine 2: Gold Gems/2'
    ])
    // The held Sanguine has a Gems part, so the offered Gems shows one filled.
    const gems = r.found ? r.cards[2].rewards[1] : null
    expect(gems).toMatchObject({ icon: 'Gems', need: 2, filled: 1 })
  })

  it('reads two held Fates under the offers', () => {
    const r = read('fates-pick-two-held.png')
    expect(r.found && r.cards.map(brief)).toEqual([
      'offer Gravewalker 2: BodyArmour',
      'offer Bloodthirsty 2: Currency Currency/2',
      'offer Golemancer 2: Gold Boots',
      'held Sanguine 2: Gold Gems/2',
      'held Golemancer 2: Dagger Gems/2'
    ])
  })

  it('reads Invoke Fates with nothing placed', () => {
    const r = read('fates-invoke-three-held.png')
    expect(r.found && r.window).toBe('invoke')
    expect(r.found && r.cards.map(brief)).toEqual([
      'held Sanguine 2: Gold Gems/2',
      'held Golemancer 2: Dagger Gems/2',
      'held Golemancer 2: Gold Boots'
    ])
    const r2 = read('fates-invoke-empty.png')
    expect(r2.found && r2.cards.map(brief)).toEqual([
      'held Stormcaller 2: Currency Gloves',
      'held Stormcaller 2: Divination Mace IncreasedRarityAffectedMonster/2'
    ])
  })

  it('tells a placed Fate from a held one, and sees the upgrade from a duplicate', () => {
    const r = read('fates-invoke-one.png')
    expect(r.found && r.cards.map(brief)).toEqual([
      'slot Stormcaller 2: ',
      'held Stormcaller 2: Divination Mace IncreasedRarityAffectedMonster/2'
    ])
    const dup = read('fates-invoke-duplicate.png')
    expect(dup.found && dup.cards.map(brief)).toEqual(['slot Stormcaller 3: '])
  })

  it('works out the UI scale from the window height', () => {
    const r = read('fates-pick-sanguine.png')
    expect(r.found && r.scale).toBeGreaterThan(0.95)
    expect(r.found && r.scale).toBeLessThan(1.05)
  })
})
