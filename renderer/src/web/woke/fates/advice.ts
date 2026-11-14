// Turns a read of a Fate window into what the overlay shows: a mark on each
// offered card, C1, C2... on the collected ones, and a list of click orders
// with the rewards each pays.
import { GEAR_ICONS, advisePick, rankOutcomes } from './rank'
import type { FateCard, FateSettings, Invocation } from './rank'
import { FATES } from './data'
import type { FateRead, FateReadCard } from './widget'

export interface RewardChip {
  icon: string
  count: number
  need: number
  // Gear: the modifier, once read off the reward's tooltip.
  mod: string | null
  // Gear whose modifier hasn't been read yet.
  unknown: boolean
}

export interface AdviceRow {
  // "Take Stormcaller" on a pick; empty on Invoke Fates.
  title: string
  // Cards to click in order: "C1", "C3", or "New" for the offered card.
  clicks: string[]
  rewards: RewardChip[]
  // Part-done barred rewards left over (shown faded).
  open: RewardChip[]
  value: number
  // The tiers you'd fight, after upgrades.
  fights: Array<{ fate: string, tier: number }>
}

export interface CardMark {
  card: FateReadCard
  label: string
  // 1 is the pick to take; null for collected cards.
  rank: number | null
  reasons: string[]
  allowed: boolean
}

export interface FateAdvice {
  window: 'pick' | 'invoke'
  marks: CardMark[]
  rows: AdviceRow[]
  // Fates already placed in the slots: their rewards aren't shown, so they
  // can't be counted.
  placed: number
}

// Short name of a reward icon, for reasons on the cards.
const ICON_NAMES: Record<string, string> = {
  IncreasedRarityAffectedMonster: 'Rarity',
  UniqueAuguryItem: 'Covens Unique',
  ExceptionalGems: 'Exceptional Gem',
  Divination: 'Stacked Decks'
}
export function rewardName (icon: string): string {
  return ICON_NAMES[icon] ?? icon.replace(/([a-z])([A-Z])/g, '$1 $2')
}
export function fateName (id: string): string {
  return FATES.find(f => f.id === id)?.name ?? id
}

// Gear modifiers read off hovered rewards, per card (its Fate, tier and
// rewards), kept for the session: a card keeps them when it moves from the
// pick into the collection, and on to Invoke Fates.
const remembered = new Map<string, Array<string | null>>()
const cardKey = (c: FateReadCard) => `${c.fate}|${c.tier}|${c.rewards.map(r => `${r.icon}/${r.need}`).join(',')}`

// Keeps the modifiers a read found (a sweep, or the hovered reward). Returns a
// line saying what was learned, or null.
export function rememberHover (read: Extract<FateRead, { found: true }>): string | null {
  const found = [...(read.mods ?? []), ...(read.hover ? [read.hover] : [])]
  let learned = 0
  let last = ''
  for (const h of found) {
    const card = read.cards[h.card]
    if (!card || !h.modifier) continue
    const key = cardKey(card)
    const mods = remembered.get(key) ?? card.rewards.map(() => null)
    mods[h.reward] = h.modifier
    remembered.set(key, mods)
    learned++
    last = `${rewardName(card.rewards[h.reward].icon)}: ${h.modifier} modifier`
  }
  if (!learned) return null
  return learned === 1 ? last : `Read ${learned} gear modifiers`
}

export function forgetHovers () { remembered.clear() }

const toCard = (c: FateReadCard): FateCard => {
  const mods = remembered.get(cardKey(c))
  return { fate: c.fate, tier: c.tier, rewards: c.rewards.map((r, i) => ({ icon: r.icon, need: r.need, mod: mods?.[i] ?? null })) }
}

function chips (inv: Invocation): { rewards: RewardChip[], open: RewardChip[] } {
  const chip = (icon: string, count: number, need: number, mod: string | null | undefined) =>
    ({ icon, count, need, mod: mod ?? null, unknown: GEAR_ICONS.has(icon) && !mod })
  const rewards = inv.payouts.filter(p => p.paid).map(p => chip(p.icon, p.paid, p.need, p.mod))
  const open = inv.payouts.filter(p => p.parts % p.need).map(p => chip(p.icon, p.parts % p.need, p.need, p.mod))
  return { rewards: rewards.sort((a, b) => b.count - a.count), open }
}

function row (title: string, inv: Invocation, label: (c: FateCard) => string): AdviceRow {
  return { title, clicks: inv.order.map(label), ...chips(inv), value: inv.value, fights: inv.fights.map(f => ({ fate: f.fate, tier: f.tier })) }
}

export function adviseFates (read: Extract<FateRead, { found: true }>, s: FateSettings): FateAdvice {
  const byX = (a: FateReadCard, b: FateReadCard) => a.x - b.x
  const held = read.cards.filter(c => c.role === 'held').sort(byX)
  const offers = read.cards.filter(c => c.role === 'offer').sort(byX)
  const placed = read.cards.filter(c => c.role === 'slot').length
  const heldCards = held.map(toCard)
  const label = (c: FateCard, extra?: FateCard) => c === extra ? 'New' : `C${heldCards.indexOf(c) + 1}`
  const marks: CardMark[] = held.map((card, i) => ({ card, label: `C${i + 1}`, rank: null, reasons: [], allowed: true }))

  if (read.window === 'pick') {
    const offerCards = offers.map(toCard)
    const advice = advisePick(heldCards, offerCards, s, rewardName)
    const rows: AdviceRow[] = []
    advice.forEach((a, i) => {
      const card = offers[offerCards.indexOf(a.card)]
      marks.push({ card, label: '', rank: a.allowed ? i + 1 : null, reasons: a.reasons, allowed: a.allowed })
      if (a.allowed && a.invocation.order.length) rows.push(row(`Take ${fateName(a.card.fate)}`, a.invocation, c => label(c, a.card)))
    })
    return { window: 'pick', marks, rows, placed }
  }
  const rows = rankOutcomes(heldCards, s).map(o => row('', o.invocation, c => label(c)))
  return { window: 'invoke', marks, rows, placed }
}
