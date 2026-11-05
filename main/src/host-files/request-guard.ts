// The local server is for this app's own page. Without this check any web page
// open in the player's browser could connect to it and act as the overlay:
// type in chat, overwrite settings, call the toolkit's handlers.
//
// Browsers set Origin and Sec-Fetch-Site themselves and pages can't forge them.
// Host stops DNS rebinding, where a site points its own name at 127.0.0.1 to
// look same-origin. Anything else on this PC runs as the player already.
import fs from 'fs'
import path from 'path'
import type { ServerResponse } from 'http'

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])

export interface GuardHeaders {
  host?: string
  origin?: string
  'sec-fetch-site'?: string | string[]
}

function hostnameOf (host: string): string | null {
  try {
    return new URL(`http://${host}`).hostname
  } catch {
    return null
  }
}

// extraHosts: started with --listen, where other machines are the point: this
// PC's own addresses count too. A site's own name still doesn't.
export function isOwnPageRequest (headers: GuardHeaders, extraHosts?: ReadonlySet<string>): boolean {
  const { host, origin } = headers
  if (!host) return false
  const name = hostnameOf(host) ?? ''
  if (!LOOPBACK.has(name) && !extraHosts?.has(name)) return false

  const site = headers['sec-fetch-site']
  if (site === 'cross-site' || site === 'same-site') return false

  // No Origin: not a cross-site browser request (those are refused above, or
  // can't read the answer). With one, it must be the page this server serves.
  if (origin == null) return true
  try {
    return new URL(origin).host === new URL(`http://${host}`).host
  } catch {
    return false
  }
}

// Serves a file below `root`. A missing file is a 404, not an uncaught stream
// error; the URL's query is ignored, and `..` can't climb out of `root`.
export function sendFile (root: string, url: string, res: ServerResponse) {
  const full = resolveInside(root, url)
  if (!full) {
    res.statusCode = 404
    res.end()
    return
  }
  const stream = fs.createReadStream(full)
  stream.on('error', () => {
    if (res.headersSent) {
      // Partway through: ending normally would look like a complete file.
      res.destroy()
      return
    }
    res.statusCode = 404
    res.removeHeader('content-type')
    res.end()
  })
  res.on('close', () => { stream.destroy() })
  stream.pipe(res)
}

export function resolveInside (root: string, url: string): string | null {
  const clean = url.split(/[?#]/, 1)[0]
  const base = path.resolve(root)
  const full = path.resolve(base, `.${path.posix.sep}${clean}`)
  return full.startsWith(base + path.sep) ? full : null
}
