// The item tooltip on the market tracker: the rows that started it, on prices
// with a real week of movement.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test, expect } from './harness'

type Row = [type: string, name: string, variant: string, chaos: number, graph: Array<number | null>, shows: string]

const ROWS: Row[] = [
  ['Essence', 'Shrieking Essence of Loathing', '', 80, [0, -59.5, -59.5, -59.5, -67.52, -69.28, 3140], 'guaranteeing one property'],
  ['DivinationCard', 'A Chilling Wind', '', 75, [0, null, 650, null, 250, -80, 650], 'Level 21 Vaal Cold Snap'],
  ['Tattoo', 'Tattoo of the Hinekora Warmonger', '', 1221, [null, null, null, null, null, 0, 2900], 'Minions have 5% increased maximum Life'],
  ['SkillGem', 'Minion Life Support', '1', 28, [0, 64.71, 8.24, 41.18, 38.24, -87.47, 65.88], '30% more Minion maximum Life'],
  ['Scarab', 'Incursion Scarab of Champions', '', 8.7, [16.13, -12.75, 7.75, 18.5, -0.67, -50.73, 621.8], 'at least Magic'],
  ['UniqueArmour', "Foulborn Kitava's Thirst", 'Life Trigger', 166, [0, -14.89, -14.89, -19.15, -36.17, -36.17, 608.1], 'Armour: 202-247'],
  ['SkillGem', 'Pact of Lycia', '1', 692, [null, 0, -8.33, 0, 16.17, 8.33, 3838], 'Empowers the next 3 Channelling Spells'],
  ['SkillGem', 'Increased Critical Strikes Support', '20/20c', 814, [0, -0.99, -24.63, -23.03, -29.06, 23.15, 903.4], '117% increased Critical Strike Chance']
]

const DENSE = fileURLToPath(new URL('../fixtures/http/poe.ninja/poe1/api/economy/current/dense/overviews.json', import.meta.url))

test('hovering a market row shows the item beside the panel, with its price', async ({ overlay }) => {
  const recorded = fs.readFileSync(DENSE, 'utf8')
  const blocks = ROWS.map(([type, name, variant, chaos, graph]) =>
    `{"type":"${type}","lines":[${JSON.stringify({ name, ...(variant ? { variant } : {}), chaos, graph })}]}`)
  await overlay.page.route('**/dense/overviews*', (route) => route.fulfill({
    contentType: 'application/json',
    body: recorded.replace(/\[\s*\{"type":"/, () => `[${blocks.join(',')},{"type":"`)
  }))

  await overlay.boot({
    overlayActive: true,
    patch: (config) => {
      config.widgets.push({
        wmId: 9001,
        wmType: 'woke-market-tracker',
        wmTitle: 'Market tracker',
        wmWants: 'show',
        wmZorder: 200,
        wmFlags: [],
        anchor: { pos: 'tl', x: 15, y: 15 },
        view: 'watchlist',
        period: '24h',
        minChaos: 5,
        typeFilter: '',
        watchlist: ROWS.map(([type, name, variant]) => ({ type, name, variant }))
      })
    }
  })
  const panel = overlay.widget('woke-market-tracker')
  const tip = overlay.page.getByRole('tooltip')
  await expect(panel.getByText('Minion Life Support')).toBeVisible()

  for (const [, name, , , , shows] of ROWS) {
    const row = panel.locator('.w-row', { hasText: name })
    await row.hover()
    await expect(tip).toContainText(name)
    await expect(tip).toContainText(shows)
    // P1: beside the panel, covering none of it.
    const t = (await tip.boundingBox())!
    const p = (await panel.locator('[data-w-panel]').boundingBox())!
    expect(t.x >= p.x + p.width || t.x + t.width <= p.x).toBe(true)
    await overlay.snap(`tip ${name}`)
    await overlay.page.mouse.move(1800, 1000)
    await expect(tip).toHaveCount(0)
  }

  // The first hover asked for prices; once in, every tooltip has its strip.
  await expect(async () => {
    await panel.locator('.w-row', { hasText: 'Pact of Lycia' }).hover()
    await expect(tip).toContainText('7 days', { timeout: 500 })
  }).toPass()
  await expect(tip).toContainText('+3838%')
  await overlay.snap('with price strip')

  // It stays out of the way of the right-click menu.
  await panel.locator('.w-row', { hasText: 'Pact of Lycia' }).click({ button: 'right' })
  await expect(tip).toHaveCount(0)
  expect(overlay.errors).toEqual([])
})
