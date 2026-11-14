// Reads the Covens Fate windows (the pick after an encounter, and Invoke Fates
// at the boss) from one screenshot: each card's Fate, tier and reward icons,
// and the 2- or 3-part bars under barred rewards. Plain pixel matching against
// the game's own sprites, like the stash reader, so no OCR is loaded.
//
// The game draws this UI from 4K sprites scaled by window height / 2160, so a
// card's size is known from the window height and only a little slack is
// searched. Cards are found by the banner strip at the top of the frame (the
// name masked out), then cut out and scaled to one size, where the art, tier
// feather and reward row always sit in the same place.
import { ARTS, ART_BOX, ART_SCALE, BARS, CONFIRM, ICONS, NORM, TIERS, TOP } from './fate-read-data'

const FRAME_W = 450
const FRAME_H = 622
// Bars under the reward icons hang below the frame.
const CUT_BELOW = 40
const TIER_AT = { x: 106, y: 160 }
const ROW_Y = 580
const ICON_STEP = 78
// Window height that shows the 4K sprites at full size.
const SPRITE_HEIGHT = 2160
// Card search, on a shrunk picture where the frame is drawn this small.
const COARSE = 0.125
const COARSE_MIN = 0.55
const CARD_MIN = 0.85
const SCALE_SLACK = [0.94, 0.97, 1, 1.03, 1.06]
const SCALE_FINE = [0.985, 0.99, 0.995, 1.005, 1.01, 1.015]
const FATE_MIN = 0.6
const ICON_MIN = 0.7
const BAR_MIN = 0.6
const CONFIRM_MIN = 0.7
// How far past the cards Confirm can be: the Invoke window is three slots wide.
const CONFIRM_REACH = 1000
// Confirm's top edge from a card's top edge, in 4K pixels: above a collected card,
// or below an offered or placed one.
const CONFIRM_ABOVE = [-260, -60]
const CONFIRM_BELOW = [560, 820]

export interface FateReadReward {
  icon: string
  // Parts needed (2 or 3) for a barred reward, 1 for a plain one.
  need: number
  // Parts the game already shows as filled, counting what's collected.
  filled: number
  // The icon's centre, as fractions of the window.
  x: number
  y: number
}

export interface FateReadCard {
  fate: string
  tier: number
  rewards: FateReadReward[]
  // Where the card is: centre and width, as fractions of the window.
  x: number
  y: number
  width: number
  // offer: picked from, after an encounter. slot: placed to invoke (its rewards
  // aren't shown). held: collected, at the bottom of either window.
  role: 'offer' | 'slot' | 'held'
}

export type FateRead =
  | { found: false }
  | { found: true, window: 'pick' | 'invoke', scale: number, cards: FateReadCard[] }

interface Gray { width: number, height: number, data: Float32Array }
interface Rgb { width: number, height: number, data: Float32Array }
interface Pic { width: number, height: number, data: Float32Array, mask: Uint8Array | null, channels: number }

const bytes = (b64: string) => Uint8Array.from(Buffer.from(b64, 'base64'))

function pic (t: { width: number, height: number, rgb?: string, gray?: string, mask?: string }): Pic {
  const raw = bytes(t.rgb ?? t.gray!)
  return { width: t.width, height: t.height, data: Float32Array.from(raw), mask: t.mask ? bytes(t.mask) : null, channels: t.rgb ? 3 : 1 }
}

// Area average down, or nearest-ish linear up, for 1 or 3 channels.
function resample (src: { width: number, height: number, data: Float32Array }, ch: number, width: number, height: number) {
  const data = new Float32Array(width * height * ch)
  const sx = src.width / width
  const sy = src.height / height
  for (let y = 0; y < height; y++) {
    const top = y * sy
    const bottom = Math.max(top + 1e-6, (y + 1) * sy)
    for (let x = 0; x < width; x++) {
      const left = x * sx
      const right = Math.max(left + 1e-6, (x + 1) * sx)
      for (let c = 0; c < ch; c++) {
        let sum = 0
        let area = 0
        for (let j = Math.floor(top); j < Math.min(src.height, Math.ceil(bottom)); j++) {
          const wy = Math.min(j + 1, bottom) - Math.max(j, top)
          for (let i = Math.floor(left); i < Math.min(src.width, Math.ceil(right)); i++) {
            const w = wy * (Math.min(i + 1, right) - Math.max(i, left))
            sum += src.data[(j * src.width + i) * ch + c] * w
            area += w
          }
        }
        data[(y * width + x) * ch + c] = area ? sum / area : 0
      }
    }
  }
  return { width, height, data }
}

