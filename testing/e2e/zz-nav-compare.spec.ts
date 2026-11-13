// Temporary: screenshots of the PoE-styled Settings. Not committed.
import { test } from './harness'

const OUT = process.env.COMPARE_DIR!

test('settings in the game look', async ({ overlay }) => {
  const { page } = overlay
  await page.addInitScript(a => { try { localStorage.setItem('woke.uiArt', a) } catch {} }, process.env.ART ?? 'poe1')
  await page.setViewportSize({ width: 2560, height: 1440 })
  await overlay.boot({ overlayActive: true })
  await overlay.widget('menu').locator('.fa-cog').click()
  const settings = overlay.widget('settings')
  // Boss runs switched off on its own page, to show how an off module reads.
  await settings.locator('nav [role="button"]', { hasText: 'Boss runs' }).click()
  await settings.locator('main [role="switch"]').first().click()
  await settings.locator('nav [role="button"]', { hasText: 'Price check' }).first().click()
  const top = () => page.evaluate(() => { document.querySelector('[data-w-settings] nav')!.scrollTop = 0 })
  await page.waitForTimeout(400)
  await top()
  await page.locator('[data-w-settings]').screenshot({ path: `${OUT}/real-price-check.png` })
  await settings.locator('nav [role="button"]', { hasText: 'Game & league' }).click()
  await page.waitForTimeout(300)
  await top()
  await page.locator('[data-w-settings]').screenshot({ path: `${OUT}/real-game.png` })
  await settings.locator('nav [role="button"]', { hasText: 'Look & icon row' }).click()
  await page.waitForTimeout(300)
  await top()
  await page.locator('[data-w-settings]').screenshot({ path: `${OUT}/real-look.png` })
  await page.evaluate(() => { const n = document.querySelector('[data-w-settings] nav')!; n.scrollTop = n.scrollHeight / 2 })
  await page.locator('[data-w-settings]').screenshot({ path: `${OUT}/real-modules.png` })
})

test('tool panels in the game look', async ({ overlay }) => {
  const { page } = overlay
  await page.addInitScript(a => { try { localStorage.setItem('woke.uiArt', a) } catch {} }, process.env.ART ?? 'poe1')
  await page.setViewportSize({ width: 2560, height: 1440 })
  await overlay.boot()
  await overlay.copyItem('items/rare-body-armour-es.txt')
  const win = page.locator('#price-window')
  await win.getByText('Energy Shield').first().waitFor()
  await page.waitForTimeout(800)
  await win.screenshot({ path: `${OUT}/real-price-check-window.png` })
})

test('a tool panel in the game look', async ({ overlay }) => {
  const { page } = overlay
  await page.addInitScript(a => { try { localStorage.setItem('woke.uiArt', a) } catch {} }, process.env.ART ?? 'poe1')
  await page.setViewportSize({ width: 2560, height: 1440 })
  await overlay.boot({ widgets: [{ wmType: 'woke-mechanics' }], overlayActive: true })
  await overlay.widget('menu').getByRole('button', { name: 'All tools' }).click()
  await page.getByRole('button', { name: /League mechanics/ }).first().click()
  const w = overlay.widget('woke-mechanics')
  await w.getByText('Rules of thumb').waitFor()
  await page.waitForTimeout(500)
  await w.locator('[data-w-panel]').first().screenshot({ path: `${OUT}/real-panel.png` })
})
