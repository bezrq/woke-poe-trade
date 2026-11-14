// Covens Fates: invoking rules (duplicates, barred rewards, slot order) and
// the pick advice. The Stormcaller cases are from in-game screenshots.
import { describe, it, expect } from 'vitest'
import { advisePick, bestInvocation, defaultFateSettings, invoke, rankOutcomes } from '@/web/woke/fates/rank'
import type { FateCard, FateSettings } from '@/web/woke/fates/rank'
import { FATES, REWARD_ICONS } from '@/web/woke/fates/data'

const r = (icon: string, need = 1) => ({ icon, need })
const settings = (over: Partial<FateSettings> = {}): FateSettings => ({ ...defaultFateSettings(), ...over })

// Two Stormcallers collected in one area.
const stormA: FateCard = { fate: 'Stormcaller', tier: 1, rewards: [r('Currency'), r('Gloves')] }
const stormB: FateCard = { fate: 'Stormcaller', tier: 1, rewards: [r('Divination'), r('Mace'), r('IncreasedRarityAffectedMonster', 2)] }

const paid = (inv: ReturnType<typeof invoke>) => Object.fromEntries((inv?.payouts ?? []).map(p => [p.icon, p.paid]))

describe('invoking Fates', () => {
  it('pays each plain reward once', () => {
    const inv = invoke([stormA], settings())!
    expect(paid(inv)).toEqual({ Currency: 1, Gloves: 1 })
    expect(inv.fights).toEqual([{ fate: 'Stormcaller', tier: 1, tripled: false }])
  })

  it('a second copy triples the first copy, upgrades its tier and drops its own rewards', () => {
    const inv = invoke([stormA, stormB], settings())!
    expect(paid(inv)).toEqual({ Currency: 3, Gloves: 3 })
    expect(inv.fights).toEqual([{ fate: 'Stormcaller', tier: 2, tripled: true }])
  })

  it('order decides which copy is kept; a tripled barred reward leaves a part over', () => {
    const inv = invoke([stormB, stormA], settings())!
    // Rarity needs 2 parts: three parts pay once, one is left (grey in game).
    expect(paid(inv)).toEqual({ Divination: 3, Mace: 3, IncreasedRarityAffectedMonster: 1 })
    expect(inv.payouts.find(p => p.icon === 'IncreasedRarityAffectedMonster')!.parts).toBe(3)
  })

  it('refuses a third copy, more cards than slots, and tiers over your limit', () => {
    expect(invoke([stormA, stormB, stormA], settings())).toBeNull()
    expect(invoke([stormA, stormB], settings({ slots: 1 }))).toBeNull()
    expect(invoke([stormA, stormB], settings({ maxTier: { Stormcaller: 1 } }))).toBeNull()
  })

  it('a barred reward pays only when enough parts are invoked across Fates', () => {
    const a: FateCard = { fate: 'Dryad', tier: 1, rewards: [r('Currency', 3)] }
    const b: FateCard = { fate: 'Torchbearer', tier: 1, rewards: [r('Currency', 3)] }
    const c: FateCard = { fate: 'Tempest', tier: 1, rewards: [r('Currency', 3)] }
    expect(paid(invoke([a, b], settings()))).toEqual({ Currency: 0 })
    expect(paid(invoke([a, b, c], settings()))).toEqual({ Currency: 1 })
  })
})

