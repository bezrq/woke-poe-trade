// Turns a read of a Fate window into what the overlay shows: a mark on each
// offered card, C1, C2... on the collected ones, and a list of click orders
// with the rewards each pays.
import { advisePick, rankOutcomes } from './rank'
import type { FateCard, FateSettings, Invocation } from './rank'
import { FATES } from './data'
import type { FateRead, FateReadCard } from './widget'

export interface RewardChip { icon: string, count: number, need: number }

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

export function fateName (id: string): string {
  return FATES.find(f => f.id === id)?.name ?? id
}

const toCard = (c: FateReadCard): FateCard => ({ fate: c.fate, tier: c.tier, rewards: c.rewards.map(r => ({ icon: r.icon, need: r.need })) })

function chips (inv: Invocation): { rewards: RewardChip[], open: RewardChip[] } {
  const rewards = inv.payouts.filter(p => p.paid).map(p => ({ icon: p.icon, count: p.paid, need: p.need }))
  const open = inv.payouts.filter(p => p.parts % p.need).map(p => ({ icon: p.icon, count: p.parts % p.need, need: p.need }))
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
    const advice = advisePick(heldCards, offerCards, s)
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
