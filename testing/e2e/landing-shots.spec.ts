// Screenshots for the landing page (docs/index.md) and the README: the real
// overlay drawn over real game screens. Not part of the normal run; take them
// again after a module's look changes:
//
//   WOKE_LANDING_SHOTS=1 npx playwright test landing-shots
//
// Each shot is written to docs/public/shots/<name>.webp at 1600x900.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, FIXTURES, haveOcr } from './harness'
import type { Overlay } from './harness'

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/public/shots')

test.skip(!process.env.WOKE_LANDING_SHOTS, 'Set WOKE_LANDING_SHOTS=1 to take the landing page screenshots')

// The toolkit tools the rail shows, as a player who maps would have them,
// with the names their rail icons carry.
const RAIL: Record<string, string> = {
  'woke-market-tracker': 'Market tracker',
  'woke-farming': 'Farming profit',
  'woke-map-mods': 'Map mod checker',
  'woke-essence-scan': 'Essence scan',
  'woke-loot-filter': 'Loot filter',
  'woke-lab': 'Labyrinth',
  'woke-trade': 'Trades'
}

async function bootWithRail (overlay: Overlay, extra: Array<Record<string, unknown>> = [], overlayActive = false) {
  const rail = Object.keys(RAIL).filter(t => !extra.some(e => e.wmType === t))
  await overlay.boot({
    overlayActive,
    widgets: [...rail.map(wmType => ({ wmType, anchor: { pos: 'tl', x: 40, y: 30 } })), ...extra],
    patch: (config) => {
      const menu = config.widgets.find((w: { wmType: string }) => w.wmType === 'menu')
      menu.pinned = config.widgets.filter((w: { wmType: string }) => w.wmType in RAIL).map((w: { wmId: number }) => w.wmId)
      menu.dismissed = []
    }
  })
}

// The fixture screens hold only the part OCR reads; the page background is
// the whole screenshot it was cut from (fixtures/screens/landing, 1920x1080).
async function showGame (overlay: Overlay, fixture: string, backdrop: string) {
  await overlay.showScreen(fixture)
  const jpg = fs.readFileSync(path.join(FIXTURES, 'screens/landing', backdrop)).toString('base64')
  await overlay.page.evaluate((url) => {
    const root = document.documentElement
    root.style.minHeight = '100vh'
    root.style.background = `#000 url(${url}) center / cover no-repeat`
  }, `data:image/jpeg;base64,${jpg}`)
}

// Saves the page, or a 16:9 part of it to zoom in on, as a 1600x900 webp
// encoded by the page's own canvas.
async function save (overlay: Overlay, name: string, clip?: { x: number, y: number }) {
  await overlay.page.waitForTimeout(400)
  const png = await overlay.page.screenshot(clip ? { clip: { ...clip, width: 1440, height: 810 } } : {})
  const page = await overlay.page.context().newPage()
  const webp = await page.evaluate(async (src) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 1600
    canvas.height = 900
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/webp', 0.86)
  }, `data:image/png;base64,${png.toString('base64')}`)
  await page.close()
  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(path.join(OUT, `${name}.webp`), Buffer.from(webp.split(',')[1], 'base64'))
}

function cursorOf (screen: string): { x: number, y: number } {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, `screens/${screen}.json`), 'utf8')).cursor
}

test('hero: the overlay open in a map, the rail on the left', async ({ overlay }) => {
  await bootWithRail(overlay, [], true)
  await showGame(overlay, 'screens/essence-real-20.png', 'screenshot-0020.jpg')
  // New tools open themselves once; keep the market tracker, close the rest.
  const rail = overlay.widget('menu')
  for (const name of Object.values(RAIL).filter(n => n !== 'Market tracker')) {
    const icon = rail.getByRole('button', { name, exact: true })
    if (/open/.test(await icon.getAttribute('class') ?? '')) await icon.click()
    await expect(icon).not.toHaveClass(/open/)
  }
  await expect(rail.getByRole('button', { name: 'Market tracker', exact: true })).toHaveClass(/open/)
  await overlay.page.mouse.move(1500, 1000)
  await save(overlay, 'hero')
})

test('story: map scan marks a dangerous map', async ({ overlay }) => {
  test.skip(!haveOcr, 'OCR files missing: npm run get:ocr')
  await bootWithRail(overlay, [{ wmType: 'woke-map-scan' }])
  await showGame(overlay, 'screens/map-real-07.png', 'screenshot-0007.jpg')
  const cursor = cursorOf('map-real-07')
  await overlay.moveMouse(cursor.x, cursor.y)
  await overlay.pressHotkey('Alt + S')
  await expect(overlay.page.locator('[class*="badge"]').first()).toContainText('CARE', { timeout: 20_000 })
  await save(overlay, 'story-maps', { x: 0, y: 120 })
})