function resampleMask (p: Pic, width: number, height: number): Uint8Array | null {
  if (!p.mask) return null
  const m = resample({ width: p.width, height: p.height, data: Float32Array.from(p.mask) }, 1, width, height)
  return Uint8Array.from(m.data, v => v >= 0.5 ? 1 : 0)
}

function scaled (p: Pic, f: number): Pic {
  if (f === 1) return p
  const width = Math.max(1, Math.round(p.width * f))
  const height = Math.max(1, Math.round(p.height * f))
  return { ...resample(p, p.channels, width, height), mask: resampleMask(p, width, height), channels: p.channels }
}

// A template ready to slide: the pixels it compares (row, and column times
// channels plus channel), zero mean, so each spot costs one pass.
interface Prepared { rows: Int32Array, cols: Int32Array, values: Float32Array, norm: number }
const prepared = new WeakMap<Pic, Prepared>()

function prepare (t: Pic): Prepared {
  const had = prepared.get(t)
  if (had) return had
  const rows: number[] = []
  const cols: number[] = []
  const values: number[] = []
  for (let j = 0; j < t.height; j++) {
    for (let i = 0; i < t.width; i++) {
      if (t.mask && !t.mask[j * t.width + i]) continue
      for (let c = 0; c < t.channels; c++) {
        rows.push(j); cols.push(i * t.channels + c); values.push(t.data[(j * t.width + i) * t.channels + c])
      }
    }
  }
  const mean = values.reduce((a, v) => a + v, 0) / Math.max(1, values.length)
  let norm = 0
  for (let k = 0; k < values.length; k++) { values[k] -= mean; norm += values[k] * values[k] }
  const p = { rows: Int32Array.from(rows), cols: Int32Array.from(cols), values: Float32Array.from(values), norm: Math.sqrt(norm) }
  prepared.set(t, p)
  return p
}

// Zero-mean correlation of a (masked) template at one spot, -1..1.
function matchAt (img: { width: number, data: Float32Array }, ch: number, t: Pic, x: number, y: number): number {
  const p = prepare(t)
  const n = p.values.length
  if (!n || p.norm <= 0) return -1
  const stride = img.width * ch
  const base = y * stride + x * ch
  let sum = 0
  let sumSq = 0
  let dot = 0
  for (let k = 0; k < n; k++) {
    const a = img.data[base + p.rows[k] * stride + p.cols[k]]
    sum += a; sumSq += a * a; dot += a * p.values[k]
  }
  const variance = sumSq - sum * sum / n
  return variance > 1e-6 ? dot / (Math.sqrt(variance) * p.norm) : -1
}

// Best match of a template centred near (cx, cy), within `slack` pixels.
function bestNear (img: { width: number, height: number, data: Float32Array }, ch: number, t: Pic, cx: number, cy: number, slack: number) {
  let best = -1
  let at = { x: 0, y: 0 }
  const x0 = Math.round(cx - t.width / 2)
  const y0 = Math.round(cy - t.height / 2)
  for (let y = Math.max(0, y0 - slack); y <= Math.min(img.height - t.height, y0 + slack); y++) {
    for (let x = Math.max(0, x0 - slack); x <= Math.min(img.width - t.width, x0 + slack); x++) {
      const v = matchAt(img, ch, t, x, y)
      if (v > best) { best = v; at = { x, y } }
    }
  }
  return { score: best, ...at }
}

function toGray (bgra: Uint8Array, width: number, height: number): Gray {
  const data = new Float32Array(width * height)
  for (let i = 0, p = 0; i < data.length; i++, p += 4) data[i] = (bgra[p] + bgra[p + 1] + bgra[p + 2]) / 3
  return { width, height, data }
}