describe('invoking: Sanguine and two Golemancers (in-game checks)', () => {
  // C1, C2, C3 as they sat in the collection; cards fill the slots in click order.
  const c1: FateCard = { fate: 'Sanguine', tier: 2, rewards: [r('Gold'), r('Gems', 2)] }
  const c2: FateCard = { fate: 'Golemancer', tier: 2, rewards: [r('Dagger'), r('Gems', 2)] }
  const c3: FateCard = { fate: 'Golemancer', tier: 2, rewards: [r('Gold'), r('Boots')] }

  it('two different Fates finish a shared barred reward', () => {
    expect(paid(invoke([c1, c2], settings()))).toEqual({ Gold: 1, Gems: 1, Dagger: 1 })
    expect(paid(invoke([c1, c3], settings()))).toEqual({ Gold: 2, Gems: 0, Boots: 1 })
  })

  it('the Golemancer clicked first is the one tripled, wherever Sanguine sits', () => {
    expect(paid(invoke([c1, c3, c2], settings()))).toEqual({ Gold: 4, Gems: 0, Boots: 3 })
    expect(paid(invoke([c2, c3, c1], settings()))).toEqual({ Dagger: 3, Gems: 2, Gold: 1 })
    expect(paid(invoke([c3, c2, c1], settings()))).toEqual({ Gold: 4, Boots: 3, Gems: 0 })
  })

  it('lists each different result once, with its click order, best first', () => {
    const s = settings({ values: { Gold: 3, Boots: 2, Dagger: 2, Gems: 3 } })
    const list = rankOutcomes([c1, c2, c3], s)
    const show = (o: typeof list[number]) => o.clicks.map(i => `C${i + 1}`).join('>') + ' ' +
      o.invocation.payouts.filter(p => p.paid).map(p => `${p.icon}x${p.paid}`).join(' ')
    // Equal value goes to fewer fights: the Golemancer pair without Sanguine.
    expect(list.slice(0, 3).map(show)).toEqual([
      'C1>C3>C2 Goldx4 Bootsx3',
      'C3>C2 Goldx3 Bootsx3',
      'C1>C2>C3 Goldx1 Gemsx2 Daggerx3'
    ])
    expect(new Set(list.map(show)).size).toBe(list.length)
  })
})

describe('best invocation', () => {
  it('puts the better copy first', () => {
    const s = settings({ values: { Currency: 10, Gloves: 1, Divination: 2, Mace: 1, IncreasedRarityAffectedMonster: 1 } })
    const best = bestInvocation([stormB, stormA], s)
    expect(best.order[0]).toBe(stormA)
    expect(best.value).toBe(33)
  })

  it('skips a Fate over your tier limit', () => {
    const s = settings({ maxTier: { Stormcaller: 1 } })
    const best = bestInvocation([stormA, stormB], s)
    expect(best.order).toHaveLength(1)
  })
})

describe('pick advice', () => {
  // The pick from the screenshot: Stormcaller A already collected.
  const dryad: FateCard = { fate: 'Dryad', tier: 1, rewards: [r('Ring')] }
  const torch: FateCard = { fate: 'Torchbearer', tier: 1, rewards: [r('Currency')] }

  it('takes the duplicate that triples Currency over a single Currency', () => {
    const advice = advisePick([stormA], [dryad, stormB, torch], settings())
    expect(advice[0].card).toBe(stormB)
    expect(advice[0].reasons[0]).toMatch(/Triples Stormcaller/)
    expect(advice.map(a => a.card.fate)).toEqual(['Stormcaller', 'Torchbearer', 'Dryad'])
  })

  it('marks a Fate you already hold twice as not allowed', () => {
    const advice = advisePick([stormA, stormB], [stormA, torch], settings())
    expect(advice.find(a => a.card === stormA)!.allowed).toBe(false)
    expect(advice[0].card).toBe(torch)
  })

  it('values a step towards a barred reward', () => {
    const have: FateCard = { fate: 'Dryad', tier: 1, rewards: [r('Divination', 3)] }
    const step: FateCard = { fate: 'Tempest', tier: 1, rewards: [r('Divination', 3)] }
    const plain: FateCard = { fate: 'Rot', tier: 1, rewards: [r('Gold', 3)] }
    const advice = advisePick([have], [plain, step], settings())
    expect(advice[0].card).toBe(step)
  })
})

describe('Fate data', () => {
  it('has the 25 Fates with three tiers each and the reward icons', () => {
    expect(FATES).toHaveLength(25)
    expect(FATES.every(f => f.tiers.length === 3)).toBe(true)
    expect(FATES.find(f => f.id === 'Stormcaller')!.summary).toBe('Creates leylines of lightning')
    expect(REWARD_ICONS.map(i => i.icon)).toContain('Currency')
  })
})