test('story: essence scan reads a monolith', async ({ overlay }) => {
  test.skip(!haveOcr, 'OCR files missing: npm run get:ocr')
  await bootWithRail(overlay, [])
  await showGame(overlay, 'screens/essence-real-25.png', 'screenshot-0025.jpg')
  const cursor = cursorOf('essence-real-25')
  await overlay.moveMouse(cursor.x, cursor.y)
  await overlay.pressHotkey('Alt + E')
  await expect(overlay.page.getByText('CORRUPT', { exact: true }).filter({ visible: true })).toBeVisible({ timeout: 20_000 })
  await save(overlay, 'story-essence', { x: 40, y: 0 })
})

test('story: a rare ring priced with its rolls', async ({ overlay }) => {
  await bootWithRail(overlay)
  await showGame(overlay, 'screens/essence-real-17.png', 'screenshot-0017.jpg')
  await overlay.copyItem('items/rare-ring.txt')
  const panel = overlay.widget('price-check')
  await panel.locator('[data-roll-presets]').getByText('Low').click()
  await expect(panel).toContainText('Matched: 42')
  await save(overlay, 'story-price', { x: 240, y: 0 })
})

test('story: the filter rule for the hovered item', async ({ overlay, fakeApp }) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-filters-'))
  try {
    fs.copyFileSync(path.join(FIXTURES, 'filters', 'neversink-sample.filter'), path.join(folder, 'NeverSink.filter'))
    await bootWithRail(overlay, [{ wmType: 'woke-loot-filter', wmFlags: ['invisible-on-blur'], sampleHotkey: 'Alt + F', folder, sourceName: 'NeverSink.filter' }])
    await showGame(overlay, 'screens/essence-real-26.png', 'screenshot-0026.jpg')
    await expect.poll(() => fakeApp.registeredHotkeys(), { timeout: 20_000 }).toContain('Alt+F')
    await overlay.copyItem('items/currency-divine.txt', 'Alt + F')
    await expect(overlay.page.getByText('Filter rule for this item')).toBeVisible()
    await save(overlay, 'story-loot', { x: 160, y: 135 })
  } finally {
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

// The README's banner: the name over the hero shot, in the landing page's
// type. Needs the docs' fonts (cd docs && npm install).
test('readme banner', async ({ page }) => {
  const fonts = path.resolve(OUT, '../../node_modules/@fontsource-variable')
  const display = path.join(fonts, 'bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2')
  const body = path.join(fonts, 'geist/files/geist-latin-wght-normal.woff2')
  test.skip(!fs.existsSync(display) || !fs.existsSync(body), 'Docs fonts missing: cd docs && npm install')
  const b64 = (f: string) => fs.readFileSync(f).toString('base64')
  await page.setViewportSize({ width: 1280, height: 400 })
  await page.setContent(`<style>
    @font-face { font-family: D; src: url(data:font/woff2;base64,${b64(display)}) format('woff2'); font-weight: 100 900; }
    @font-face { font-family: B; src: url(data:font/woff2;base64,${b64(body)}) format('woff2'); font-weight: 100 900; }
    body { margin: 0; width: 1280px; height: 400px; overflow: hidden; background: #0d0b09; color: #efe8db; font-family: B, sans-serif; position: relative; }
    .glow { position: absolute; width: 900px; height: 900px; right: -260px; top: -420px; border-radius: 50%; background: radial-gradient(closest-side, rgba(138, 75, 28, 0.6), transparent); }
    .shot { position: absolute; right: -90px; top: 46px; width: 620px; border-radius: 16px; border: 1px solid rgba(212, 166, 74, 0.38); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6); }
    .copy { position: absolute; left: 64px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 18px; width: 660px; }
    h1 { margin: 0; font: 800 52px/0.98 D, sans-serif; letter-spacing: -0.045em; }
    h1 span { color: #f0c66e; }
    p { margin: 0; font-size: 20px; color: #bdb3a3; }
  </style>
  <div class="glow"></div>
  <img class="shot" src="data:image/webp;base64,${b64(path.join(OUT, 'hero.webp'))}">
  <div class="copy"><h1>Woke PoE Trade<br><span>Your toolkit, in the game.</span></h1><p>An overlay for Path of Exile 1</p></div>`)
  await page.evaluate(() => document.fonts.ready)
  const png = await page.screenshot()
  const webp = await page.evaluate(async (src) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    return canvas.toDataURL('image/webp', 0.88)
  }, `data:image/png;base64,${png.toString('base64')}`)
  fs.writeFileSync(path.join(OUT, 'readme-banner.webp'), Buffer.from(webp.split(',')[1], 'base64'))
})
