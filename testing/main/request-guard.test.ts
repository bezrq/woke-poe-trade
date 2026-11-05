// main/src/host-files/request-guard.ts: other web pages must not reach the
// app's local server.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { isOwnPageRequest, resolveInside } from '../../main/src/host-files/request-guard'

describe('isOwnPageRequest', () => {
  it.each([
    [{ host: 'localhost:8585', origin: 'http://localhost:8585' }],
    [{ host: '127.0.0.1:8585', origin: 'http://127.0.0.1:8585' }],
    [{ host: 'localhost:8585' }],
    [{ host: 'localhost:8585', 'sec-fetch-site': 'same-origin' }],
    [{ host: 'localhost:8585', 'sec-fetch-site': 'none' }],
    // Dev mode: Vite forwards the page's own Host and Origin.
    [{ host: 'localhost:5173', origin: 'http://localhost:5173' }]
  ])('lets the app\'s own page in: %j', (headers) => {
    expect(isOwnPageRequest(headers)).toBe(true)
  })

  it.each([
    ['another site', { host: 'localhost:8585', origin: 'https://evil.example' }],
    ['another local app', { host: 'localhost:8585', origin: 'http://localhost:3000' }],
    ['a sandboxed page', { host: 'localhost:8585', origin: 'null' }],
    ['DNS rebinding', { host: 'evil.example:8585', origin: 'http://evil.example:8585' }],
    ['DNS rebinding without Origin', { host: 'evil.example:8585' }],
    ['a cross-site request with no Origin', { host: 'localhost:8585', 'sec-fetch-site': 'cross-site' }],
    ['a same-site request', { host: 'localhost:8585', 'sec-fetch-site': 'same-site' }],
    ['no Host', {}],
    ['a broken Host', { host: 'local host:8585' }]
  ])('refuses %s', (_name, headers) => {
    expect(isOwnPageRequest(headers)).toBe(false)
  })

  it('with --listen, any Host works but other sites still don\'t', () => {
    expect(isOwnPageRequest({ host: '192.168.1.5:8585', origin: 'http://192.168.1.5:8585' }, true)).toBe(true)
    expect(isOwnPageRequest({ host: '192.168.1.5:8585', origin: 'https://evil.example' }, true)).toBe(false)
  })
})

describe('resolveInside', () => {
  const root = path.resolve('some', 'root')

  it('finds files and ignores the query', () => {
    expect(resolveInside(root, '/assets/a.js?v=1')).toBe(path.join(root, 'assets', 'a.js'))
  })

  it.each([['/../secret.txt'], ['/../../secret.txt'], ['/assets/../../secret.txt'], ['/..\\secret.txt'], ['/']])('refuses %s', (url) => {
    expect(resolveInside(root, url)).toBeNull()
  })
})
