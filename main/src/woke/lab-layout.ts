// Finds today's layout image on a poelab.com page, for the lab dock icon.
// Fetched here because the overlay can't read another site's page.
import { net } from 'electron'

const ALLOWED_HOST = /(^|\.)poelab\.com$/i

export async function labLayoutImage (args: { url: string }): Promise<string | null> {
  const url = new URL(String(args?.url ?? ''))
  if (url.protocol !== 'https:' || !ALLOWED_HOST.test(url.hostname)) throw new Error('Only poelab.com pages')
  const res = await net.fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
  if (!res.ok) throw new Error(`poelab answered ${res.status}`)
  const html = await res.text()
  return findLayoutImage(html, url.toString())
}

// Same rule as the page script: the image with id notesImg, or else the first
// image from the labfiles folder.
export function findLayoutImage (html: string, pageUrl = 'https://www.poelab.com/'): string | null {
  const tags = html.match(/<img\b[^>]*>/gi) ?? []
  const srcOf = (tag: string) => /\ssrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? null
  const notes = tags.find(t => /\sid\s*=\s*["']notesImg["']/i.test(t))
  const pick = (notes && srcOf(notes)) ?? tags.map(srcOf).find(src => src != null && /labfiles/i.test(src)) ?? null
  if (!pick) return null
  // Relative ("/wp-content/labfiles/...") and protocol-relative srcs too.
  let abs: URL
  try { abs = new URL(pick.replace(/&amp;/g, '&'), pageUrl) } catch { return null }
  return abs.protocol === 'https:' ? abs.toString() : null
}
