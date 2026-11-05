// An item hotkey with nothing under the mouse says so, instead of doing nothing.
import { test, expect } from './harness'

test('a price check with no item under the mouse says so', async ({ overlay, page }) => {
  await overlay.boot()
  await overlay.pressHotkey('Ctrl + D')
  await expect(page.getByText('No item under the mouse')).toBeVisible({ timeout: 3000 })
  await overlay.snap('no item toast')
})
