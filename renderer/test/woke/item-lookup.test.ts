import { describe, it, expect } from 'vitest'
import { canCraft, lookupKeyAction, lookupTabs, lookupUrl, popOutUrl } from '@/web/woke/item-lookup/lookup'
import type { LookupKeys } from '@/web/woke/item-lookup/lookup'

const item = { rawText: 'Rarity: Rare\n+1% & more', info: { refName: "Maligaro's Virtuosity" } }
const keys: LookupKeys = { wiki: 'Alt + W', poedb: null, coe: 'Alt + C' }
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
