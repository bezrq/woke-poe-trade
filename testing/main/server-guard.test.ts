// main/src/server.ts wired up for real: the websocket and every HTTP route sit
// behind the own-page check, and a missing file is a 404 rather than a crash.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'
import WebSocket from '../../main/node_modules/ws'
import { server, startServer } from '../../main/src/server'

let port = 0

beforeAll(async () => {
  const updater = { info: { state: 'initial' } }
  const logger = { history: '', write: () => {} }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  port = await startServer(updater as any, logger as any)
})

afterAll(() => new Promise<void>(resolve => {
  server.closeAllConnections()
  server.close(() => resolve())
}))

function status (urlPath: string, headers: Record<string, string>): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, headers }, res => {
      res.resume()
      resolve(res.statusCode ?? 0)
    })
    req.on('error', reject)
    req.end()
  })
}

function connects (origin: string): Promise<boolean> {
  return new Promise(resolve => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/events`, { origin })
    ws.on('open', () => { ws.close(); resolve(true) })
    ws.on('error', () => resolve(false))
  })
}

describe('the local server', () => {
  it('takes the websocket from its own page only', async () => {
    expect(await connects(`http://127.0.0.1:${port}`)).toBe(true)
    expect(await connects('https://evil.example')).toBe(false)
    expect(await connects('http://localhost:3000')).toBe(false)
  })

  it('answers its own page and refuses other sites', async () => {
    const own = { host: `127.0.0.1:${port}` }
    expect(await status('/config', own)).toBe(200)
    expect(await status('/config', { ...own, origin: 'https://evil.example' })).toBe(403)
    expect(await status('/config', { ...own, 'sec-fetch-site': 'cross-site' })).toBe(403)
    expect(await status('/config', { host: `evil.example:${port}` })).toBe(403)
  })

  it('a missing file is a 404, with or without a query', async () => {
    const own = { host: `127.0.0.1:${port}` }
    expect(await status('/no-such-file.js', own)).toBe(404)
    expect(await status('/no-such-file.js?v=1', own)).toBe(404)
    expect(await status('/uploads/no-such-file.png', own)).toBe(404)
  })
})
