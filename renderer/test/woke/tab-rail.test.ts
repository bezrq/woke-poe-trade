import { describe, expect, it } from 'vitest'
import { groupByModule, looksLikeItem, migrateToRail, parseWidgetTitle } from '@/web/woke/tab-bar/tools'
import type { TabBarConfig } from '@/web/woke/tab-bar/tools'

function menu (extra: Partial<TabBarConfig> = {}): TabBarConfig {
  return {
    wmId: 1,
    wmType: 'menu',
    wmTitle: '',
    wmWants: 'show',
    wmZorder: 1,
    wmFlags: [],
    anchor: { pos: 'tl', x: 5, y: 5 },
    alwaysShow: false,
    ...extra
  }
}

const widgets = [
  { wmId: 5, wmType: 'settings', wmTitle: '{icon=fa-cog}' },
  { wmId: 6, wmType: 'item-search', wmTitle: '{icon=fa-search}' },
  { wmId: 103, wmType: 'image-strip', wmTitle: 'Cheat sheets' },
  { wmId: 106, wmType: 'woke-boss-runs', wmTitle: 'Boss runs' },
  { wmId: 108, wmType: 'woke-market-tracker', wmTitle: 'Market tracker' },
  { wmId: 110, wmType: 'woke-map-scan', wmTitle: 'Map scan' },
  { wmId: 118, wmType: 'woke-loot-filter', wmTitle: 'Loot filter' },
  { wmId: 119, wmType: 'woke-challenges', wmTitle: 'Challenges' }
]

describe('moving a config to the rail', () => {
  it('keeps the icon-only tools and the default pins, and moves the rail below the buffs', () => {
    const config = menu({ pinned: [5, 6, 103, 106, 108, 110, 118, 119], dismissed: [112] })
    migrateToRail(config, widgets)
    expect(config.pinned).toEqual([5, 6, 108, 106, 110, 118])
    expect(config.anchor).toEqual({ pos: 'tl', x: 0, y: 10.5 })
    expect(config.dismissed).toBeUndefined()
    expect(config.rail).toBe(true)
  })

  it('works on a fresh config with no pins yet', () => {
    const config = menu()
    migrateToRail(config, widgets)
    expect(config.pinned).toContain(5)
    expect(config.rail).toBe(true)
  })

  it('runs once, so later pins and a dragged rail stay', () => {
    const config = menu()
    migrateToRail(config, widgets)
    config.pinned = [119]
    config.anchor = { pos: 'tr', x: 100, y: 20 }
    migrateToRail(config, widgets)
    expect(config.pinned).toEqual([119])
    expect(config.anchor).toEqual({ pos: 'tr', x: 100, y: 20 })
  })

  it('pins only one window of a type', () => {
    const config = menu()
    migrateToRail(config, [...widgets, { wmId: 200, wmType: 'woke-map-scan', wmTitle: 'Map scan' }])
    expect(config.pinned!.filter(id => id === 110 || id === 200)).toEqual([110])
  })

  it('skips default pins the player does not have', () => {
    const config = menu()
    migrateToRail(config, widgets.slice(0, 2))
    expect(config.pinned).toEqual([5, 6])
  })
})

describe('window titles', () => {
  it('splits an icon from a title', () => {
    expect(parseWidgetTitle('{icon=fa-cog}')).toEqual({ icon: 'fa-cog', title: '' })
    expect(parseWidgetTitle('{icon=fa-cog} Hi')).toEqual({ icon: 'fa-cog', title: 'Hi' })
    expect(parseWidgetTitle('Boss runs')).toEqual({ icon: undefined, title: 'Boss runs' })
  })
})

describe('telling an item from a search', () => {
  it('takes copied item text, with either line ending', () => {
    expect(looksLikeItem('Item Class: Rings\nRarity: Rare\nHate Knuckle\nRuby Ring\n--------\nItem Level: 80\n')).toBe(true)
    expect(looksLikeItem('Item Class: Rings\r\nRarity: Rare\r\nHate Knuckle\r\n--------\r\nItem Level: 80\r\n')).toBe(true)
  })

  it('leaves ordinary text as a search', () => {
    expect(looksLikeItem('boss runs')).toBe(false)
    expect(looksLikeItem('')).toBe(false)
    expect(looksLikeItem('a ---------- b')).toBe(false)
  })
})

describe('launcher groups', () => {
  it('sorts tools into module groups, the rest under Overlay, and keeps empty groups', () => {
    const groups = groupByModule([{ wmType: 'woke-boss-runs' }, { wmType: 'image-strip' }])
    expect(groups.map(g => g.label)).toEqual(['Economy', 'Mapping', 'Campaign & lab', 'Builds & trade', 'Overlay'])
    expect(groups[0].items).toEqual([{ wmType: 'woke-boss-runs' }])
    expect(groups[1].items).toEqual([])
    expect(groups[4].items).toEqual([{ wmType: 'image-strip' }])
  })
})
