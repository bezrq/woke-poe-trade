// The loot filter editor on a NeverSink filter in a temp filter folder:
// the loot shower preview and the sound/beam/minimap pickers.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { test, expect } from './harness'

const FILTER = process.env.WOKE_FILTER_FIXTURE ?? path.join(__dirname, '..', 'fixtures', 'filters', 'neversink-sample.filter')

function filterFolder (): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-filters-'))
  fs.copyFileSync(FILTER, path.join(dir, 'NeverSink.filter'))
  return dir
}

const lootFilter = (folder: string) => ({
  wmType: 'woke-loot-filter',
  wmFlags: ['invisible-on-blur'],
  sampleHotkey: 'Alt + F',
  editorHotkey: 'Alt + Shift + F',
  folder,
  sourceName: 'NeverSink.filter'
})

test('preview drops a pile of loot through the filter, and compares with NeverSink as it came', async ({ overlay }) => {
  const folder = filterFolder()
  await overlay.boot({ widgets: [lootFilter(folder)] })
  await overlay.pressHotkey('Alt + Shift + F')
  const page = overlay.page
  await page.getByRole('tab', { name: 'Preview' }).click()
  await expect(page.getByText(/\d+ of 40 shown/).first()).toBeVisible()
  // Let the labels finish falling.
  await page.waitForTimeout(1500)
  await overlay.snap('loot shower, T16')

  await page.getByRole('button', { name: 'Acts', exact: true }).click()
  await page.getByRole('button', { name: 'Reroll' }).click()
  await expect(page.getByText(/\d+ of 40 shown/).first()).toBeVisible()

  // Compare: two grounds, the same pile.
  await page.getByLabel('Compare with').selectOption('untouched')
  await expect(page.getByText(/\d+ of 40 shown/)).toHaveCount(2)
  await page.getByText('Show hidden').click()
  await page.waitForTimeout(1500)
  await overlay.snap('loot shower compared with NeverSink as it came')
})

test('style editor: NeverSink sound pack, beam and minimap pickers; a pack sound is copied into the filter folder on save', async ({ overlay }) => {
  const folder = filterFolder()
  await overlay.boot({ widgets: [lootFilter(folder)] })
  await overlay.pressHotkey('Alt + Shift + F')
  const page = overlay.page
  await page.getByRole('tab', { name: 'Rules' }).click()
  await page.getByRole('button', { name: 'Red beam' }).first().click()
  await page.getByRole('button', { name: 'Large icon', exact: true }).first().click()
  await page.getByRole('button', { name: 'Star icon' }).first().click()
  await page.getByLabel('Alert sound').first().selectOption('2currency.mp3')
  await overlay.snap('style editor with pack sound, beam and star icon')
  await expect.poll(() => fs.existsSync(path.join(folder, '2currency.mp3'))).toBe(true)
  await page.getByRole('button', { name: /^Save/ }).click()
  await expect.poll(() => {
    const out = path.join(folder, 'NeverSink (woke).filter')
    return fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : ''
  }).toContain('CustomAlertSound "2currency.mp3" 300')
})
