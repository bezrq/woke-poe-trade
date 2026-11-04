// The trade assistant's sales log files (main/src/woke/trade-log.ts).
import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { tradeLogHandlers } from '../../main/src/woke/trade-log'

const dir = () => path.join(process.env.WOKE_FAKE_USER_DATA!, 'woke-trades')
const trade = (id: string) => ({ id, league: 'Allflame', at: 1 })

describe('trade log', () => {
  beforeEach(() => {
    process.env.WOKE_FAKE_USER_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-trades-'))
  })

  it('adds to the league file', async () => {
    await tradeLogHandlers['trades-add']({ trade: trade('a') })
    await tradeLogHandlers['trades-add']({ trade: trade('b') })
    expect((await tradeLogHandlers['trades-list']({}) as unknown[]).length).toBe(2)
  })

  it("never replaces a league of trades it couldn't read", async () => {
    await tradeLogHandlers['trades-add']({ trade: trade('a') })
    // Locked for a moment, as antivirus or a sync tool does on Windows.
    const busy = Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' })
    const spy = vi.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(busy)
    await expect(tradeLogHandlers['trades-add']({ trade: trade('b') })).rejects.toThrow('EBUSY')
    spy.mockRestore()
    expect(JSON.parse(fs.readFileSync(path.join(dir(), 'Allflame.json'), 'utf8'))).toHaveLength(1)
  })

  it('keeps a broken file aside and starts over', async () => {
    fs.mkdirSync(dir(), { recursive: true })
    fs.writeFileSync(path.join(dir(), 'Allflame.json'), '[{"id":"a"')
    await tradeLogHandlers['trades-add']({ trade: trade('b') })
    const names = fs.readdirSync(dir())
    expect(names.some(n => n.startsWith('Allflame.json.broken-'))).toBe(true)
    expect(JSON.parse(fs.readFileSync(path.join(dir(), 'Allflame.json'), 'utf8'))).toHaveLength(1)
  })
})
