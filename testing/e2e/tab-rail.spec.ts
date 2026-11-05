// The rail on the left edge and its launcher: every tool in one place, a short
// row of pins, and item paste from anywhere in the overlay.
import { test, expect, fixtureText } from './harness'
import type { Overlay } from './harness'

const ITEM = fixtureText('items/rare-ring.txt')

const icon = (overlay: Overlay, name: string) =>
  overlay.widget('menu').getByRole('button', { name, exact: true })

// The tools and open windows of a real config, still on the old bar.
async function boot (overlay: Overlay, patchMenu?: (menu: any) => void) { // eslint-disable-line @typescript-eslint/no-explicit-any
  overlay.page.setViewportSize({ width: 2560, height: 1440 })
  // New widgets open themselves as they initialize; closed again below.
  const seed = (wmType: string, wmTitle: string) =>
    ({ wmType, wmTitle, anchor: { pos: 'tl', x: 40, y: 30 } })
  await overlay.boot({
    overlayActive: true,
    widgets: [
      seed('woke-market-tracker', 'Market tracker'),
      seed('woke-boss-runs', 'Boss runs'),
      seed('woke-map-scan', 'Map scan'),
      seed('woke-loot-filter', 'Loot filter'),
      seed('woke-lab-gems', 'Lab gems'),
      seed('woke-challenges', 'Challenges')
    ],
    patch: (config) => {
      const menu = config.widgets.find((w: { wmType: string }) => w.wmType === 'menu')
      menu.pinned = config.widgets.filter((w: { wmFlags: string[] }) => !w.wmFlags.includes('menu::skip')).map((w: { wmId: number }) => w.wmId)
      menu.dismissed = []
      // The default config was saved by a running app, so it's already moved.
      delete menu.rail
      menu.anchor = { pos: 'tl', x: 5, y: 5 }
      patchMenu?.(menu)
    }
  })
  await overlay.showScreen('screens/map-real-01.png')
  const rail = overlay.widget('menu').locator('.w-surface').first()
  await expect(rail).toBeVisible()
  if (!patchMenu) {
    for (const name of ['Market tracker', 'Map scan', 'Loot filter', 'Challenges']) {
      await expect(icon(overlay, name)).toHaveClass(/open/)
      await icon(overlay, name).click()
    }
    await overlay.page.mouse.move(1500, 1300)
  }
  return rail
}

test('an old bar becomes a short rail on the left edge, below the buffs', async ({ overlay }) => {
  const rail = await boot(overlay)
  const box = (await rail.boundingBox())!
  expect(box.x).toBe(0)
  expect(box.y).toBeGreaterThan(120)
  expect(box.width).toBeLessThan(50)
  await expect(icon(overlay, 'Market tracker')).toBeVisible()
  await expect(icon(overlay, 'Boss runs')).toBeVisible()
  await expect(icon(overlay, 'Lab gems')).toBeVisible() // not pinned, but open
  await expect(icon(overlay, 'Challenges')).toHaveCount(0) // not pinned, closed
  await overlay.snap('rail')
  expect(overlay.errors).toEqual([])
})

test('a rail that was moved stays moved', async ({ overlay }) => {
  const rail = await boot(overlay, (menu) => {
    menu.rail = true
    menu.anchor = { pos: 'tl', x: 40, y: 20 }
    menu.pinned = []
  })
  const box = (await rail.boundingBox())!
  expect(box.x).toBe(1024)
  expect(box.y).toBe(288)
})

test('hovering names the tool, on top of the windows', async ({ overlay }) => {
  await boot(overlay)
  await icon(overlay, 'Boss runs').hover()
  await expect(overlay.page.locator('[class*="tip"]', { hasText: 'Boss runs' })).toContainText('open')
  await overlay.snap('hover')
  await overlay.page.mouse.move(1500, 1200)
  await expect(overlay.page.locator('[class*="tip"]', { hasText: 'Boss runs' })).toHaveCount(0)
})

