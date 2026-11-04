// Map scan (OCR): the scan hotkey starts main's screen scanner, which
// screenshots the fake game, reads the tooltip under the cursor with the real
// vision worker (opencv + tesseract), and the widget shows a verdict badge.
//
// Needs the OCR files (`npm run get:ocr`); skipped without them.
import fs from 'fs'
import path from 'path'
import { test, expect, FIXTURES, haveOcr } from './harness'

test.skip(!haveOcr, 'OCR files missing: npm run get:ocr')

function screen (name: string): { cursor: { x: number, y: number } } {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, `screens/${name}.json`), 'utf8'))
}

test('Alt+S scans the hovered map: a deadly map gets CAREFUL with its flagged mods', async ({ overlay }) => {
  await overlay.boot({ widgets: [{ wmType: 'woke-map-scan' }, { wmType: 'woke-map-mods' }] })
  await overlay.showScreen('screens/map-tooltip-deadly.png')
  const { cursor } = screen('map-tooltip-deadly')
  await overlay.moveMouse(cursor.x, cursor.y)
  await overlay.pressHotkey('Alt + S')

  const badge = overlay.page.locator('[class*="badge"]').first()
  await expect(badge).toBeVisible({ timeout: 20_000 })
  await expect(badge).toContainText('CARE')
  await expect(badge).toContainText(/maximum Resistances|max res/i)
  await expect(badge).toContainText(/regenerate|regen/i)
  await overlay.snap('map scan badge on a deadly map')

  // The same hotkey stops scanning, and the badge goes away.
  await overlay.pressHotkey('Alt + S')
  await expect(badge).toBeHidden()
})

test('map scan: a clean juicy map gets a verdict, and moving off it reads nothing new', async ({ overlay }) => {
  await overlay.boot({ widgets: [{ wmType: 'woke-map-scan', wmWants: 'show' }, { wmType: 'woke-map-mods' }] })
  await overlay.showScreen('screens/map-tooltip-strand.png')
  const { cursor } = screen('map-tooltip-strand')
  await overlay.moveMouse(cursor.x, cursor.y)
  await overlay.pressHotkey('Alt + S')

  const panel = overlay.widget('woke-map-scan')
  await expect(panel).toContainText('1 scanned', { timeout: 20_000 })
  await overlay.snap('map scan panel after one map')
  // Off the tooltip: still one reading.
  await overlay.moveMouse(1700, 900)
  await overlay.page.waitForTimeout(1500)
  await expect(panel).toContainText('1 scanned')
})
