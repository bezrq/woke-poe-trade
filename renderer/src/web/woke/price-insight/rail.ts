// The verdict card's price scale: up to three named prices on one line, each
// with its label under its own mark. Pure, so the layout rules can be tested.

export interface RailInput {
  /** Cheapest trusted listing. */
  low: number
  /** The price the card headlines. */
  likely: number
  /** Top of the listings' range. */
  high: number
  /** poe.ninja's price, when it has one. Takes the place of the top of the range. */
  ninja?: number | null
  /** poe.ninja looks faked here, so its price isn't counted. */
  ninjaSuspect?: boolean
}

export interface RailMark {
  chaos: number
  label: string
  kind: 'plain' | 'likely' | 'ninja'
  /** Where the mark sits, 0..100. */
  x: number
  /** How the label hangs off the mark, so end labels stay inside the card. */
  align: 'start' | 'center' | 'end'
}

// Prices this close would draw on top of each other: one mark, both names.
const SAME_RATIO = 1.02
// A middle label stays clear of the end labels: roughly how much of the rail one
// character of label takes, plus half the middle label.
const LABEL_CHAR = 1.3
const LABEL_GAP = 10

export function railMarks (input: RailInput): RailMark[] {
  const raw: Array<Pick<RailMark, 'chaos' | 'label' | 'kind'>> = [
    { chaos: input.low, label: 'Cheapest', kind: 'plain' },
    { chaos: input.likely, label: 'Typical', kind: 'likely' },
    input.ninja && input.ninja > 0
      ? { chaos: input.ninja, label: input.ninjaSuspect ? 'poe.ninja, not counted' : 'poe.ninja', kind: 'ninja' }
      : { chaos: input.high, label: 'Top of range', kind: 'plain' }
  ]
  const sorted = raw.filter(m => m.chaos > 0).sort((a, b) => a.chaos - b.chaos)

  const merged: typeof raw = []
  for (const m of sorted) {
    const prev = merged[merged.length - 1]
    if (prev && m.chaos / prev.chaos <= SAME_RATIO) {
      prev.label = `${prev.label}, ${m.label.toLowerCase()}`
      if (m.kind === 'likely' || (m.kind === 'ninja' && prev.kind === 'plain')) prev.kind = m.kind
    } else {
      merged.push({ ...m })
    }
  }
  if (merged.length < 2) return []

  // Prices spread multiplicatively, so a log scale keeps 20, 85 and 146 readable.
  const lo = Math.log(merged[0].chaos)
  const hi = Math.log(merged[merged.length - 1].chaos)
  return merged.map((m, i): RailMark => {
    if (i === 0) return { ...m, x: 0, align: 'start' }
    if (i === merged.length - 1) return { ...m, x: 100, align: 'end' }
    const x = (Math.log(m.chaos) - lo) / (hi - lo) * 100
    const min = merged[0].label.length * LABEL_CHAR + LABEL_GAP
    const max = 100 - merged[merged.length - 1].label.length * LABEL_CHAR - LABEL_GAP
    return { ...m, x: Math.min(Math.max(x, min), max), align: 'center' }
  })
}
