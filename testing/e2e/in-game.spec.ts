// What the app does in the game window: typing stash searches, and
// panels that come and go with the zone you're in.
import { test, expect, logFixture } from './harness'

test('regex library: clicking a saved string searches the stash in game', async ({ overlay, fakeApp }) => {
  await overlay.boot({
    overlayActive: true,
    // Open the library's tab (it's placed, closed, by default).
    patch: c => { c.widgets.find((w: { wmType: string }) => w.wmType === 'woke-regex-library').wmWants = 'show' }
  })
  const library = overlay.widget('woke-regex-library')
  await library.getByText('No reflect', { exact: true }).click()
  // The app went back to the game and typed Ctrl+F, pasted, Enter.
  await expect.poll(() => fakeApp.game.stashSearches).toEqual(['"!eflec"'])
  expect(fakeApp.game.focused).toBe(true)
})

test('league mechanics icon: shows in a mechanic zone, hides in the hideout', async ({ overlay }) => {
  await overlay.boot({ widgets: [{ wmType: 'woke-mechanics', wmWants: 'show' }] })
  const icon = overlay.widget('woke-mechanics').locator('[title^="League mechanics"]')
  const lines = logFixture('client-logs/mapping-session.txt')
  const upTo = (text: string) => lines.slice(0, lines.findIndex(l => l.includes(text)) + 1)

  // Strand: a plain map, nothing to show.
  await overlay.log(upTo('You have entered Strand.'))
  await expect(icon).toHaveCount(0)
  // Einhar speaks in the Cemetery map: Bestiary.
  const einhar = upTo('Einhar, Beastmaster:')
  await overlay.log(einhar.slice(upTo('You have entered Strand.').length))
  await expect(icon).toHaveAttribute('title', /Bestiary/)
  await overlay.snap('bestiary icon after Einhar speaks')
  // Back in the hideout: gone.
  const hideout = upTo('Generating level 68 area "Delve_Main"').slice(einhar.length, -1)
  await overlay.log(hideout)
  await expect(icon).toHaveCount(0)
  // Azurite Mine: Delve, from the zone itself.
  await overlay.log(lines.slice(einhar.length + hideout.length, lines.findIndex(l => l.includes('Azurite Mine')) + 1))
  await expect(icon).toHaveAttribute('title', /Delve/)
})