// One window region as RGB floats.
function cutRgb (bgra: Uint8Array, width: number, height: number, x0: number, y0: number, w: number, h: number): Rgb {
  const data = new Float32Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    const sy = Math.min(height - 1, Math.max(0, y0 + y))
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, Math.max(0, x0 + x))
      const p = (sy * width + sx) * 4
      const q = (y * w + x) * 3
      data[q] = bgra[p + 2]; data[q + 1] = bgra[p + 1]; data[q + 2] = bgra[p]
    }
  }
  return { width: w, height: h, data }
}

let templates: ReturnType<typeof loadTemplates> | null = null
function loadTemplates () {
  return {
    top: pic(TOP),
    confirm: pic(CONFIRM),
    tiers: Object.entries(TIERS).map(([tier, t]) => ({ tier: Number(tier), pic: pic(t) })),
    bars: Object.values(BARS).map(t => ({ need: t.need, filled: t.filled, pic: pic(t) })),
    arts: Object.entries(ARTS).map(([fate, t]) => ({ fate, pic: pic(t) })),
    icons: Object.entries(ICONS).map(([icon, t]) => ({ icon, pic: pic(t) }))
  }
}

interface Hit { score: number, x: number, y: number, s: number }

// Cards on screen: their frame's top left in window pixels and their scale.
function findCards (gray: Gray, s0: number): Hit[] {
  const T = templates!
  // Shrink the screen so the frame is drawn at COARSE, where the banner
  // template is small enough to slide over the middle of the window.
  const f = COARSE / s0
  const small = resample(gray, 1, Math.max(1, Math.round(gray.width * f)), Math.max(1, Math.round(gray.height * f)))
  const tc = scaled(T.top, COARSE / NORM)
  // The Fate windows are centred; leave out the ultrawide edges.
  const half = Math.round(small.height * 0.9)
  const xFrom = Math.max(0, Math.round(small.width / 2) - half)
  const xTo = Math.min(small.width - tc.width, Math.round(small.width / 2) + half)
  const coarse: Array<{ x: number, y: number, score: number }> = []
  for (let y = 0; y <= small.height - tc.height; y++) {
    for (let x = xFrom; x <= xTo; x++) {
      const v = matchAt(small, 1, tc, x, y)
      if (v < COARSE_MIN) continue
      const near = coarse.find(h => Math.abs(h.x - x) < tc.width / 2 && Math.abs(h.y - y) < tc.height * 2)
      if (!near) coarse.push({ x, y, score: v })
      else if (v > near.score) Object.assign(near, { x, y, score: v })
    }
  }
  // The scale is the same for every card: settle it on the best one, finely
  // (a 1% miss puts the reward row a few pixels off), then place the rest.
  const ranked = coarse.sort((a, b) => b.score - a.score).slice(0, 16)
  if (!ranked.length) return []
  const near = (c: { x: number, y: number }, s: number, slack: number) => {
    const t = scaled(T.top, s / NORM)
    const r = bestNear(gray, 1, t, c.x / f + t.width / 2, c.y / f + t.height / 2, slack)
    return { score: r.score, x: r.x, y: r.y - TOP.y * s, s }
  }
  let scale = s0
  let top = -1
  for (const k of SCALE_SLACK) {
    const r = near(ranked[0], s0 * k, Math.ceil(2 / f))
    if (r.score > top) { top = r.score; scale = r.s }
  }
  for (const k of SCALE_FINE) {
    const r = near(ranked[0], scale * k, Math.ceil(2 / f))
    if (r.score > top) { top = r.score; scale = r.s }
  }
  const hits: Hit[] = []
  for (const c of ranked) {
    const best = near(c, scale, Math.ceil(2 / f))
    if (best.score < CARD_MIN) continue
    if (hits.some(h => Math.abs(h.x - best.x) < FRAME_W * h.s / 2 && Math.abs(h.y - best.y) < FRAME_H * h.s / 2)) continue
    hits.push(best)
  }
  return hits
}

