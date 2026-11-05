// Settings the app can't use whole must not blank the overlay or get overwritten.
import fs from 'node:fs'
import { test, expect } from './harness'

test('settings from a newer version open, say so, and stay untouched', async ({ overlay, fakeApp, page }) => {
  await overlay.boot({ overlayActive: true, patch: (c) => { c.configVersion = 999 } })
  await expect(page.getByRole('alert').filter({ hasText: 'newer version' })).toBeVisible()
  expect(JSON.parse(fs.readFileSync(fakeApp.configPath(), 'utf8')).configVersion).toBe(999)
})

test('settings the upgrade can\'t handle fall back to defaults, and stay untouched', async ({ overlay, fakeApp, page }) => {
  await overlay.boot({
    overlayActive: true,
    patch: (c) => {
      c.configVersion = 2
      c.widgets = c.widgets.filter((w: { wmType: string }) => w.wmType !== 'menu')
    }
  })
  await expect(page.getByRole('alert').filter({ hasText: 'couldn\'t be upgraded' })).toBeVisible()
  expect(JSON.parse(fs.readFileSync(fakeApp.configPath(), 'utf8')).configVersion).toBe(2)
})
