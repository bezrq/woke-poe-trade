// App colours: the app's frame (Settings, rail, dock) takes the player's own
// colours, and the tool panels keep the theme.
import { test, expect } from './harness'

const accentOf = (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate((s) => getComputedStyle(document.querySelector(s)!).getPropertyValue('--w-accent').trim(), selector)

test('own app colours restyle the frame and leave the tool panels alone', async ({ overlay }) => {
  const { page } = overlay
  await page.setViewportSize({ width: 2560, height: 1440 })
  await overlay.boot({ widgets: [{ wmType: 'woke-mechanics' }], overlayActive: true })
  await overlay.widget('menu').locator('.fa-cog').click()
  const settings = overlay.widget('settings')
  await settings.getByText('Look & icon row', { exact: true }).first().click()

  const toggle = settings.locator('[data-setting="Own colours for the app"]').getByRole('switch')
  await expect(settings.getByLabel('Accent', { exact: true })).toHaveCount(0)
  await toggle.click()
  await expect(settings.getByLabel('Accent', { exact: true })).toBeVisible()
  await settings.getByLabel('Accent', { exact: true }).fill('#3fa7ff')
  await settings.getByLabel('Background', { exact: true }).fill('#101820')

  expect(await accentOf(page, '[data-w-settings]')).toBe('#3fa7ff')
  expect(await accentOf(page, '[data-woke-frame]')).toBe('#3fa7ff')
  // The rest of the page, tool panels included, keeps the theme's gold.
  expect(await accentOf(page, ':root')).toBe('#d4a64a')
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('woke.appColors')) ?? 'null'))
    .toEqual({ accent: '#3fa7ff', panel: '#101820', fg: '#e8e2d6' })
  await overlay.snap('app colours on')

  // A preset fills all three, and the rail's pop-ups (outside the rail in the
  // page) wear them too.
  await settings.getByRole('button', { name: 'Amethyst' }).click()
  await expect(settings.getByRole('button', { name: 'Amethyst' })).toHaveAttribute('aria-pressed', 'true')
  expect(await accentOf(page, '[data-w-settings]')).toBe('#ac82e8')
  await page.keyboard.press('Escape')
  const rail = overlay.widget('menu').locator('.w-surface').first()
  await rail.hover()
  await overlay.widget('menu').getByRole('button', { name: 'Rail layout and size', exact: true }).click()
  await expect(page.locator('[data-rail-theme]')).toBeVisible()
  expect(await accentOf(page, '[data-rail-theme]')).toBe('#ac82e8')
  await overlay.snap('app colours rail popup')
  await page.mouse.click(1280, 1300)
  await expect(page.locator('[data-rail-theme]')).toHaveCount(0)
  await overlay.widget('menu').locator('.fa-cog').click()
  await settings.getByText('Look & icon row', { exact: true }).first().click()

  // Switched off, the frame wears the theme again.
  await toggle.click()
  expect(await accentOf(page, '[data-w-settings]')).toBe('#d4a64a')
  expect(await page.evaluate(() => localStorage.getItem('woke.appColors'))).toBeNull()
})
