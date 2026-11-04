// Renders the synthetic game screenshots in fixtures/screens: a map tooltip
// over a stash, essence monolith labels, drawn with the game's font and text
// colours at 1920x1080. Each PNG has a .json beside it with where the cursor
// is and what the scanner should read.
//
// These are stand-ins until real screenshots are recorded (see README.md,
// "Recording fixtures"); real ones go in the same folder with the same
// .json format and are tested the same way.
//
//   node tools/render-screens.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, '../fixtures/screens')
const fontDir = path.join(here, '../../renderer/src/assets/font')
const font = (f) => `data:font/ttf;base64,${fs.readFileSync(path.join(fontDir, f)).toString('base64')}`

// PoE tooltip colours.
const C = { blue: '#8888ff', grey: '#7f7f7f', white: '#ffffff', rare: '#ffff77', help: '#7f7f7f' }

const css = `
@font-face { font-family: Fontin; src: url(${font('Fontin-SmallCaps-Hinted.ttf')}); }
html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; }
body { position: relative; font-family: Fontin; background:
  radial-gradient(ellipse at 30% 40%, #3a2c1c 0%, #1b140d 45%, #0b0906 100%); }
.noise { position: absolute; inset: 0; opacity: .5; }
.stash { position: absolute; left: 40px; top: 120px; width: 620px; height: 640px;
  background: #120e09; border: 2px solid #4a3a26;
  background-image: linear-gradient(#2a2117 1px, transparent 1px), linear-gradient(90deg, #2a2117 1px, transparent 1px);
  background-size: 26px 26px; }
.item { position: absolute; width: 50px; height: 50px; background: #2c3a2a; border: 1px solid #556b4f; }
.tip { position: absolute; background: rgba(0,0,0,.88); border: 1px solid #6b5636; width: 470px;
  text-align: center; font-size: 16px; line-height: 20px; padding-bottom: 6px; }
.tip .head { background: linear-gradient(#3d3220, #251d12); color: ${C.rare}; font-size: 19px; line-height: 23px; padding: 4px 0; }
.tip .sep { height: 2px; margin: 5px 40px; background: linear-gradient(90deg, transparent, #7a6440, transparent); }
.g { color: ${C.grey}; } .w { color: ${C.white}; } .b { color: ${C.blue}; } .h { color: ${C.help}; font-size: 14px; line-height: 17px; padding: 0 16px; }
.label { position: absolute; background: rgba(0,0,0,.78); padding: 6px 12px; font-size: 17px; line-height: 21px; color: #d8d8d8; text-align: center; }
.mono { position: absolute; width: 70px; height: 160px; background: linear-gradient(#5a5048, #2a241f); border-radius: 30px 30px 6px 6px; }
`

function noise () {
  // Deterministic speckle, so the background isn't flat.
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  let dots = ''
  for (let i = 0; i < 350; i++) {
    const x = Math.floor(rnd() * 1920)
    const y = Math.floor(rnd() * 1080)
    const c = ['#4b3b25', '#2e3b22', '#5a4630', '#1f2a1a', '#6a5a40'][Math.floor(rnd() * 5)]
    dots += `<div style="position:absolute;left:${x}px;top:${y}px;width:${2 + Math.floor(rnd() * 5)}px;height:${2 + Math.floor(rnd() * 5)}px;background:${c}"></div>`
  }
  return `<div class="noise">${dots}</div>`
}

function mapTooltip ({ x, y, name, props, ilvl, mods }) {
  const propLines = props.map(([k, v, aug]) => `<div><span class="g">${k}: </span><span class="${aug ? 'b' : 'w'}">${v}</span></div>`).join('')
  return `<div class="tip" style="left:${x}px;top:${y}px">
    <div class="head">${name}<br>Map (Tier 16)</div>
    ${propLines}
    <div class="sep"></div>
    <div><span class="g">Item Level: </span><span class="w">${ilvl}</span></div>
    <div class="sep"></div>
    ${mods.map(m => `<div class="b">${m}</div>`).join('')}
    <div class="sep"></div>
    <div class="h">Travel to this Map by using it in a personal Map Device. Maps can only be used once.</div>
  </div>`
}