test('clicking an open tool that is not pinned closes it and takes it off the rail', async ({ overlay }) => {
  await boot(overlay)
  await expect(overlay.widget('woke-lab-gems').locator('.w-surface, [data-w-panel]').first()).toBeVisible()
  await icon(overlay, 'Lab gems').click()
  await expect(icon(overlay, 'Lab gems')).toHaveCount(0)
  await expect(overlay.page.locator('[class*="tip"]', { hasText: 'Lab gems' })).toHaveCount(0)
})

test('the launcher lists every tool, finds them, opens them and pins them', async ({ overlay }) => {
  const { page } = overlay
  await boot(overlay)
  await icon(overlay, 'All tools').click()
  const box = page.getByRole('textbox', { name: 'Find a tool, or paste an item' })
  await expect(box).toBeFocused()
  await expect(page.getByRole('button', { name: 'Challenges', exact: true })).toBeVisible()
  await expect(page.getByText('Economy', { exact: true })).toBeVisible()
  await overlay.snap('launcher')

  await page.getByRole('button', { name: 'Pin Challenges to the rail' }).click()
  await page.keyboard.press('Escape')
  await expect(box).toHaveCount(0)
  await expect(icon(overlay, 'Challenges')).toBeVisible()

  await icon(overlay, 'All tools').click()
  await box.fill('chall')
  await expect(page.locator('[class*="launcher"]').getByRole('button', { name: 'Boss runs', exact: true })).toHaveCount(0)
  await page.keyboard.press('Enter')
  await expect(box).toHaveCount(0)
  await expect(icon(overlay, 'Challenges')).toHaveClass(/open/)

  await icon(overlay, 'All tools').click()
  await box.fill('nothing like this')
  await expect(page.getByText('No tool matches')).toBeVisible()
  expect(overlay.errors).toEqual([])
})

test('the launcher opens toward the screen when the rail is on the right', async ({ overlay }) => {
  const rail = await boot(overlay, (menu) => {
    menu.rail = true
    menu.anchor = { pos: 'tr', x: 100, y: 10.5 }
  })
  await icon(overlay, 'All tools').click()
  const panel = overlay.page.getByRole('textbox', { name: 'Find a tool, or paste an item' })
  const railBox = (await rail.boundingBox())!
  const panelBox = (await panel.boundingBox())!
  expect(panelBox.x + panelBox.width).toBeLessThan(railBox.x)
  expect(panelBox.x).toBeGreaterThan(0)
})

test('an item pasted into the launcher goes to the price check, other text is a search', async ({ overlay }) => {
  const { page } = overlay
  await boot(overlay)
  await icon(overlay, 'All tools').click()
  const box = page.getByRole('textbox', { name: 'Find a tool, or paste an item' })
  const paste = (text: string) => box.evaluate((el, t) => {
    const data = new DataTransfer()
    data.setData('text/plain', t)
    const e = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
    if (el.dispatchEvent(e)) (el as HTMLTextAreaElement).value = t
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)
  await paste('boss')
  await expect(box).toHaveValue('boss')
  await expect(page.getByRole('button', { name: 'Challenges', exact: true })).toHaveCount(0)
  await paste(ITEM)
  await expect(box).toHaveCount(0)
  await expect(overlay.widget('price-check')).toContainText('Category: Ring')
})

test('Ctrl V anywhere in the overlay price checks a copied item', async ({ overlay }) => {
  const { page } = overlay
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await boot(overlay)
  await page.evaluate(t => navigator.clipboard.writeText(t), ITEM)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Control+V')
  await expect(overlay.widget('price-check')).toContainText('Category: Ring')
})

test('Ctrl V does nothing while the overlay is closed', async ({ overlay }) => {
  const { page } = overlay
  await boot(overlay)
  overlay.app.focusGame(true)
  await page.evaluate((t) => {
    const data = new DataTransfer()
    data.setData('text/plain', t)
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
  }, ITEM)
  await page.waitForTimeout(300)
  await expect(overlay.widget('price-check')).not.toContainText('Category: Ring')
})
