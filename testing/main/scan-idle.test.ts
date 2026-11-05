// The "nothing to read" stop (main/src/woke/map-scan.ts) counts time with the
// game in front and the cursor on it, not time away.
import { describe, it, expect } from 'vitest'
import { ScreenScanner } from '../../main/src/woke/map-scan'
import type { ScannerKind } from '../../main/src/woke/map-scan'
import { game } from '../fake-host/game'

const MINUTE = 60_000

function scanner (isActive: boolean, bounds: { x: number, y: number, width: number, height: number }) {
  const sent: Array<{ running?: boolean, message?: string }> = []
  const win = { isActive, bounds, screenshot: () => new Uint8Array(bounds.width * bounds.height * 4) }
  const kind: ScannerKind = {
    topic: 'test-scan',
    name: 'Test scan',
    frameMs: 1000,
    noReadingStopMs: 3 * MINUTE,
    cropHalfWidth: 0.3,
    read: async () => ({ sig: null, elapsed: 0 })
  }
  const server = { sendEventTo: (_to: string, e: { payload: { data: { type: string } } }) => { if (e.payload.data.type === 'state') sent.push(e.payload.data) } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = new ScreenScanner(server as any, { write () {} } as any, win as any, kind) as any
  s.running = true
  s.worker = {}
  s.lastReadingAt = Date.now() - 5 * MINUTE
  s.lastActive = Date.now()
  return { s, win, sent }
}

const BOUNDS = { x: 0, y: 0, width: 200, height: 200 }

describe('scan idle stop', () => {
  it('coming back after minutes away from the game does not stop the scan', async () => {
    const { s, win } = scanner(false, BOUNDS)
    await s.frame()
    win.isActive = true
    game.cursor = { x: 50, y: 50 }
    await s.frame()
    expect(s.isRunning).toBe(true)
  })

  it('minutes with the cursor off the game window do not count either', async () => {
    const { s } = scanner(true, BOUNDS)
    game.cursor = { x: 900, y: 900 }
    await s.frame()
    game.cursor = { x: 50, y: 50 }
    await s.frame()
    expect(s.isRunning).toBe(true)
  })

  it('still stops after minutes on the game with nothing to read', async () => {
    const { s, sent } = scanner(true, BOUNDS)
    game.cursor = { x: 50, y: 50 }
    await s.frame()
    expect(s.isRunning).toBe(false)
    expect(sent.at(-1)?.message).toMatch(/nothing to read/)
  })
})
