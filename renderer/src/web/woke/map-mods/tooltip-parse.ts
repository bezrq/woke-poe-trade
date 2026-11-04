// Map scan mode: turns OCR'd tooltip lines into map mods and properties.
// OCR text is noisy, so mods are matched to the known map mod list by
// similarity rather than exactly.

export interface ScannedMap {
  tier?: number
  props: {
    quantity?: number
    rarity?: number
    packSize?: number
    quality?: number
    currency?: number
    scarabs?: number
    maps?: number
    divCards?: number
  }
  mods: Array<{ matcher: string, roll?: number }>
}

const PROP_PATTERNS: Array<[keyof ScannedMap['props'], RegExp]> = [
  ['quantity', /quant\w*\W+(\d+)/i],
  ['rarity', /item\s*rar\w*\W+(\d+)/i],
  ['packSize', /pack\s*s\w*\W+(\d+)/i],
  ['quality', /^qual\w*\W+(\d+)/i],
  ['currency', /more\s*curr\w*\W+(\d+)/i],
  ['scarabs', /more\s*scar\w*\W+(\d+)/i],
  ['maps', /more\s*maps\W+(\d+)/i],
  ['divCards', /more\s*div\w*(?:\s*cards)?\W+(\d+)/i]
]

export function normalize (s: string): string {
  return s
    .toLowerCase()
    .replace(/[0-9]+(\.[0-9]+)?/g, '#')
    .replace(/[+]/g, '')
    .replace(/#\s*%/g, '#%')
    .replace(/[^a-z#%' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein (a: string, b: string): number {
  if (a === b) return 0
  const prev = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

export function similarity (a: string, b: string): number {
  const len = Math.max(a.length, b.length)
  return len === 0 ? 1 : 1 - levenshtein(a, b) / len
}

const MIN_SIMILARITY = 0.8

export class TooltipMatcher {
  private readonly known: Array<{ matcher: string, norm: string }>

  constructor (matchers: string[]) {
    this.known = matchers.map(m => ({ matcher: m, norm: normalize(m) }))
  }

  matchLine (line: string): { matcher: string, roll?: number } | null {
    const norm = normalize(line)
    if (norm.length < 8) return null
    let best: { matcher: string, score: number } | null = null
    for (const k of this.known) {
      // Cheap length filter before the edit distance.
      if (Math.abs(k.norm.length - norm.length) > norm.length * (1 - MIN_SIMILARITY) + 2) continue
      const score = similarity(norm, k.norm)
      if (score >= MIN_SIMILARITY && (!best || score > best.score)) {
        best = { matcher: k.matcher, score }
      }
    }
    if (!best) return null
    const num = /(\d+)/.exec(line)
    return { matcher: best.matcher, roll: num ? Number(num[1]) : undefined }
  }

  // Null when the lines don't look like a map tooltip.
  parse (lines: string[]): ScannedMap | null {
    const out: ScannedMap = { props: {}, mods: [] }
    let isMap = false
    const seen = new Set<string>()
    for (const line of lines) {
      const tier = /map\s*tier\W+(\d+)/i.exec(line)
      if (tier) {
        out.tier = Number(tier[1])
        isMap = true
        continue
      }
      let isProp = false
      for (const [key, re] of PROP_PATTERNS) {
        const m = re.exec(line)
        if (m) {
          out.props[key] = Number(m[1])
          isProp = true
          break
        }
      }
      if (isProp) continue
      const mod = this.matchLine(line)
      if (mod && !seen.has(mod.matcher)) {
        seen.add(mod.matcher)
        out.mods.push(mod)
      }
    }
    if (!isMap && !out.mods.length) return null
    return out
  }
}
