// The text box the game shows over a hovered Fate reward: for a gear reward,
// its second line says which modifier the dropped items will have ("Axes
// dropped by Empowered Monster will have a Physical modifier"). The icon is
// the same for every modifier, so this text is the only way to tell.
//
// The box's text is white; the card's own text is gold, so a brightness and
// low-saturation mask finds the lines, and they're cut out as dark-on-white
// line images for the OCR worker.
import type { LineImage } from './map-scan-vision'

const LINE_TARGET_H = 34
// In 4K pixels: how far from the cursor the box can be, and its text size.
const REACH_X = 1500
const REACH_Y = 650
const TEXT_MIN_H = 18
const TEXT_MAX_H = 70

// Reward icons for gear, which come with a modifier (as in fate-read-data).
export const GEAR_ICONS = new Set(['Boots', 'Helmet', 'BodyArmour', 'Gloves', 'Shield', 'Claw', 'Staff', 'Wand', 'Sword', 'Sceptre', 'Quiver',
  'Ring', 'Amulet', 'Belt', 'Axe', 'Bow', 'Dagger', 'Mace', 'FishingRod', 'RareWeapon'])

// Rewards that come in grades sharing one icon ("additional Gold", "hoards
// of Gold"), so the sweep reads these too. As in renderer/src/web/woke/fates/rank.ts.
export const GRADED_ICONS = new Set(['UniqueWeapon', 'UniqueArmour', 'UniqueJewellery', 'Currency', 'IncreasedRarityAffectedMonster',
  'Gold', 'Threads', 'Divination', 'Maps', 'Gems'])

// Each grade's wording (OCR slips allowed), most specific first. The names
// must match GRADES in rank.ts. A reward with none of these is "Normal".
const GRADES: Array<[RegExp, string]> = [
  [/\bva[l1i]u?ab[l1i]e\s+cur/i, 'Valuable Currency'],
  [/\bva[l1i]u?ab[l1i]e\s+un/i, 'Valuable'],
  [/\bhoards?\s+of\b/i, 'Hoards of Gold'],
  [/\bmany\b.{0,25}\bthr/i, 'Many Threads'],
  [/\bmany\b.{0,25}\bstack/i, 'Many Stacked Decks'],
  [/\bmany\b.{0,25}\bmaps?\b/i, 'Many Maps'],
  [/\bh[il1]gh[l1i]y\s+inc/i, 'Highly increased Rarity'],
  [/\bgreat[l1i]y\s+inc/i, 'Greatly increased Rarity'],
  [/\bmass[il1]ve[l1i]y\s+inc/i, 'Massively increased Rarity'],
  [/\bextreme[l1i]y\s+inc/i, 'Extremely increased Rarity'],
  [/\bsome\b.{0,20}\bmax/i, 'Some max Quality Gems'],
  [/\bmax[il1]mum\s+qua/i, 'Max Quality Gems'],
  [/\bsk[il1][l1i]{2}\s+gem/i, 'Skill Gem'],
  [/\bsupport\s+gem/i, 'Support Gem']
]

// Names one reward of one card for the sweep's skip list. Must match
// sweepKey in renderer/src/web/woke/fates/advice.ts.
export function sweepKey (card: { fate: string, tier: number, rewards: Array<{ icon: string, need: number }> }, reward: number): string {
  return `${card.fate}|${card.tier}|${card.rewards.map(r => `${r.icon}/${r.need}`).join(',')}#${reward}`
}

const MODIFIERS = ['Chaos', 'Critical', 'Damage', 'Defence', 'Drop', 'Gem', 'Life', 'Mana', 'Physical', 'Resistance', 'Speed',
  'Angling', 'Attack', 'Attribute', 'Elemental']

interface Band { y0: number, y1: number }

function isText (bgra: Uint8Array, p: number): boolean {
  const b = bgra[p]
  const g = bgra[p + 1]
  const r = bgra[p + 2]
  const max = Math.max(r, g, b)
  return max > 150 && max - Math.min(r, g, b) < 45
}

