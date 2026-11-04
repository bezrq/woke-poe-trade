// Builds an in-game stash search string for maps, like poe.re: each picked
// mod becomes the shortest piece of its text that no other map mod contains.
//
// PoE search rules this relies on: the search is case-insensitive, space-
// separated "quoted terms" must all match, `|` inside a term is OR, and a
// leading `!` negates the whole term.

// PoE's search box accepts at most 250 characters.
export const MAX_SEARCH_LENGTH = 250

export interface MapRegexInput {
  avoid: string[]
  want: string[]
  mins: Partial<Record<MinStat, number>>
  // 'good' highlights maps you can run; 'bad' highlights maps with avoided mods.
  highlight: 'good' | 'bad'
}

export type MinStat = 'quantity' | 'rarity' | 'packSize' | 'quality' | 'currency' | 'scarabs' | 'maps' | 'divCards'

// The tail of each map property line ("Item Quantity: +112%"), picked so it
// matches only that line. `.` stands in for the `+`.
const MIN_PREFIX: Record<MinStat, string> = {
  quantity: 'tity: .',
  rarity: 'rity: .',
  packSize: 'ze: .',
  quality: 'lity: .',
  currency: 'ncy: .',
  scarabs: 'abs: .',
  maps: 'aps: .',
  divCards: 'rds: .'
}

export const MIN_LABELS: Record<MinStat, string> = {
  quantity: 'Item quantity',
  rarity: 'Item rarity',
  packSize: 'Pack size',
  quality: 'Quality',
  currency: 'More currency',
  scarabs: 'More scarabs',
  maps: 'More maps',
  divCards: 'More div cards'
}

// Non-mod text on a map tooltip; mod tokens must not match it.
export const TOOLTIP_LINES = [
  'item class: maps',
  'rarity: rare',
  'rarity: magic',
  'rarity: normal',
  'map tier: 16',
  'item quantity: +100%',
  'item rarity: +100%',
  'monster pack size: +100%',
  'quality: +20%',
  'more currency: +100%',
  'more scarabs: +100%',
  'more maps: +100%',
  'more divination cards: +100%',
  'item level: 83',
  'corrupted',
  'unidentified',
  'travel to this map by using it in a personal map device. maps can only be used once.',
  'delirium reward type',
  'map'
]

// "#% increased Pack size" -> lowercase text split at the rolled numbers.
function segments (matcher: string): string[] {
  return matcher.toLowerCase().split(/[#0-9+%-]+/).map(s => s.trim()).filter(Boolean)
}

function usable (token: string): boolean {
  // Leading/trailing spaces are fragile, and quotes/regex characters would
  // need escaping.
  return token.length >= 3 && token.trim() === token && !/["|!\\.*?()[\]{}^$]/.test(token)
}

// Shortest substring of `target` found in none of `others`.
export function uniqueToken (target: string, others: string[]): string | null {
  const segs = segments(target)
  const hay = others.map(o => o.toLowerCase())
  for (let len = 3; len <= 40; len++) {
    const found: string[] = []
    for (const seg of segs) {
      for (let i = 0; i + len <= seg.length; i++) {
        const tok = seg.slice(i, i + len)
        if (!usable(tok)) continue
        if (!hay.some(h => h.includes(tok))) found.push(tok)
      }
    }
    if (found.length) {
      found.sort()
      return found[0]
    }
  }
  return null
}

// Regex for whole numbers >= n (n in 1..999), e.g. 80 -> ([89][0-9]|[1-9][0-9][0-9]).
export function atLeast (n: number): string {
  n = Math.max(1, Math.min(999, Math.floor(n)))
  const range = (from: number) => from === 9 ? '9' : `[${from}-9]`
  const digits = String(n).split('').map(Number)
  const alts: string[] = []
  // Same number of digits as n. Trailing zeros fold into the last non-zero
  // digit's range: 80 -> [8-9][0-9] instead of 9[0-9]|8[0-9].
  let k = digits.length - 1
  while (k > 0 && digits[k] === 0) k--
  for (let i = 0; i <= k; i++) {
    const prefix = digits.slice(0, i).join('')
    const rest = '[0-9]'.repeat(digits.length - i - 1)
    if (i === k) {
      alts.push(prefix + range(digits[i]) + rest)
    } else if (digits[i] < 9) {
      alts.push(prefix + range(digits[i] + 1) + rest)
    }
  }
  // More digits, up to three.
  for (let len = digits.length + 1; len <= 3; len++) {
    alts.push('[1-9]' + '[0-9]'.repeat(len - 1))
  }
  return alts.length === 1 ? alts[0] : `(${alts.join('|')})`
}

export interface MapRegexResult {
  text: string
  length: number
  tooLong: boolean
  // Mods we couldn't find a unique token for.
  missing: string[]
}

// `universe`: every map mod matcher string (all variants), used to make the
// tokens unique. `extraText`: other text a map tooltip can show (map names).
export function buildMapRegex (input: MapRegexInput, universe: string[], extraText: string[] = []): MapRegexResult {
  const missing: string[] = []

  function tokensFor (mods: string[], allowed: string[]): string[] {
    const allowedSet = new Set(allowed.map(m => m.toLowerCase()))
    const others = [...universe.filter(u => !allowedSet.has(u.toLowerCase())), ...TOOLTIP_LINES, ...extraText]
    const out = new Set<string>()
    for (const m of mods) {
      const tok = uniqueToken(m, others)
      if (tok) out.add(tok)
      else missing.push(m)
    }
    return [...out].sort()
  }

  const terms: string[] = []
  // A token may also match other mods from the same group: it doesn't change
  // the result and gives shorter tokens.
  const avoid = tokensFor(input.avoid, input.avoid)
  if (input.highlight === 'bad') {
    if (avoid.length) terms.push(`"${avoid.join('|')}"`)
  } else {
    if (avoid.length) terms.push(`"!${avoid.join('|')}"`)
    const want = tokensFor(input.want, input.want)
    if (want.length) terms.push(`"${want.join('|')}"`)
    for (const key of Object.keys(MIN_PREFIX) as MinStat[]) {
      const v = input.mins[key]
      if (v && v > 0) terms.push(`"${MIN_PREFIX[key]}${atLeast(v)}%"`)
    }
  }

  const text = terms.join(' ')
  return { text, length: text.length, tooLong: text.length > MAX_SEARCH_LENGTH, missing }
}