// One card cut out and drawn at NORM, so everything on it is at fixed spots.
function readCard (bgra: Uint8Array, width: number, height: number, hit: Hit) {
  const T = templates!
  const w = Math.round(FRAME_W * hit.s)
  const h = Math.round((FRAME_H + CUT_BELOW) * hit.s)
  const raw = cutRgb(bgra, width, height, Math.round(hit.x), Math.round(hit.y), w, h)
  const card = resample(raw, 3, Math.round(FRAME_W * NORM), Math.round((FRAME_H + CUT_BELOW) * NORM))

  const small = resample(card, 3, Math.round(FRAME_W * ART_SCALE), Math.round((FRAME_H + CUT_BELOW) * ART_SCALE))
  let fate = { fate: '', score: -1 }
  for (const a of T.arts) {
    const r = bestNear(small, 3, a.pic, (ART_BOX.x * ART_SCALE) + a.pic.width / 2, (ART_BOX.y * ART_SCALE) + a.pic.height / 2, 2)
    if (r.score > fate.score) fate = { fate: a.fate, score: r.score }
  }
  let tier = { tier: 1, score: -1 }
  for (const t of T.tiers) {
    const r = bestNear(card, 3, t.pic, TIER_AT.x * NORM, TIER_AT.y * NORM, 3)
    if (r.score > tier.score) tier = { tier: t.tier, score: r.score }
  }
  // Rewards sit centred in a row, a whole step apart: try every half step and
  // keep whichever of the odd or even set matches better. The row's exact
  // place is settled once, on whichever middle spot holds an icon.
  const spotX = (k: number) => (225 + k * ICON_STEP / 2) * NORM
  let shift = { dx: 0, dy: 0, score: -1 }
  for (const k of [0, -1, 1]) {
    for (const ic of T.icons) {
      const r = bestNear(card, 3, ic.pic, spotX(k), ROW_Y * NORM, 4)
      if (r.score > shift.score) {
        shift = { dx: r.x - Math.round(spotX(k) - ic.pic.width / 2), dy: r.y - Math.round(ROW_Y * NORM - ic.pic.height / 2), score: r.score }
      }
    }
  }
  const spots: Array<{ k: number, icon: string, score: number }> = []
  for (let k = -4; k <= 4; k++) {
    let best = { icon: '', score: -1 }
    for (const ic of T.icons) {
      const r = bestNear(card, 3, ic.pic, spotX(k) + shift.dx, ROW_Y * NORM + shift.dy, 1)
      if (r.score > best.score) best = { icon: ic.icon, score: r.score }
    }
    if (best.score >= ICON_MIN) spots.push({ k, ...best })
  }
  const sum = (odd: number) => spots.filter(p => Math.abs(p.k % 2) === odd).reduce((a, p) => a + p.score, 0)
  const parity = sum(1) > sum(0) ? 1 : 0
  const rewards: FateReadReward[] = spots.filter(p => Math.abs(p.k % 2) === parity).map(p => {
    let bar = { need: 1, filled: 0, score: BAR_MIN }
    for (const b of T.bars) {
      const r = bestNear(card, 3, b.pic, spotX(p.k) + shift.dx, (ROW_Y + 33) * NORM + shift.dy, 4)
      if (r.score > bar.score) bar = { need: b.need, filled: b.filled, score: r.score }
    }
    // Back from the card cut-out to the window.
    const x = hit.x + (spotX(p.k) + shift.dx) / NORM * hit.s
    const y = hit.y + (ROW_Y * NORM + shift.dy) / NORM * hit.s
    return { icon: p.icon, need: bar.need, filled: bar.filled, x: x / width, y: y / height }
  })
  return { fate: fate.score >= FATE_MIN ? fate.fate : '', tier: tier.tier, rewards }
}

// The Confirm button's top edge in window pixels, or null. It sits centred
// under the window, which may hold only one card at one side, so it's looked
// for well past the cards' sides, on a half-size picture first.
function findConfirm (gray: Gray, s: number, cards: Hit[]): number | null {
  const full = scaled(templates!.confirm, s / NORM)
  const f = 0.5
  const small = resample(gray, 1, Math.round(gray.width * f), Math.round(gray.height * f))
  const t = scaled(templates!.confirm, s * f / NORM)
  const reach = CONFIRM_REACH * s
  const left = Math.max(0, Math.floor((Math.min(...cards.map(c => c.x)) - reach) * f))
  const right = Math.min(small.width - t.width, Math.ceil((Math.max(...cards.map(c => c.x + FRAME_W * c.s)) + reach) * f))
  // Confirm is just above the collected row, or below the top row.
  const rows = new Set<number>()
  for (const c of cards) {
    for (const [from, to] of [[CONFIRM_ABOVE[0], CONFIRM_ABOVE[1]], [CONFIRM_BELOW[0], CONFIRM_BELOW[1]]]) {
      for (let y = Math.floor((c.y + from * s) * f); y <= Math.ceil((c.y + to * s) * f); y++) {
        if (y >= 0 && y <= small.height - t.height) rows.add(y)
      }
    }
  }
  let best = { score: CONFIRM_MIN, x: -1, y: -1 }
  for (const y of rows) {
    for (let x = left; x <= right; x++) {
      const v = matchAt(small, 1, t, x, y)
      if (v > best.score) best = { score: v, x, y }
    }
  }
  if (best.y < 0) return null
  const r = bestNear(gray, 1, full, best.x / f + full.width / 2, best.y / f + full.height / 2, 3)
  return r.score >= CONFIRM_MIN ? r.y : null
}


