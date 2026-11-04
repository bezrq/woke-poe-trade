// Essence scan (OCR): Alt+E reads the essence monolith label under the
// cursor, and a monolith holding Misery/Envy/Dread/Scorn says CORRUPT.
import fs from 'fs'
import path from 'path'
import { test, expect, FIXTURES, haveOcr } from './harness'

test.skip(!haveOcr, 'OCR files missing: npm run get:ocr')

test('Alt+E reads a monolith with Misery and Envy: CORRUPT, with the flagged essences', async ({ overlay }) => {
  await overlay.boot({ widgets: [{ wmType: 'woke-essence-scan', wmWants: 'show' }] })
  await overlay.showScreen('screens/essence-monolith.png')
  const { cursor } = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'screens/essence-monolith.json'), 'utf8'))
  await overlay.moveMouse(cursor.x, cursor.y)
  await overlay.pressHotkey('Alt + E')

  const panel = overlay.widget('woke-essence-scan')
  await expect(panel).toContainText('1 read', { timeout: 20_000 })
  await expect(panel).toContainText('CORRUPT')
  // The badge next to the monolith names the essences it read.
  await expect(overlay.page.getByText('CORRUPT').first()).toBeVisible()
  for (const name of ['Misery', 'Greed', 'Envy']) {
    await expect(overlay.page.locator('body')).toContainText(name)
  }
  await overlay.snap('essence monolith badge')

  await overlay.pressHotkey('Alt + E')
  await expect(panel.getByRole('button', { name: 'Start' })).toBeVisible()
})
