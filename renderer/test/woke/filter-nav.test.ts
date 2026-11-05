// The rule list's drilldown, on NeverSink's real filter at every strictness.
import { describe, it, expect, beforeAll } from 'vitest'
import { NAV_CATEGORIES, allSpots, buildNav, categoryOf, chapterLabel, filterNav, findSpot, isLevelling, levelUp, openCategory, shortGroupName } from '@/web/woke/loot-filter/nav'
import { buildTree, groupName } from '@/web/woke/loot-filter/groups'
import type { GroupNode } from '@/web/woke/loot-filter/groups'
import { parseFilter } from '@/web/woke/loot-filter/parse'
import { gameIcon } from '@/web/woke/ui/game-icons'
import { loadGameData } from '../helpers/game-data'
import { LEVELS, neverSink } from '../helpers/neversink'

beforeAll(loadGameData)

const treeOf = (level: typeof LEVELS[number]) => buildTree(parseFilter(neverSink(level)))
const name = (g: GroupNode) => groupName(g.type)

describe.each(LEVELS)('%s', (level) => {
  const tree = treeOf(level)
  const nav = buildNav(tree)

  it('lists every group exactly once', () => {
    const inTree = tree.flatMap(s => s.groups.map(g => g.type)).sort()
    expect(allSpots(nav).map(s => s.group.type).sort()).toEqual(inTree)
  })

  it('puts every NeverSink group in a real category', () => {
    expect(allSpots(nav).filter(s => s.category.id === 'other').map(s => s.group.type)).toEqual([])
  })

  it('endgame and campaign split the list between them, with nothing lost', () => {
    const end = allSpots(buildNav(tree, 'endgame')).map(s => s.group.type)
    const camp = allSpots(buildNav(tree, 'campaign')).map(s => s.group.type)
    expect(end.length).toBeGreaterThan(50)
    expect(camp.length).toBeGreaterThan(20)
    expect(end.some(t => camp.includes(t))).toBe(false)
    expect([...end, ...camp].sort()).toEqual(allSpots(nav).map(s => s.group.type).sort())
  })

  it('every group is reached in at most three clicks, with short lists on the way', () => {
    expect(nav.length).toBeLessThanOrEqual(NAV_CATEGORIES.length)
    for (const c of nav) {
      expect(c.chapters.length, c.label).toBeLessThanOrEqual(15)
      for (const ch of c.chapters) expect(ch.groups.length, ch.id).toBeLessThanOrEqual(15)
    }
  })
})

describe('where groups go', () => {
  it.each([
    ['currency', 'Currency - Regular Currency Tiering', 'currency'],
    ['currency->essence', 'Currency - Special', 'currency'],
    ['currency->leveling', 'Currency - Leveling Exceptions', 'currency'],
    ['fragments->scarabs', 'Fragments', 'fragments'],
    ['divination', 'Divination Cards', 'cards'],
    ['uniques->replicas', 'REPLICA AND FOULBORN UNIQUES', 'uniques'],
    ['maps->blighted', 'Special Maps', 'maps'],
    ['gems->exceptional', 'Gem Tierlists', 'gems'],
    ['rareid', 'IDENTIFIED MOD FILTERING - COMBINATIONS', 'rare'],
    ['exoticbases', 'Exotic Bases', 'crafting'],
    ['jewels->cluster', 'Jewels', 'jewels'],
    ['endgameflasks', 'Endgame Flasks & Tinctures', 'flasks'],
    ['leveling->flasks->life', 'Leveling - Life, Mana, Hybrid', 'flasks'],
    ['heist->cloak', 'Heist Gear', 'heist'],
    ['exotic->fractured', 'Exotic Item Variations', 'exotic'],
    ['leveling->rare->archer', 'Leveling - Rules', 'levelling'],
    ['woke->own', 'Your own rules', 'yours'],
    ['untagged:Mine', 'Mine', 'other']
  ])('%s goes to %s', (type, section, cat) => {
    expect(categoryOf(type, section)).toBe(cat)
  })

  it('knows what is levelling by its tag or chapter', () => {
    expect(isLevelling('leveling->rare->armours', 'x')).toBe(true)
    expect(isLevelling('hidelayer', 'Hide outdated leveling flasks')).toBe(true)
    expect(isLevelling('rareid', 'IDENTIFIED')).toBe(false)
  })

  it('your own rules show in every mode', () => {
    const tree = [{ title: 'Your own rules', groups: [{ type: 'woke->own', section: '', tiers: [], blockCount: 0, hidden: false }] }]
    for (const mode of ['endgame', 'campaign', 'all'] as const) expect(allSpots(buildNav(tree, mode))).toHaveLength(1)
  })

  it('a filter with no tags still reads, by its own chapters', () => {
    const tree = buildTree(parseFilter('#[[1000]] Mine\nShow\n\tRarity Rare\n\n#[[2000]] Theirs\nHide\n\tRarity Magic\n'))
    const nav = buildNav(tree)
    expect(nav.map(c => c.id)).toEqual(['other'])
    expect(nav[0].chapters.map(c => c.title)).toEqual(['Mine', 'Theirs'])
  })
})

