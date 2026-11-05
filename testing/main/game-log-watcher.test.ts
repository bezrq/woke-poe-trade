// main/src/host-files/GameLogWatcher.ts: following Client.txt must survive the
// file being cleared, replaced or deleted, with no restart.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { GameLogWatcher } from '../../main/src/host-files/GameLogWatcher'

let dir: string
let file: string
let lines: string[]
let watcher: GameLogWatcher

const until = async (check: () => boolean, ms = 5000) => {
  const end = Date.now() + ms
  while (!check() && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 50))
  expect(check()).toBe(true)
}

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-log-'))
  file = path.join(dir, 'Client.txt')
  fs.writeFileSync(file, 'old line that was there before\n')
  lines = []
  const server = {
    onEventAnyClient: () => {},
    sendEventTo: (_to: string, e: { payload: { lines: string[] } }) => { lines.push(...e.payload.lines) }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watcher = new GameLogWatcher(server as any, { write: () => {} } as any)
  await watcher.restart(file)
})

afterEach(async () => {
  await watcher.stop()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('GameLogWatcher', () => {
  it('follows new lines and skips what was already there', async () => {
    fs.appendFileSync(file, 'first\n')
    await until(() => lines.includes('first'))
    expect(lines).not.toContain('old line that was there before')
  })

  it('carries on after the file is cleared', async () => {
    fs.appendFileSync(file, 'first\n')
    await until(() => lines.includes('first'))
    fs.writeFileSync(file, 'x\n')
    await until(() => lines.includes('x'))
    fs.appendFileSync(file, 'after clear\n')
    await until(() => lines.includes('after clear'))
  })

  it('lets go of a deleted file and picks up the new one', async () => {
    fs.appendFileSync(file, 'first\n')
    await until(() => lines.includes('first'))
    fs.unlinkSync(file)
    await new Promise(resolve => setTimeout(resolve, 1000))
    fs.writeFileSync(file, 'new file\n')
    await until(() => lines.includes('new file'))
    fs.appendFileSync(file, 'more\n')
    await until(() => lines.includes('more'))
  })

  it('switches to a file swapped in under the same name', async () => {
    const swap = path.join(dir, 'swap.txt')
    fs.writeFileSync(swap, 'swapped in, and long enough to pass the old size easily\n')
    fs.renameSync(file, path.join(dir, 'old.txt'))
    fs.renameSync(swap, file)
    await until(() => lines.includes('swapped in, and long enough to pass the old size easily'))
  })
})