// A quick look for Fate cards, cheap enough to repeat while the marks are up:
// the screen shrunk by a whole factor straight from the capture, and the
// banner strip slid over the middle of it. Returns where the cards are,
// coarsely, as a string that changes when cards come, go or move (a click
// into a slot), or '' when there are none.
const GLANCE_MIN = 0.78
export function glanceFates (bgra: Uint8Array, width: number, height: number, uiScale = 1): string {
  templates ??= loadTemplates()
  const s0 = height / SPRITE_HEIGHT * uiScale
  const k = Math.max(1, Math.round(s0 / COARSE))
  const w = Math.floor(width / k)
  const h = Math.floor(height / k)
  // Only the middle of the window: the Fate windows are centred.
  const half = Math.min(w, Math.round(h * 0.9))
  const x0 = Math.max(0, Math.floor(w / 2) - half)
  const x1 = Math.min(w, Math.floor(w / 2) + half)
  const small = { width: x1 - x0, height: h, data: new Float32Array((x1 - x0) * h) }
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      let sum = 0
      for (let j = 0; j < k; j++) {
        let p = ((y * k + j) * width + x * k) * 4
        for (let i = 0; i < k; i++, p += 4) sum += bgra[p] + bgra[p + 1] + bgra[p + 2]
      }
      small.data[y * small.width + x - x0] = sum / (3 * k * k)
    }
  }
  const t = scaled(templates.top, s0 / k / NORM)
  const hits: Array<{ x: number, y: number, score: number }> = []
  for (let y = 0; y <= small.height - t.height; y++) {
    for (let x = 0; x <= small.width - t.width; x++) {
      const v = matchAt(small, 1, t, x, y)
      if (v < GLANCE_MIN) continue
      const near = hits.find(h => Math.abs(h.x - x) < t.width / 2 && Math.abs(h.y - y) < t.height * 2)
      if (!near) hits.push({ x, y, score: v })
      else if (v > near.score) Object.assign(near, { x, y, score: v })
    }
  }
  // Rounded to a quarter of a card, so a pixel of jitter doesn't count as a move.
  const step = Math.max(1, t.width / 4)
  return hits.map(h => `${Math.round(h.x / step)},${Math.round(h.y / step)}`).sort().join(' ')
}

export function readFates (bgra: Uint8Array, width: number, height: number, uiScale = 1): FateRead {
  templates ??= loadTemplates()
  const gray = toGray(bgra, width, height)
  const s0 = height / SPRITE_HEIGHT * uiScale
  const hits = findCards(gray, s0)
  if (!hits.length) return { found: false }
  const s = hits.reduce((a, h) => a + h.s, 0) / hits.length
  const confirm = findConfirm(gray, s, hits)
  const cards: FateReadCard[] = []
  for (const hit of hits.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const card = readCard(bgra, width, height, hit)
    if (!card.fate) continue
    const above = confirm !== null && hit.y < confirm
    cards.push({
      ...card,
      x: (hit.x + FRAME_W * hit.s / 2) / width,
      y: (hit.y + FRAME_H * hit.s / 2) / height,
      width: FRAME_W * hit.s / width,
      role: !above ? 'held' : card.rewards.length ? 'offer' : 'slot'
    })
  }
  if (!cards.length) return { found: false }
  const window = cards.some(c => c.role === 'offer') ? 'pick' : 'invoke'
  return { found: true, window, scale: s / (height / SPRITE_HEIGHT), cards }
}
