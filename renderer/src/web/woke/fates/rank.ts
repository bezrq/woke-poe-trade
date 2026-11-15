// Covens of Umbra Fates: which Fates to invoke at an area boss, and which
// offered Fate to take after an encounter.
//
// The rules, from the game's own help text and checked on screenshots:
// - Up to three Fates are invoked at the boss (fewer until Mora unlocks the
//   slots).
// - A Fate can be claimed at most twice per area. Invoking the second copy
//   uses a slot, upgrades the copy placed first by a tier and triples its
//   rewards, and the second copy's own rewards are lost. So with two copies,
//   order matters: the better-rewarded copy goes first.
// - Some reward icons have a 2- or 3-part bar under them. They only pay out
//   once that many parts are invoked across all Fates; a tripled copy counts
//   three parts. Leftover parts pay nothing.
// - Fates not invoked are lost on leaving the area.

export interface FateReward {
  // Reward icon name, as in REWARD_ICONS (Currency, Divination, Ring, ...).
  icon: string
  // Parts needed to pay out: 1 for a plain icon, 2 or 3 for a barred one.
  need: number
  // Gear rewards: the modifier their items have ("Speed", "no Attack"), from
  // the reward's tooltip. Same icon either way, so unknown until hovered.
  mod?: string | null
}

export interface FateCard {
  // Fate id, as in FATES (Stormcaller, BlackFrost, ...).
  fate: string
  tier: number
  rewards: FateReward[]
}

export interface FateSettings {
  // Worth of one paid-out reward, per icon. Icons not listed are worth DEFAULT_VALUE.
  values: Record<string, number>
  // Highest tier you'll fight, per Fate; 0 means never. Fates not listed: any tier.
  maxTier: Record<string, number>
  slots: number
  // Added to a gear reward's worth for its modifier.
  modValues?: Record<string, number>
}

export const DEFAULT_VALUE = 0.05

// Worth to the player, not how rare, from 0 to 2. A rare item (DEFAULT_VALUE)
// is 0.05, plus its modifier.
export const DEFAULT_VALUES: Record<string, number> = {
  UniqueAuguryItem: 0.75,
  ExceptionalGems: 0.75,
  Currency: 0.5,
  Divination: 0.5,
  Transformative: 0.3,
  Viscera: 0.3,
  UniqueJewel: 0.25,
  Threads: 0.15,
  Essences: 0.2,
  IncreasedRarityAffectedMonster: 0.2,
  Maps: 0.2,
  Gold: 0.1,
  Gems: 0.1,
  UniqueWeapon: 0.1,
  UniqueArmour: 0.1,
  UniqueJewellery: 0.1,
  UniqueFlask: 0.05
}

// Gear modifiers the rewards can have, as the game words them.
export const GEAR_MODS = ['Speed', 'Physical', 'Critical', 'Elemental', 'Chaos', 'Gem', 'Life', 'Resistance', 'Attack', 'Damage',
  'Defence', 'Attribute', 'Mana', 'Drop', 'Angling', 'no Attack', 'no Defence', 'no Elemental', 'no Life', 'no Physical']

// Added to a rare item's 0.05, so the best gear is still under Currency.
export const DEFAULT_MOD_VALUES: Record<string, number> = {
  'Speed': 0.15,
  'Physical': 0.15,
  'Gem': 0.15,
  'Critical': 0.1,
  'Elemental': 0.1,
  'Life': 0.05,
  'Resistance': 0.05,
  'Chaos': 0.05,
  'Attack': 0.02,
  'Damage': 0.02,
  'Defence': 0.02,
  'Attribute': 0.02,
  'Mana': 0.02,
  'Drop': 0.02,
  'Angling': 0,
  'no Attack': 0,
  'no Defence': 0,
  'no Elemental': 0,
  'no Life': 0,
  'no Physical': 0
}

// Bumped when the defaults above change, so saved copies of old ones are replaced.
export const WEIGHTS_VERSION = 4

// Reward icons for gear, which come with a modifier.
export const GEAR_ICONS = new Set(['Boots', 'Helmet', 'BodyArmour', 'Gloves', 'Shield', 'Claw', 'Staff', 'Wand', 'Sword', 'Sceptre', 'Quiver',
  'Ring', 'Amulet', 'Belt', 'Axe', 'Bow', 'Dagger', 'Mace', 'FishingRod', 'RareWeapon'])

