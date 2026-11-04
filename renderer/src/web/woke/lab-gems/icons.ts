// Gem icons from APT's bundled item data (web.poecdn.com URLs). The lookup
// parses an ndjson line, so results are memoised per gem name; the images
// themselves are kept by Chromium's HTTP cache across restarts.
import { ITEM_BY_REF } from '@/assets/data'

const cache = new Map<string, string | null>()

export function gemIcon (name: string): string | null {
  let icon = cache.get(name)
  if (icon === undefined) {
    icon = ITEM_BY_REF('GEM', name)?.[0]?.icon || null
    cache.set(name, icon)
  }
  return icon
}
