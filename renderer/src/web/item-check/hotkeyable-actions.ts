import { Host } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import { ParsedItem, parseClipboard } from '@/parser'
import { BOOKMARKS_TARGET, lookupRequest, lookupUrl } from '@/web/woke/item-lookup/lookup'
import type { LookupTab } from '@/web/woke/item-lookup/lookup'

const LOOKUP_TARGETS: Record<string, LookupTab> = {
  'open-wiki': 'wiki',
  'open-poedb': 'poedb',
  'open-craft-of-exile': 'coe'
}

export function registerActions () {
  Host.onEvent('MAIN->CLIENT::widget-action', (e) => {
    if (e.target === BOOKMARKS_TARGET && Host.isElectron) {
      lookupRequest.value = { item: null, tab: 'bookmarks' }
    }
  })
  Host.onEvent('MAIN->CLIENT::item-text', (e) => {
    const tab = LOOKUP_TARGETS[e.target]
    if (!tab && e.target !== 'search-similar') return
    const parsed = parseClipboard(e.clipboard)
    if (!parsed.isOk()) {
      // Main already gave the overlay focus for the panel that isn't coming.
      if (tab && e.focusOverlay && Host.isElectron) {
        Host.sendEvent({ name: 'OVERLAY->MAIN::focus-game', payload: undefined })
      }
      return
    }

    if (tab) {
      openLookup(parsed.value, tab, e.position)
    } else {
      findSimilarItems(parsed.value)
    }
  })
}

function openLookup (item: ParsedItem, tab: LookupTab, position?: { x: number, y: number }) {
  if (Host.isElectron) {
    lookupRequest.value = { item, tab, position }
  } else {
    window.open(lookupUrl(tab, item, AppConfig().language))
  }
}

export function openWiki (item: ParsedItem) {
  openLookup(item, 'wiki')
}
export function openPoedb (item: ParsedItem) {
  openLookup(item, 'poedb')
}
export function openCoE (item: ParsedItem) {
  openLookup(item, 'coe')
}

export function findSimilarItems (item: ParsedItem) {
  const text = JSON.stringify(item.info.name)
  Host.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}
