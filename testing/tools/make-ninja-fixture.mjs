// Writes testing/fixtures/http/poe.ninja/poe1/api/economy/current/dense/overviews.json:
// a small poe.ninja "dense overview" (the one APT downloads) with stable
// prices, so price-based modules show the same numbers on every run.
// Edit PRICES and re-run to add items.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))

// type -> [name, chaos, variant?, 7-day graph (% change vs a week ago)?]
const PRICES = {
  Currency: [
    ['Divine Orb', 180, null, [0, 1, 2, 2, 3, 4, 5]],
    ['Exalted Orb', 12],
    ['Orb of Annulment', 6],
    ['Orb of Alchemy', 0.4],
    ['Vaal Orb', 0.8],
    ['Mirror of Kalandra', 90000]
  ],
  Fragment: [['Sacrifice at Midnight', 1]],
  Scarab: [
    ['Ambush Scarab of Containment', 8],
    ['Bestiary Scarab of the Herd', 4],
    ['Divination Scarab of The Cloister', 30, null, [0, 5, 10, 18, 25, 30, 40]]
  ],
  Essence: [
    ['Deafening Essence of Misery', 6],
    ['Deafening Essence of Envy', 4],
    ['Deafening Essence of Dread', 3.5],
    ['Deafening Essence of Scorn', 3],
    ['Deafening Essence of Greed', 1.5],
    ['Essence of Horror', 45],
    ['Essence of Hysteria', 20],
    ['Essence of Insanity', 25],
    ['Essence of Delirium', 30]
  ],
  DivinationCard: [
    ['The Apothecary', 1800],
    ['The Doctor', 900],
    ['Rain of Chaos', 0.5]
  ],
  SkillGem: [
    ['Enlighten Support', 2000, '4/20c'],
    ['Enlighten Support', 450, '3'],
    ['Empower Support', 700, '3'],
    ['Enhance Support', 150, '3'],
    ['Awakened Multistrike Support', 300, '5/20c'],
    ['Vaal Grace', 20, '20/20c'],
    ['Arc', 1, '20/20']
  ],
  UniqueArmour: [['Headhunter', 9000], ['Kaom\'s Heart', 15]],
  UniqueAccessory: [['Mageblood', 36000]],
  UniqueJewel: [['Watcher\'s Eye', 20]],
  Map: [['Strand Map', 2, 'Tier 16']],
  BaseType: [['Spine Bow', 15, '86']]
}

const overviews = Object.entries(PRICES).map(([type, rows]) => ({
  type,
  lines: rows.map(([name, chaos, variant, graph]) => ({
    name,
    ...(variant ? { variant } : {}),
    chaos,
    graph: graph ?? [0, 0, 0, 0, 0, 0, 0]
  }))
}))

const out = path.join(here, '../fixtures/http/poe.ninja/poe1/api/economy/current/dense/overviews.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify({ currencyOverviews: overviews.slice(0, 2), itemOverviews: overviews.slice(2) }))
console.log('Wrote', path.relative(process.cwd(), out))
