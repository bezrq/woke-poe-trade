import { shallowRef } from 'vue'
import type { Widget, Anchor } from '@/web/overlay/widgets'
import { importList, matchesQuery, nextId, str, strList } from '../shared/library'
import { DEFAULT_ATLAS_DATA_URL, parseAtlasData } from './tree'
import type { AtlasNode } from './tree'
import { perfTimeAsync, whenIdle } from '../shared/perf'

export const ATLAS_TYPE = 'woke-atlas-strategies'

export interface AtlasStrategy {
  id: number
  name: string
  league: string
  tags: string[]
  treeUrl: string
  // Scarabs, one per line ("4x Ambush Scarab of Potency").
  scarabs: string
  // Map device, map crafting, sextants, etc.
  device: string
  // Map mod regex for this strategy.
  regex: string
  notes: string
}

export interface AtlasWidget extends Widget {
  anchor: Anchor
  dataUrl: string
  selectedId: number | null
  strategies: AtlasStrategy[]
}

export function emptyStrategy (list: AtlasStrategy[]): AtlasStrategy {
  return { id: nextId(list), name: '', league: '', tags: [], treeUrl: '', scarabs: '', device: '', regex: '', notes: '' }
}

export function strategyMatches (s: AtlasStrategy, query: string): boolean {
  return matchesQuery([s.name, s.league, s.notes, s.scarabs, s.device, ...s.tags], query)
}

export function parseStrategiesImport (json: string, existing: AtlasStrategy[]): AtlasStrategy[] {
  let id = nextId(existing)
  return importList(json)
    .filter(r => typeof r.name === 'string' || typeof r.treeUrl === 'string')
    .map(r => ({
      id: id++,
      name: str(r.name) || 'Imported strategy',
      league: str(r.league),
      tags: strList(r.tags),
      treeUrl: str(r.treeUrl),
      scarabs: str(r.scarabs),
      device: str(r.device),
      regex: str(r.regex),
      notes: str(r.notes)
    }))
}

export function exportStrategies (list: AtlasStrategy[]): string {
  return JSON.stringify(list.map(({ name, league, tags, treeUrl, scarabs, device, regex, notes }) =>
    ({ name, league, tags, treeUrl, scarabs, device, regex, notes })), null, 2)
}

// Atlas tree data (about 1.4 MB), cached in localStorage and downloaded again
// only when the cache is a week old, so startup doesn't refetch it every time.
const CACHE_KEY = 'woke-atlas-data'
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const atlasData = shallowRef<Map<number, AtlasNode> | null>(null)
const atlasDataError = shallowRef('')
let loadingUrl: string | null = null

export function useAtlasData (url: string) {
  const target = url || DEFAULT_ATLAS_DATA_URL
  if (loadingUrl !== target) {
    loadingUrl = target
    atlasDataError.value = ''
    // Off the startup path: reading the cache parses a large JSON.
    whenIdle(() => {
      perfTimeAsync('Atlas: load tree data', load(target)).catch((err: Error) => {
        if (loadingUrl === target) atlasDataError.value = err.message
      })
    })
  }
  return { atlasData, atlasDataError }
}

// After a failed download: try the same URL again.
export function retryAtlasData (url: string) {
  loadingUrl = null
  return useAtlasData(url)
}

async function load (url: string) {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { url: cachedUrl, json, at } = JSON.parse(cached) as { url: string, json: unknown, at?: number }
      if (cachedUrl === url) {
        atlasData.value = parseAtlasData(json)
        if (at && Date.now() - at < CACHE_MAX_AGE_MS) return
      }
    }
  } catch {}

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Atlas data download failed (${res.status})`)
  const json: unknown = await res.json()
  const parsed = parseAtlasData(json)
  atlasData.value = parsed
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ url, json, at: Date.now() }))
  } catch {}
}
