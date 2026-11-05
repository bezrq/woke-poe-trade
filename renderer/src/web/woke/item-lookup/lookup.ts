// The in-overlay page for an item: which sites it has, their links, and what a
// hotkey does while the page is open.
import { shallowRef } from 'vue'
import type { ParsedItem } from '@/parser'

export type LookupTab = 'wiki' | 'poedb' | 'coe'

export const TAB_LABELS: Record<LookupTab, string> = {
  wiki: 'Wiki',
  poedb: 'poedb',
  coe: 'Craft of Exile'
}

export type LookupKeys = Record<LookupTab, string | null>

export interface LookupRequest {
  item: ParsedItem
  tab: LookupTab
  // Screen position of the hotkey press, which picks the panel's side.
  position?: { x: number, y: number }
}

// Read by the item info widget, which shows the panel.
export const lookupRequest = shallowRef<LookupRequest | null>(null)

const POEDB_LANGS: Record<string, string> = {
  'en': 'us',
  'ru': 'ru',
  'cmn-Hant': 'tw',
  'ko': 'kr'
}

type UrlItem = Pick<ParsedItem, 'rawText'> & { info: Pick<ParsedItem['info'], 'refName'> }

export function lookupUrl (tab: LookupTab, item: UrlItem, language: string): string {
  const refName = item.info.refName
  switch (tab) {
    case 'wiki':
      return `https://www.poewiki.net/wiki/${encodeURIComponent(refName.replaceAll(' ', '_'))}`
    case 'poedb': {
      const slug = encodeURIComponent(refName.replaceAll("'", '').replaceAll(' ', '_'))
      return `https://poedb.tw/${POEDB_LANGS[language] ?? 'us'}/${slug}`
    }
    case 'coe':
      return `https://craftofexile.com/?game=poe1&eimport=${encodeURIComponent(item.rawText)}`
  }
}

type CraftFacts = { info: { craftable?: unknown }, isCorrupted: boolean, isMirrored?: boolean }

export function canCraft (item: CraftFacts): boolean {
  return Boolean(item.info.craftable) && !item.isCorrupted && !item.isMirrored
}

// Craft of Exile can't do anything with a corrupted or mirrored item, so it only
// gets a tab for those when you asked for it by its hotkey.
export function lookupTabs (item: CraftFacts, opened: LookupTab): LookupTab[] {
  return canCraft(item) || opened === 'coe' ? ['wiki', 'poedb', 'coe'] : ['wiki', 'poedb']
}

export type LookupKeyAction =
  { type: 'popout' } |
  { type: 'switch', tab: LookupTab } |
  null

// The key of the tab you're on sends it to your browser; another tab's key goes
// to that tab, if the item has it.
export function lookupKeyAction (key: string, active: LookupTab, tabs: LookupTab[], keys: LookupKeys): LookupKeyAction {
  if (keys[active] === key) return { type: 'popout' }
  const tab = tabs.find(t => keys[t] === key)
  return tab ? { type: 'switch', tab } : null
}

// Only web pages go out to the OS shell, whatever a page navigated to.
export function popOutUrl (current: string | undefined, fallback: string): string {
  if (!current) return fallback
  try {
    const { protocol } = new URL(current)
    return protocol === 'https:' || protocol === 'http:' ? current : fallback
  } catch {
    return fallback
  }
}

// A key press this soon after opening is a held key or a double tap, not a
// request to leave the overlay.
export const POP_OUT_GUARD_MS = 400