export function defaultFateSettings (): FateSettings {
  return { values: { ...DEFAULT_VALUES }, maxTier: {}, slots: 3, modValues: { ...DEFAULT_MOD_VALUES } }
}

export interface Payout {
  icon: string
  need: number
  mod?: string | null
  // Parts invoked, and how many rewards they pay.
  parts: number
  paid: number
}

export interface Invocation {
  // The cards in slot order, duplicates included.
  order: FateCard[]
  // Each invoked Fate after upgrades: the tier you'd fight.
  fights: Array<{ fate: string, tier: number, tripled: boolean }>
  payouts: Payout[]
  value: number
}

const valueOf = (s: FateSettings, icon: string, mod?: string | null) =>
  (s.values[icon] ?? DEFAULT_VALUE) + (mod ? s.modValues?.[mod] ?? DEFAULT_MOD_VALUES[mod] ?? 0 : 0)

// What a slot order pays, or null if it breaks a rule or your tier limits.
export function invoke (order: FateCard[], s: FateSettings): Invocation | null {
  if (order.length > s.slots) return null
  const first = new Map<string, { card: FateCard, tier: number, tripled: boolean }>()
  for (const card of order) {
    const seen = first.get(card.fate)
    if (!seen) {
      first.set(card.fate, { card, tier: card.tier, tripled: false })
    } else if (!seen.tripled) {
      seen.tier = Math.min(seen.tier + 1, 3)
      seen.tripled = true
    } else {
      return null
    }
  }
  const parts = new Map<string, Payout>()
  const fights: Invocation['fights'] = []
  for (const { card, tier, tripled } of first.values()) {
    const limit = s.maxTier[card.fate] ?? 3
    if (tier > limit) return null
    fights.push({ fate: card.fate, tier, tripled })
    for (const r of card.rewards) {
      // Gear with different modifiers is a different reward.
      const key = `${r.icon}/${r.need}/${r.mod ?? ''}`
      const p = parts.get(key) ?? { icon: r.icon, need: r.need, mod: r.mod ?? null, parts: 0, paid: 0 }
      p.parts += tripled ? 3 : 1
      parts.set(key, p)
    }
  }
  let value = 0
  const payouts = [...parts.values()]
  for (const p of payouts) {
    p.paid = Math.floor(p.parts / Math.max(p.need, 1))
    value += p.paid * valueOf(s, p.icon, p.mod)
  }
  return { order, fights, payouts, value }
}

// Leftover parts of barred rewards, valued at their share of a full reward:
// a hint of what a later Fate could finish, used only when picking.
export function openParts (inv: Invocation, s: FateSettings): number {
  let v = 0
  for (const p of inv.payouts) {
    const left = p.parts - p.paid * p.need
    if (left > 0) v += valueOf(s, p.icon, p.mod) * left / p.need
  }
  return v
}

// Every slot order of up to `slots` cards from the collection. Collections
// are a handful of cards, so trying them all is cheap.
function * orders (cards: FateCard[], slots: number, taken: boolean[] = [], prefix: FateCard[] = []): Generator<FateCard[]> {
  yield prefix
  if (prefix.length === slots) return
  for (let i = 0; i < cards.length; i++) {
    if (taken[i]) continue
    taken[i] = true
    yield * orders(cards, slots, taken, [...prefix, cards[i]])
    taken[i] = false
  }
}

const EMPTY: Invocation = { order: [], fights: [], payouts: [], value: 0 }

// The best slot order for a collection. Ties go to fewer, lower-tier fights.
// With `withOpen`, part-done barred rewards count for half their share, which
// is how picks are judged: they may still be finished by a later Fate.
export function bestInvocation (collection: FateCard[], s: FateSettings, withOpen = false): Invocation {
  const worth = (inv: Invocation) => inv.value + (withOpen ? openParts(inv, s) / 2 : 0)
  let best = EMPTY
  for (const order of orders(collection, Math.min(s.slots, 3))) {
    const inv = invoke(order, s)
    if (!inv) continue
    if (worth(inv) > worth(best) || (worth(inv) === worth(best) && danger(inv) < danger(best))) best = inv
  }
  return best
}