// Line images of the white text box nearest the cursor, top line first.
// `s` is the UI scale (window height / 2160). Empty when there's no box.
export function rewardTooltipLines (bgra: Uint8Array, width: number, height: number, cx: number, cy: number, s: number): LineImage[] {
  const x0 = Math.max(0, Math.round(cx - REACH_X * s))
  const x1 = Math.min(width, Math.round(cx + REACH_X * s))
  const y0 = Math.max(0, Math.round(cy - REACH_Y * s))
  const y1 = Math.min(height, Math.round(cy + REACH_Y * s))
  const w = x1 - x0
  const h = y1 - y0
  if (w <= 0 || h <= 0) return []
  const mask = new Uint8Array(w * h)
  const rowCount = new Int32Array(h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isText(bgra, ((y0 + y) * width + x0 + x) * 4)) { mask[y * w + x] = 1; rowCount[y]++ }
    }
  }
  // Text lines: runs of rows with some text in them.
  const minPx = Math.max(3, Math.round(6 * s))
  const bands: Band[] = []
  let start = -1
  for (let y = 0; y <= h; y++) {
    const on = y < h && rowCount[y] >= minPx
    if (on && start < 0) start = y
    if (!on && start >= 0) {
      const lh = y - start
      if (lh >= TEXT_MIN_H * s && lh <= TEXT_MAX_H * s) bands.push({ y0: start, y1: y - 1 })
      start = -1
    }
  }
  if (!bands.length) return []
  // Lines close together make a box; keep the box nearest the cursor.
  const boxes: Band[][] = []
  for (const b of bands) {
    const last = boxes[boxes.length - 1]
    if (last && b.y0 - last[last.length - 1].y1 < (b.y1 - b.y0) * 1.2) last.push(b)
    else boxes.push([b])
  }
  const cyLocal = cy - y0
  const dist = (box: Band[]) => Math.min(Math.abs(box[0].y0 - cyLocal), Math.abs(box[box.length - 1].y1 - cyLocal))
  const box = boxes.sort((a, b) => dist(a) - dist(b))[0]
  if (dist(box) > REACH_Y * s) return []
  return box.map(b => cutLine(bgra, width, mask, w, x0, y0, b, cx - x0))
}

// One line: its text columns near the cursor (other white text on the same
// rows, like a gold-label count, is cut off at wide gaps), drawn dark on white
// and scaled to the height the OCR model wants.
function cutLine (bgra: Uint8Array, width: number, mask: Uint8Array, w: number, x0: number, y0: number, b: Band, cxLocal: number): LineImage {
  const lh = b.y1 - b.y0 + 1
  const cols: boolean[] = []
  for (let x = 0; x < w; x++) {
    let on = false
    for (let y = b.y0; y <= b.y1 && !on; y++) on = mask[y * w + x] === 1
    cols.push(on)
  }
  // Runs of text columns joined across gaps smaller than two line heights.
  const runs: Array<{ a: number, z: number }> = []
  for (let x = 0; x < w; x++) {
    if (!cols[x]) continue
    const last = runs[runs.length - 1]
    if (last && x - last.z <= lh * 2) last.z = x
    else runs.push({ a: x, z: x })
  }
  const near = runs.sort((p, q) => Math.min(Math.abs(p.a - cxLocal), Math.abs(p.z - cxLocal)) - Math.min(Math.abs(q.a - cxLocal), Math.abs(q.z - cxLocal)))[0] ??
    { a: 0, z: w - 1 }
  const pad = Math.max(2, Math.round(lh / 4))
  const ax = Math.max(0, near.a - pad)
  const zx = Math.min(w - 1, near.z + pad)
  const ay = Math.max(0, b.y0 - 2)
  const zy = b.y1 + 2
  const sw = zx - ax + 1
  const sh = zy - ay + 1
  const scale = Math.min(4, Math.max(1, LINE_TARGET_H / lh))
  const ow = Math.round(sw * scale)
  const oh = Math.round(sh * scale)
  const data = new Uint8Array(ow * oh)
  for (let y = 0; y < oh; y++) {
    const sy = ay + Math.min(sh - 1, Math.floor(y / scale))
    for (let x = 0; x < ow; x++) {
      const sx = ax + Math.min(sw - 1, Math.floor(x / scale))
      const p = ((y0 + sy) * width + x0 + sx) * 4
      const v = Math.max(bgra[p], bgra[p + 1], bgra[p + 2])
      data[y * ow + x] = isText(bgra, p) ? 255 - v : 255
    }
  }
  return { width: ow, height: oh, data }
}

function editDistance (a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const t = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = t
    }
  }
  return d[b.length]
}

// "Physical", "Speed", "no Attack"... from the OCR'd lines, or null for a
// reward without a modifier line. Tolerates a letter or two misread. A
// graded reward (`icon` in GRADED_ICONS) gives its grade, or "Normal".
export function parseRewardModifier (lines: string[], icon?: string): string | null {
  const text = lines.join(' ')
  if (icon && GRADED_ICONS.has(icon)) {
    const grade = GRADES.find(([re]) => re.test(text))
    if (grade) return grade[1]
    return /monster|empow|additional|increased/i.test(text) ? 'Normal' : null
  }
  const m = /dropped by .{0,30}?have (an? |no )([A-Za-z]{3,12}) modif/i.exec(text)
  if (!m) return null
  const word = m[2].toLowerCase()
  let best = { mod: '', d: 99 }
  for (const mod of MODIFIERS) {
    const d = editDistance(word, mod.toLowerCase())
    if (d < best.d) best = { mod, d }
  }
  if (best.d > 2) return null
  return m[1].trim().toLowerCase() === 'no' ? `no ${best.mod}` : best.mod
}
