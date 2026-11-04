// Trade assistant, driven by a recorded hideout session in Client.txt: the
// trade icon and its peek, one key walking a trade (one chat line per press),
// the clickable card, and the sales log feeding Session analytics.
import fs from 'fs'
import path from 'path'
import { test, expect, logFixture } from './harness'

const LINES = logFixture('client-logs/trade-hideout.txt')
const upTo = (text: string) => LINES.slice(0, LINES.findIndex(l => l.includes(text)) + 1)
const TRADE = { wmType: 'woke-trade', stepHotkey: 'F3', busyHotkey: 'F4', ping: false }

test('a buyer whispers: the trade icon peeks, and one key invites, trades, thanks and kicks', async ({ overlay, fakeApp }) => {
  await overlay.boot({ widgets: [TRADE] })
  const icon = overlay.dockIcon('trade')
  await expect(icon).toHaveCount(0)

  // Two buyers whisper (Kaltenhalt twice).
  const whispers = upTo('Kaltenhalt: Hi, I would like to buy your Headhunter')
  await overlay.log(whispers)
  await expect(icon).toBeVisible()
  await expect(icon).toContainText('Kaltenhalt: Headhunter Leather Belt · 120 div')
  await overlay.snap('trade icon peeks with the new offer')
  await overlay.log(upTo('#Spammer').slice(whispers.length))
  await expect(icon).toContainText('2')

  // F3: invite the first buyer. Each press types exactly one chat line.
  await overlay.pressHotkey('F3')
  await expect.poll(() => fakeApp.game.chat).toEqual(['/invite Kaltenhalt'])
  // They join: the next press asks to trade.
  const joined = upTo('Kaltenhalt has joined the area.')
  await overlay.log(joined.slice(upTo('#Spammer').length))
  await overlay.pressHotkey('F3')
  await expect.poll(() => fakeApp.game.chat).toEqual(['/invite Kaltenhalt', '/tradewith Kaltenhalt'])

  // The trade goes through: logged, and the key moves on to thanks, then kick.
  await overlay.log(upTo('Trade accepted.').slice(joined.length))
  const logFile = path.join(fakeApp.opts.userData, 'woke-trades', 'Testleague.json')
  await expect.poll(() => fs.existsSync(logFile) && fs.readFileSync(logFile, 'utf8')).toContain('Headhunter Leather Belt')
  await overlay.pressHotkey('F3')
  // Presses closer than half a second are ignored (the app would drop the line).
  await overlay.page.waitForTimeout(600)
  await overlay.pressHotkey('F3')
  await expect.poll(() => fakeApp.game.chat.slice(2)).toEqual(['@Kaltenhalt Thanks, have fun!', '/kick Kaltenhalt'])

  // The bulk buyer is next. Busy key answers them.
  await overlay.page.waitForTimeout(600)
  await overlay.pressHotkey('F4')
  await expect.poll(() => fakeApp.game.chat.at(-1)).toBe("@xXLeagueStartXx Busy right now, I'll invite you in a minute.")
})

test('the trade card lists offers with the stash spot, and its buttons send replies', async ({ overlay, fakeApp }) => {
  await overlay.boot({ widgets: [TRADE] })
  await overlay.log(upTo('#Spammer'))
  await overlay.hoverDockIcon('trade')
  const icon = overlay.dockIcon('trade')
  await expect(icon).toContainText('xXLeagueStartXx', { timeout: 5000 })
  await expect(icon).toContainText('10 × Divine Orb')
  await expect(icon).toContainText('"Sale"')
  await expect(icon).toContainText('left 3, top 5')
  await overlay.snap('trade card with two offers')

  // The card's buttons (clickable once the mouse rests on it).
  await icon.locator('[data-reply="invite"]').first().click()
  await expect.poll(() => fakeApp.game.chat).toEqual(['/invite Kaltenhalt'])
  // Open the bulk buyer's row and tell them it's sold.
  await icon.locator('[data-offer="xXLeagueStartXx"] button').first().click()
  await overlay.page.waitForTimeout(600)
  await icon.locator('[data-offer="xXLeagueStartXx"] [data-reply="sold"]').click()
  await expect.poll(() => fakeApp.game.chat.at(-1)).toBe('@xXLeagueStartXx Sorry, 10 × Divine Orb is already sold.')
})

test('whispers you send show under the offers; the sales log and Session analytics show the sale', async ({ overlay }) => {
  await overlay.boot({
    widgets: [{ ...TRADE, wmWants: 'show' as const, tab: 'log' }, { wmType: 'woke-session-analytics', wmWants: 'show' as const }],
    overlayActive: true
  })
  await overlay.log(LINES)
  const trade = overlay.widget('woke-trade')
  await expect(trade).toContainText('Headhunter Leather Belt')
  await expect(trade).toContainText('+120 div')
  // The analytics window sits over the tabs in this test layout.
  await trade.getByRole('tab', { name: /Offers/ }).dispatchEvent('click')
  // Our own whisper to a seller, and the bulk buyer still waiting.
  await expect(trade).toContainText('Ozzy_Seller')
  await expect(trade).toContainText('Mageblood Heavy Belt')
  await overlay.snap('trades window')
  await expect(overlay.widget('woke-session-analytics').locator('[data-analytics="trading"]')).toContainText('Trading')
})