const danger = (inv: Invocation) => inv.fights.reduce((sum, f) => sum + f.tier, 0)

export interface Outcome {
  // Collection positions to click, in order (0 is the leftmost card, C1).
  clicks: number[]
  invocation: Invocation
}

// Every different reward result the collection can give, best first, each with
// the click order that gets it. Cards fill the slots left to right as they're
// clicked, so a click order is a slot order. Orders paying the same rewards are
// one outcome, kept with the fewest and lowest-tier fights.
export function rankOutcomes (collection: FateCard[], s: FateSettings, limit = 8): Outcome[] {
  const byPay = new Map<string, Outcome>()
  for (const order of orders(collection, Math.min(s.slots, 3))) {
    if (!order.length) continue
    const inv = invoke(order, s)
    if (!inv || inv.value <= 0) continue
    const key = inv.payouts.filter(p => p.paid).map(p => `${p.icon}/${p.need}/${p.mod ?? ''}x${p.paid}`).sort().join(' ')
    const had = byPay.get(key)
    if (had && (danger(had.invocation) < danger(inv) || (danger(had.invocation) === danger(inv) && had.clicks.length <= order.length))) continue
    byPay.set(key, { clicks: order.map(c => collection.indexOf(c)), invocation: inv })
  }
  return [...byPay.values()]
    .sort((a, b) => b.invocation.value - a.invocation.value || danger(a.invocation) - danger(b.invocation))
    .slice(0, limit)
}

export interface PickAdvice {
  card: FateCard
  index: number
  // False when you already hold two of this Fate, or it's over your tier limit.
  allowed: boolean
  // Best invocation if you take this card, and its gain over not taking it.
  invocation: Invocation
  gain: number
  // Gain plus half the value of barred rewards left part-way.
  score: number
  reasons: string[]
}

// Ranks the offered Fates: what each adds to the best invocation you could
// make with what you've already collected in this area.
export function advisePick (collection: FateCard[], offers: FateCard[], s: FateSettings, name: (icon: string) => string = i => i): PickAdvice[] {
  const base = bestInvocation(collection, s, true)
  const baseScore = base.value + openParts(base, s) / 2
  const held = (fate: string) => collection.filter(c => c.fate === fate).length
  const advice = offers.map((card, index) => {
    const allowed = held(card.fate) < 2 && (s.maxTier[card.fate] ?? 3) >= card.tier
    const invocation = allowed ? bestInvocation([...collection, card], s, true) : base
    const gain = invocation.value - base.value
    const score = allowed ? invocation.value + openParts(invocation, s) / 2 - baseScore : -Infinity
    return { card, index, allowed, invocation, gain, score, reasons: allowed ? explain(base, invocation, card, name) : [held(card.fate) >= 2 ? 'Already have two' : 'Over your tier limit'] }
  })
  return advice.sort((a, b) => b.score - a.score || a.index - b.index)
}

// Short reasons a pick helps, from the change in the best invocation.
export function explain (before: Invocation, after: Invocation, card: FateCard, name: (icon: string) => string = i => i): string[] {
  const out: string[] = []
  const was = new Map(before.fights.map(f => [f.fate, f]))
  for (const f of after.fights) {
    if (f.fate === card.fate && f.tripled && !was.get(f.fate)?.tripled) out.push(`Triples ${f.fate}'s rewards (tier ${f.tier})`)
  }
  const paidBefore = new Map(before.payouts.map(p => [`${p.icon}/${p.need}/${p.mod ?? ''}`, p.paid]))
  for (const p of after.payouts) {
    const more = p.paid - (paidBefore.get(`${p.icon}/${p.need}/${p.mod ?? ''}`) ?? 0)
    const n = p.mod ? `${name(p.icon)} (${p.mod})` : name(p.icon)
    if (more > 0) out.push(p.need > 1 ? `Completes ${n} (${p.need}/${p.need})` + (more > 1 ? ` x${more}` : '') : `+${more} ${n}`)
    else if (p.need > 1 && p.parts % p.need && card.rewards.some(x => x.icon === p.icon && x.need === p.need)) out.push(`${n} ${p.parts % p.need}/${p.need}`)
  }
  if (!out.length && !after.order.includes(card)) out.push('Not worth invoking with what you have')
  return out
}
