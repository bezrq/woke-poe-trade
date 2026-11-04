// League start dates from GGG's public league list (the same endpoint APT
// already uses to pick the trade league; APT just ignores `startAt`).
import { Host } from '@/web/background/IPC'
import { poeWebApi } from '@/web/Config'

let cache: Promise<Map<string, string>> | null = null

export function leagueStartDates (): Promise<Map<string, string>> {
  if (!cache) {
    cache = (async () => {
      const response = await Host.proxy(`${poeWebApi()}/api/leagues?type=main&realm=pc`)
      if (!response.ok) throw new Error(`League list: HTTP ${response.status}`)
      const leagues = await response.json() as Array<{ id: string, startAt?: string | null }>
      const out = new Map<string, string>()
      for (const l of leagues) {
        if (l.startAt) out.set(l.id, l.startAt.slice(0, 10))
      }
      return out
    })()
    cache.catch(() => { cache = null })
  }
  return cache
}

export function leagueDay (start: string, now = Date.now()): number {
  return Math.floor((now - Date.parse(start + 'T00:00:00Z')) / 86400000)
}
