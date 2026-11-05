import { describe, it, expect } from 'vitest'
import { canCraft, lookupKeyAction, lookupTabs, lookupUrl, matchBookmarks, popOutUrl, toggleBookmark } from '@/web/woke/item-lookup/lookup'
import type { LookupKeys } from '@/web/woke/item-lookup/lookup'

const item = { rawText: 'Rarity: Rare\n+1% & more', info: { refName: "Maligaro's Virtuosity" } }
const keys: LookupKeys = { wiki: 'Alt + W', poedb: null, coe: 'Alt + C', bookmarks: null }
const craftable = { info: { craftable: true }, isCorrupted: false, isMirrored: false }

describe('lookupUrl', () => {
  it('links each site for the item', () => {
    expect(lookupUrl('wiki', item, 'en')).toBe("https://www.poewiki.net/wiki/Maligaro's_Virtuosity")
    expect(lookupUrl('poedb', item, 'ko')).toBe('https://poedb.tw/kr/Maligaros_Virtuosity')
    expect(lookupUrl('coe', item, 'en')).toBe('https://craftofexile.com/?game=poe1&eimport=Rarity%3A%20Rare%0A%2B1%25%20%26%20more')
  })

  it('keeps a name with a query character inside the path', () => {
    expect(lookupUrl('wiki', { rawText: '', info: { refName: 'What? Item' } }, 'en')).toBe('https://www.poewiki.net/wiki/What%3F_Item')
  })
})

describe('lookupTabs', () => {
  it('offers Craft of Exile only for items that can be crafted', () => {
    expect(canCraft(craftable)).toBe(true)
    expect(lookupTabs(craftable, 'wiki')).toEqual(['wiki', 'poedb', 'coe'])
    expect(lookupTabs({ ...craftable, isCorrupted: true }, 'wiki')).toEqual(['wiki', 'poedb'])
    expect(lookupTabs({ ...craftable, isMirrored: true }, 'poedb')).toEqual(['wiki', 'poedb'])
  })

  it('keeps the tab you asked for by its key', () => {
    expect(lookupTabs({ ...craftable, isCorrupted: true }, 'coe')).toEqual(['wiki', 'poedb', 'coe'])
    expect(lookupTabs(null, 'bookmarks')).toEqual([])
  })
})

describe('lookupKeyAction', () => {
  const tabs = ['wiki', 'poedb', 'coe'] as const

  it('pops out on the key of the tab you are on', () => {
    expect(lookupKeyAction('Alt + W', 'wiki', [...tabs], keys)).toEqual({ type: 'popout' })
  })

  it('switches on the key of another tab', () => {
    expect(lookupKeyAction('Alt + C', 'wiki', [...tabs], keys)).toEqual({ type: 'switch', tab: 'coe' })
  })

  it('ignores a tab the item does not have and other keys', () => {
    expect(lookupKeyAction('Alt + C', 'wiki', ['wiki', 'poedb'], keys)).toBeNull()
    expect(lookupKeyAction('Alt + Q', 'wiki', [...tabs], keys)).toBeNull()
  })
})

describe('popOutUrl', () => {
  const fallback = 'https://www.poewiki.net/wiki/Ring'

  it('uses the page you navigated to', () => {
    expect(popOutUrl('https://www.poewiki.net/wiki/Other', fallback)).toBe('https://www.poewiki.net/wiki/Other')
  })

  it('never sends anything but a web page to the shell', () => {
    expect(popOutUrl('file:///C:/Windows/calc.exe', fallback)).toBe(fallback)
    expect(popOutUrl('about:blank', fallback)).toBe(fallback)
    expect(popOutUrl('not a url', fallback)).toBe(fallback)
    expect(popOutUrl('', fallback)).toBe(fallback)
    expect(popOutUrl(undefined, fallback)).toBe(fallback)
  })
})

describe('bookmarks', () => {
  const saved = [{ id: 3, name: 'Fossils', url: 'https://www.poewiki.net/wiki/Fossil' }]

  it('saves a page under its title with a fresh id', () => {
    expect(toggleBookmark(saved, 'https://poedb.tw/us/Ring', ' Ring ')).toEqual([
      ...saved, { id: 4, name: 'Ring', url: 'https://poedb.tw/us/Ring' }
    ])
  })

  it('names an untitled page after its site', () => {
    expect(toggleBookmark([], 'https://poedb.tw/us/Ring', '')[0]).toEqual({ id: 1, name: 'poedb.tw', url: 'https://poedb.tw/us/Ring' })
  })

  it('removes a page that is already saved', () => {
    expect(toggleBookmark(saved, saved[0].url, 'Fossils')).toEqual([])
  })

  it('never saves anything but a web page', () => {
    expect(toggleBookmark(saved, 'file:///C:/x', 'x')).toBe(saved)
    expect(toggleBookmark(saved, undefined, 'x')).toBe(saved)
  })

  it('filters by name or link, and hides a bad link from a hand-edited config', () => {
    const list = [...saved, { id: 4, name: 'Bad', url: 'javascript:alert(1)' }]
    expect(matchBookmarks(list, '')).toEqual(saved)
    expect(matchBookmarks(list, 'FOSS')).toEqual(saved)
    expect(matchBookmarks(list, 'poewiki')).toEqual(saved)
    expect(matchBookmarks(list, 'nope')).toEqual([])
  })

  it('switches to bookmarks on their key, and does nothing when already there', () => {
    const k: LookupKeys = { ...keys, bookmarks: 'Alt + B' }
    expect(lookupKeyAction('Alt + B', 'wiki', ['wiki'], k)).toEqual({ type: 'switch', tab: 'bookmarks' })
    expect(lookupKeyAction('Alt + B', 'bookmarks', ['wiki'], k)).toBeNull()
  })

  it('has no pop-out key on a saved page or the list', () => {
    expect(lookupKeyAction('Alt + W', 'page', ['wiki'], keys)).toEqual({ type: 'switch', tab: 'wiki' })
    expect(lookupKeyAction('Alt + W', 'bookmarks', [], keys)).toBeNull()
  })
})
