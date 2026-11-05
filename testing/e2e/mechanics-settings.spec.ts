// League mechanics: the settings page explains each mechanic, and the launcher
// opens the full panel outside a mechanic's zone.
import { test, expect } from './harness'

test('the launcher opens the full panel, also after collapsing it', async ({ overlay }) => {
  await overlay.page.setViewportSize({ width: 2560, height: 1440 })
  await overlay.boot({ widgets: [{ wmType: 'woke-mechanics' }], overlayActive: true })
  const widget = overlay.widget('woke-mechanics')
  const rail = overlay.widget('menu')
  const open = async () => {
    await rail.getByRole('button', { name: 'All tools' }).click()
    await overlay.page.getByRole('button', { name: /League mechanics/ }).first().click()
  }

  await expect(widget.getByText('Rules of thumb')).toBeHidden()
  await open()
  await expect(widget.getByText('Rules of thumb')).toBeVisible()
  await overlay.snap('mechanics-panel-from-launcher')

  await widget.locator('.fa-compress-alt').click()
  await expect(widget.getByText('Rules of thumb')).toBeHidden()
  await open()
  await expect(widget.getByText('Rules of thumb')).toBeVisible()
})

test('settings explain each mechanic; the Betrayal editor stays under Betrayal', async ({ overlay }) => {
  await overlay.page.setViewportSize({ width: 2560, height: 1440 })
  await overlay.boot({ widgets: [{ wmType: 'woke-mechanics' }], overlayActive: true })
  await overlay.widget('menu').locator('.fa-cog').click()
  const settings = overlay.widget('settings')
  await settings.getByText('League mechanics', { exact: true }).first().click()
  const tab = (name: string) => settings.getByRole('tab', { name })

  await tab('Delve').click()
  await expect(settings.getByRole('tabpanel').getByText('You enter the Azurite Mine')).toBeVisible()
  await expect(settings.getByText('Edit Betrayal rewards')).toBeHidden()
  await overlay.snap('mechanics-settings-delve')

  await tab('Essence').click()
  await expect(settings.getByRole('tabpanel').getByText('Not detected')).toBeVisible()
  await overlay.snap('mechanics-settings-essence')
  await settings.getByRole('button', { name: /Essence scan: reads monoliths/ }).click()
  await expect(settings.getByRole('tab', { name: 'Essence' })).toBeHidden()
  await settings.getByText('League mechanics', { exact: true }).first().click()

  await tab('Betrayal').click()
  const edit = settings.getByRole('button', { name: /Edit Betrayal rewards/ })
  await expect(settings.getByRole('textbox', { name: 'Vorici, Intervention' })).toBeHidden()
  await edit.click()
  await expect(settings.getByRole('textbox', { name: 'Vorici, Intervention' })).toBeVisible()
  await overlay.snap('mechanics-settings-betrayal')
  // Typed key by key, a space between two words stays.
  await settings.getByRole('textbox', { name: 'Vorici, Intervention' }).pressSequentially('Foo Bar')
  await expect(settings.getByRole('textbox', { name: 'Vorici, Intervention' })).toHaveValue('Foo Bar')

  // Hiding a mechanic saves, and takes it off the panel's rail.
  await tab('Ritual').click()
  await settings.getByRole('tabpanel').getByRole('switch', { name: 'Show in the overlay' }).click()
  await expect.poll(() => overlay.savedWidget('woke-mechanics')?.hidden).toContain('ritual')
})
