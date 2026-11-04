// The toolkit as a whole: every module's widget mounts in the overlay, the
// module switchboard really switches things off, first-run setup, and the
// hide-all hotkey.
import { test, expect } from './harness'
import { MODULES } from '../../renderer/src/web/woke/modules'

const WIDGET_TYPES = MODULES.flatMap(m => m.widgetTypes)

test('every module\'s widget mounts and shows without errors', async ({ overlay }) => {
  await overlay.boot({
    widgets: WIDGET_TYPES.map(wmType => ({ wmType, wmWants: 'show' as const })),
    overlayActive: true
  })
  for (const wmType of WIDGET_TYPES) {
    await expect(overlay.widget(wmType), wmType).toBeAttached()
    // Only shows its icon in a league mechanic zone.
    if (wmType === 'woke-mechanics') continue
    // Each panel draws something (not an empty shell).
    await expect.poll(async () => (await overlay.widget(wmType).innerText()).trim().length, { message: wmType }).toBeGreaterThan(0)
  }
  await overlay.snap('every widget at once')
  // The harness fails the test on any page error after this.
})

test('a module switched off: no widget, no hotkeys', async ({ overlay, fakeApp }) => {
  await overlay.boot({
    widgets: [{ wmType: 'woke-map-scan' }, { wmType: 'woke-essence-scan' }],
    off: ['map-scan', 'apt-price-check']
  })
  await expect(overlay.widget('woke-essence-scan')).toBeAttached()
  await expect(overlay.widget('woke-map-scan')).not.toBeAttached()
  await expect.poll(() => fakeApp.registeredHotkeys()).toContain('Alt+E')
  const keys = fakeApp.registeredHotkeys()
  expect(keys).not.toContain('Alt+S') // map scan
  expect(keys).not.toContain('Alt+R') // map scan rolling
  // Price check (an APT feature) switched off: both of its keys.
  expect(keys).not.toContain('Ctrl+D')
  expect(keys).not.toContain('Ctrl+Alt+D')
})

test('first run: picking the Leveling preset switches mapping tools off', async ({ overlay, fakeApp }) => {
  await overlay.boot({ firstRun: true, overlayActive: true })
  const page = overlay.page
  await page.getByRole('button', { name: 'Choose tools' }).click()
  await page.getByRole('radio', { name: 'Leveling' }).click()
  await overlay.snap('first run setup, Leveling picked')
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('Set up your toolkit')).toBeHidden()
  fakeApp.focusGame() // back to the game: settings save
  await expect.poll(() => fakeApp.readConfig()?.woke?.setupDone).toBe(true)
  const off: string[] = fakeApp.readConfig().woke.off
  expect(off).toContain('map-scan')
  expect(off).toContain('market')
  expect(off).not.toContain('campaign')
  expect(off).not.toContain('run-timer')
})

test('hide-all hotkey hides the toolkit (dock included) and brings it back', async ({ overlay }) => {
  await overlay.boot({
    widgets: [{ wmType: 'woke-campaign' }],
    patch: c => { c.woke.hideAllHotkey = 'Alt + H' }
  })
  // In a campaign zone the dock shows the campaign icon.
  await overlay.replayLog('client-logs/campaign-act1.txt')
  const icon = overlay.dockIcon('campaign')
  await expect(icon).toBeVisible()
  await overlay.pressHotkey('Alt + H')
  await expect(icon).toBeHidden()
  await expect(overlay.page.getByText('Toolkit panels hidden')).toBeVisible()
  await overlay.pressHotkey('Alt + H')
  await expect(icon).toBeVisible()
})