describe('chapter names', () => {
  it('reads NeverSink\'s by the shorter name, in any capitals', () => {
    expect(chapterLabel('Currency - Special')).toBe('League')
    expect(chapterLabel('Currency - SPECIAL')).toBe('League')
    expect(chapterLabel('Endgame - Rare - Exotic Veiled')).toBe('Endgame rares')
    expect(chapterLabel('Leveling - Rules')).toBe('Rules')
    expect(chapterLabel('Gem Tierlists')).toBe('Gem Tierlists')
    expect(chapterLabel('My own chapter')).toBe('My own chapter')
  })

  it('leaves out of a group\'s name what the list already says', () => {
    expect(shortGroupName('Currency › Essence')).toBe('Essence')
    expect(shortGroupName('Levelling › Rare › Minion')).toBe('Rare › Minion')
    expect(shortGroupName('Gold')).toBe('Gold')
  })

  it('no category has a chapter that only differs by capitals, or a chapter with one group among many', () => {
    const nav = buildNav(treeOf('1-REGULAR'))
    for (const c of nav) {
      const names = c.chapters.map(ch => ch.title.toLowerCase())
      expect(new Set(names).size, c.label).toBe(names.length)
    }
    const rare = nav.find(c => c.id === 'rare')!
    expect(rare.chapters.map(ch => ch.title)).toEqual(['Influence and eldritch', 'Identified mods', 'High priority', 'Endgame rares', 'Other'])
  })
})

describe('short categories', () => {
  const nav = buildNav(treeOf('1-REGULAR'))

  it('read as one list', () => {
    for (const id of ['uniques', 'fragments', 'heist', 'gems']) {
      const cat = nav.find(c => c.id === id)!
      expect(cat.chapters, id).toHaveLength(1)
      expect(cat.chapters[0].title).toBe(cat.label)
      expect(cat.chapters[0].groups).toHaveLength(cat.groupCount)
    }
  })

  it('a long one keeps its chapters, until the switch makes it short', () => {
    const tree = treeOf('1-REGULAR')
    expect(buildNav(tree, 'all').find(c => c.id === 'flasks')!.chapters.map(c => c.title)).toEqual(['Endgame', 'Levelling'])
    expect(buildNav(tree, 'endgame').find(c => c.id === 'flasks')!.chapters).toHaveLength(1)
  })

  it('normal crafting bases are crafting, and not campaign-only', () => {
    expect(findSpot(nav, 'normalcraft->extra')?.category.id).toBe('crafting')
  })

  it('endgame shows no levelling category', () => {
    expect(buildNav(treeOf('1-REGULAR'), 'endgame').map(c => c.id)).not.toContain('levelling')
  })
})

describe('moving around', () => {
  const nav = buildNav(treeOf('1-REGULAR'))
  const multi = nav.find(c => c.chapters.length > 1)!
  const single = nav.find(c => c.chapters.length === 1)!

  it('a category with one chapter skips straight to its groups', () => {
    expect(openCategory(multi)).toEqual({ cat: multi.id, chapter: null })
    expect(openCategory(single)).toEqual({ cat: single.id, chapter: single.chapters[0].id })
  })

  it('going up skips the level that was skipped coming in', () => {
    expect(levelUp(nav, { cat: multi.id, chapter: multi.chapters[0].id })).toEqual({ cat: multi.id, chapter: null })
    expect(levelUp(nav, { cat: multi.id, chapter: null })).toEqual({ cat: null, chapter: null })
    expect(levelUp(nav, { cat: single.id, chapter: single.chapters[0].id })).toEqual({ cat: null, chapter: null })
    expect(levelUp(nav, { cat: null, chapter: null })).toEqual({ cat: null, chapter: null })
  })

  it('finds where a group lives', () => {
    const spot = findSpot(nav, 'currency->essence')
    expect(spot?.category.id).toBe('currency')
    expect(findSpot(nav, 'nope')).toBeNull()
    expect(findSpot(nav, null)).toBeNull()
  })
})

describe('the filter box', () => {
  const nav = buildNav(treeOf('1-REGULAR'))

  it('searches every level, group names first', () => {
    const found = filterNav(nav, 'foss', name)
    expect(found[0].group.type).toBe('currency->fossil')
    expect(filterNav(nav, 'jewels', name).length).toBeGreaterThan(3)
  })

  it('finds a category or chapter by name too', () => {
    expect(filterNav(nav, 'heist', name).every(s => /heist/i.test(`${name(s.group)} ${s.chapter.title} ${s.category.label}`))).toBe(true)
  })

  it('finds nothing for nothing', () => {
    expect(filterNav(nav, '   ', name)).toEqual([])
    expect(filterNav(nav, 'zzzz', name)).toEqual([])
  })
})

describe('category pictures', () => {
  it.each(NAV_CATEGORIES.filter(c => c.icon).map(c => [c.label, c.icon!] as const))('%s has one in the game data', (_label, icon) => {
    expect(gameIcon(icon.name, icon.ns)).toBeTruthy()
  })
})
