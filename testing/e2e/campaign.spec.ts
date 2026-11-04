// Campaign tracker + run timer, driven by a recorded Client.txt.
import { test, expect, logFixture } from './harness'

const CAMPAIGN = { wmType: 'woke-campaign', wmWants: 'show' as const }
const RUN_TIMER = { wmType: 'woke-run-timer', wmWants: 'show' as const }

test('tracker follows zones, act and level from Client.txt while you play', async ({ overlay, fakeApp }) => {
  await overlay.boot({ widgets: [CAMPAIGN] })
  const strip = overlay.widget('woke-campaign')
  await expect(strip).toContainText('waiting for a zone change')

  await overlay.replayLog('client-logs/campaign-act1.txt')
  await expect(strip).toContainText('A2 · The Southern Forest')
  await expect(strip).toContainText('Lv 13')
  await expect(strip).toContainText('WokeTester')
  await overlay.snap('campaign strip in act 2')

  // Saved while the game has focus, so a restart keeps the place.
  await expect.poll(() => overlay.savedWidget('woke-campaign')?.state?.zone).toBe('The Southern Forest')
})

test('run timer splits act 1 when act 2 starts, with the docked strip in the tracker', async ({ overlay, fakeApp }) => {
  await overlay.boot({ widgets: [CAMPAIGN, RUN_TIMER] })
  await overlay.replayLog('client-logs/campaign-act1.txt')
  const strip = overlay.widget('woke-campaign')
  await expect(strip).toContainText('Run')

  const timer = () => overlay.savedWidget('woke-run-timer')
  await expect.poll(() => timer()?.run?.splits?.map((s: any) => s.act)).toEqual([1])
  const run = timer().run
  expect(run.charName).toBe('WokeTester')
  expect(run.className).toBe('Witch')
  expect(run.level).toBe(13)
  // Bosses reached in act 1 (sub-splits).
  expect(run.marks.map((m: any) => m.id)).toEqual(['brutus', 'merveil'])
})

test('run timer catches up on lines logged while the app was closed, using the log clock', async ({ overlay, fakeApp }) => {
  const lines = logFixture('client-logs/campaign-act1.txt')
  await overlay.boot({
    widgets: [{ ...RUN_TIMER, lastLogAt: new Date(2026, 10, 4, 17, 59, 0).getTime() }],
    logBefore: lines
  })
  const timer = () => overlay.savedWidget('woke-run-timer')
  await expect.poll(() => timer()?.run?.splits?.length, { timeout: 15_000 }).toBe(1)
  // Twilight Strand at 18:00:24, act 2 town at 18:25:31.
  expect(timer().run.splits[0].totalMs).toBe((25 * 60 + 7) * 1000)
  await expect(overlay.widget('woke-run-timer')).toContainText('Act 2')
})

test('a burst of settings saves (catch-up) leaves the newest settings on disk', async ({ overlay, fakeApp }) => {
  await overlay.boot({
    widgets: [{ ...RUN_TIMER, lastLogAt: new Date(2026, 10, 4, 17, 59, 0).getTime() }],
    logBefore: 'client-logs/campaign-act1.txt'
  })
  await expect.poll(() => fakeApp.received.filter(e => e.name === 'CLIENT->MAIN::save-config').length, { timeout: 15_000 }).toBeGreaterThan(5)
  await fakeApp.settled()
  await overlay.page.waitForTimeout(500)
  expect(fakeApp.readConfigText()).toBe(fakeApp.lastSavedContents())
})