function stash () {
  let items = ''
  for (let i = 0; i < 14; i++) items += `<div class="item" style="left:${70 + (i % 7) * 78}px;top:${200 + Math.floor(i / 7) * 78}px"></div>`
  return `<div class="stash"></div>${items}`
}

const SCREENS = [
  {
    name: 'map-tooltip-strand',
    cursor: { x: 538, y: 278 },
    body: () => stash() + mapTooltip({
      x: 600, y: 150, name: 'Shrouded Vale', ilvl: 83,
      props: [['Map Tier', '16'], ['Item Quantity', '+87%', true], ['Item Rarity', '+45%', true], ['Monster Pack Size', '+29%', true], ['More Currency', '+12%', true]],
      mods: ['Area is inhabited by Abominations', 'Monsters deal 110% extra Physical Damage as Fire', 'Players are Cursed with Temporal Chains', 'Monsters have 70% increased Area of Effect', 'Monsters have +40% chance to Suppress Spell Damage', 'Players have 60% less Recovery Rate of Life and Energy Shield']
    }),
    expect: {
      kind: 'map',
      tier: 16,
      props: { quantity: 87, rarity: 45, packSize: 29, currency: 12 },
      mods: [
        'Area is inhabited by Abominations',
        'Monsters deal #% extra Physical Damage as Fire',
        'Players are Cursed with Temporal Chains',
        'Monsters have #% increased Area of Effect',
        'Monsters have +#% chance to Suppress Spell Damage',
        'Players have #% less Recovery Rate of Life and Energy Shield'
      ]
    }
  },
  {
    name: 'map-tooltip-deadly',
    cursor: { x: 616, y: 356 },
    body: () => stash() + mapTooltip({
      x: 680, y: 230, name: 'Grim Hollow', ilvl: 83,
      props: [['Map Tier', '16'], ['Item Quantity', '+64%', true], ['Item Rarity', '+38%', true], ['Monster Pack Size', '+22%', true]],
      mods: ['Area contains two Unique Bosses', 'Players have -20% to all maximum Resistances', 'Players cannot Regenerate Life, Mana or Energy Shield', 'Monsters are Hexproof']
    }),
    expect: {
      kind: 'map',
      tier: 16,
      props: { quantity: 64, rarity: 38, packSize: 22 },
      mods: [
        'Area contains two Unique Bosses',
        'Players have #% to all maximum Resistances',
        'Players cannot Regenerate Life, Mana or Energy Shield',
        'Monsters are Hexproof'
      ]
    }
  },
  {
    name: 'essence-monolith',
    cursor: { x: 960, y: 640 },
    body: () => `<div class="mono" style="left:925px;top:560px"></div>
      <div class="label" style="left:830px;top:470px">Deafening Essence of Misery<br>Shrieking Essence of Greed<br>Deafening Essence of Envy</div>`,
    expect: {
      kind: 'essence',
      essences: ['Deafening Essence of Misery', 'Shrieking Essence of Greed', 'Deafening Essence of Envy']
    }
  },
  {
    name: 'essence-two-monoliths',
    cursor: { x: 700, y: 640 },
    body: () => `<div class="mono" style="left:665px;top:560px"></div>
      <div class="label" style="left:570px;top:470px">Screaming Essence of Scorn<br>Deafening Essence of Dread</div>
      <div class="mono" style="left:1265px;top:600px"></div>
      <div class="label" style="left:1170px;top:510px">Wailing Essence of Anger<br>Deafening Essence of Contempt<br>Essence of Horror</div>`,
    expect: {
      kind: 'essence-all',
      labels: [
        ['Screaming Essence of Scorn', 'Deafening Essence of Dread'],
        ['Wailing Essence of Anger', 'Deafening Essence of Contempt', 'Essence of Horror']
      ]
    }
  }
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
fs.mkdirSync(out, { recursive: true })
for (const s of SCREENS) {
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body>${noise()}${s.body()}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(out, `${s.name}.png`) })
  fs.writeFileSync(path.join(out, `${s.name}.json`), JSON.stringify({ synthetic: true, cursor: s.cursor, ...s.expect }, null, 2) + '\n')
  console.log('wrote', s.name)
}
await browser.close()
