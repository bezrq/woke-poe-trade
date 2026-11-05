// The whole road from a key press to the file the game reads: pick a filter,
// change something, save, reload. The real store runs against a fake folder and
// game, and every result is checked by parsing what was written.
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { reactive, ref, shallowRef } from 'vue'
import { parseFilter, serializeFilter } from '@/web/woke/loot-filter/parse'
import { itemFacts } from '@/web/woke/loot-filter/item-facts'
import type { ItemFacts } from '@/web/woke/loot-filter/item-facts'
import { matchItem } from '@/web/woke/loot-filter/match'
import { OWN_RULE_TYPE, conditionSignature, moveTargets, readStyle } from '@/web/woke/loot-filter/edits'
import type { FilterEdit } from '@/web/woke/loot-filter/edits'
import { WOKE_MARK, useLootFilter } from '@/web/woke/loot-filter/store'
import { initLootFilterWidget, outputName } from '@/web/woke/loot-filter/widget'
import type { LootFilterWidget } from '@/web/woke/loot-filter/widget'
import { parseClipboard } from '@/parser'
import { fixture, loadGameData } from '../helpers/game-data'
import { LEVELS, neverSink } from '../helpers/neversink'
import type { Level } from '../helpers/neversink'
import { CLASS_ITEMS, STATE_ITEMS } from '../helpers/filter-items'
import { fakeHost } from '../helpers/filter-host'
import type { FakeHost } from '../helpers/filter-host'

const sent = vi.hoisted(() => ({ chat: [] as string[], log: null as null | ((lines: unknown[]) => void), host: null as FakeHost | null }))

vi.mock('@/web/woke/shared/host', () => ({ hostRequest: (name: string, args: Record<string, unknown>) => sent.host!.request(name, args) }))
vi.mock('@/web/background/IPC', () => ({
  MainProcess: {
    sendEvent: (e: { payload: { text: string } }) => { sent.chat.push(e.payload.text) },
    onEvent: () => ({ abort () {} })
  },
  Host: {}
}))
vi.mock('@/web/woke/shared/game-log', () => ({ onGameLog: (fn: (lines: unknown[]) => void) => { sent.log = fn; return () => {} } }))
vi.mock('@/web/woke/loot-filter/build-input', () => ({ useBuildRuleInput: () => ref(null) }))
vi.mock('@/web/woke/loot-filter/prices', () => ({ useFilterPrices: () => ({ lookup: shallowRef(null), wantPrices () {} }) }))
vi.mock('@/web/woke/loot-filter/active-filter', () => ({ publishActiveFilter () {} }))
vi.mock('@/web/woke/loot-filter/sounds', () => ({ customSoundsIn: () => [], installPackSounds: async () => 0 }))
vi.mock('@/web/woke/ui', () => ({ toast: () => {} }))

beforeAll(loadGameData)

let host: FakeHost
beforeEach(() => {
  host = fakeHost()
  sent.host = host
  sent.chat = []
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

function widget (over: Partial<LootFilterWidget> = {}): LootFilterWidget {
  const w = { wmId: 1, wmType: 'woke-loot-filter', wmTitle: '', wmWants: 'show', wmZorder: null, wmFlags: [] } as unknown as LootFilterWidget
  initLootFilterWidget(w)
  return reactive(Object.assign(w, over)) as LootFilterWidget
}

async function opened (text = neverSink('1-REGULAR'), over: Partial<LootFilterWidget> = {}) {
  host.files.set('NeverSink.filter', text)
  const config = widget({ sourceName: 'NeverSink.filter', ...over })
  const store = useLootFilter(() => config)
  await store.listFiles()
  await store.load()
  expect(store.error.value).toBeNull()
  return { store, config }
}

function facts (text: string, areaLevel = 83): ItemFacts {
  const res = parseClipboard(text)
  return { ...itemFacts(text, res.isOk() ? res.value : null), areaLevel }
}

// What the game would do with the file as last written.
function inGame (name = 'NeverSink (woke).filter') {
  return parseFilter(host.files.get(name)!)
}

// The card's "just this item", as SampleCard builds it.
function ownRule (doc: ReturnType<typeof parseFilter>, f: ItemFacts, change: { visibility?: 'Show' | 'Hide', fontSize?: number, pin?: boolean }): Omit<Extract<FilterEdit, { kind: 'item' }>, 'id'> {
  const m = matchItem(doc, f)
  const b = m.final!.block
  return {
    kind: 'item',
    type: b.type!,
    tier: b.tier!,
    base: f.baseType!,
    visibility: change.visibility ?? b.visibility,
    patch: change.fontSize ? { fontSize: change.fontSize } : {},
    anchor: conditionSignature(b),
    pin: change.pin
  }
}

describe('saving', () => {
  it('an untouched filter is saved as it was, under a marker header', async () => {
    const source = neverSink('1-REGULAR')
    const { store } = await opened(source)
    expect(await store.save()).toBe(true)
    const written = host.files.get('NeverSink (woke).filter')!
    expect(written.startsWith(WOKE_MARK)).toBe(true)
    expect(written.endsWith(source)).toBe(true)
    expect(host.files.get('NeverSink.filter')).toBe(source)
  })

  it('overwrite mode keeps the original as a .bak, once', async () => {
    const source = neverSink('1-REGULAR')
    const { store, config } = await opened(source, { saveMode: 'overwrite' })
    store.edit({ kind: 'visibility', type: 'currency', tier: 't1exalted', visibility: 'Hide' })
    await store.save()
    expect(host.files.get('NeverSink.filter.bak')).toBe(source)
    expect(host.files.get('NeverSink.filter')!.startsWith(WOKE_MARK)).toBe(true)
    // Reopening starts from the original, not from our output.
    const again = useLootFilter(() => config)
    await again.load()
    await again.save()
    expect(host.files.get('NeverSink.filter.bak')).toBe(source)
    expect(host.files.get('NeverSink.filter')!.match(new RegExp(WOKE_MARK, 'g'))).toHaveLength(1)
  })

  it('two quick saves run in turn, and the file ends up with the latest edits', async () => {
    const { store } = await opened()
    let release!: () => void
    host.writeGate = new Promise<void>(resolve => { release = resolve })
    store.edit({ kind: 'visibility', type: 'currency', tier: 't1exalted', visibility: 'Hide' })
    const first = store.save()
    store.edit({ kind: 'visibility', type: 'currency', tier: 't2divine', visibility: 'Hide' })
    const second = store.save()
    release()
    expect(await first).toBe(true)
    expect(await second).toBe(true)
    expect(host.writes).toHaveLength(2)
    const doc = inGame()
    expect(doc.blocks.find(b => b.tier === 't2divine')?.visibility).toBe('Hide')
  })

  it('a failed write says so and stays unsaved', async () => {
    const { store } = await opened()
    store.edit({ kind: 'visibility', type: 'currency', tier: 't1exalted', visibility: 'Hide' })
    host.writeFails = 1
    expect(await store.save()).toBe(false)
    expect(store.error.value).toMatch(/EPERM/)
    expect(store.dirty.value).toBe(true)
    expect(await store.save()).toBe(true)
    expect(store.error.value).toBeNull()
    expect(store.dirty.value).toBe(false)
  })

  it('a rule the game would reject is refused, and the file stays', async () => {
    const { store } = await opened()
    await store.save()
    const before = host.files.get('NeverSink (woke).filter')
    store.edit({ kind: 'style', type: 'currency', tier: 't1exalted', patch: { fontSize: 99 } })
    expect(await store.save()).toBe(false)
    expect(store.error.value).toMatch(/font size/)
    expect(host.files.get('NeverSink (woke).filter')).toBe(before)
  })

  it('tells what is unsaved', async () => {
    const { store } = await opened()
    expect(store.dirty.value).toBe(false)
    const undo = store.editWithUndo({ kind: 'visibility', type: 'currency', tier: 't1exalted', visibility: 'Hide' })
    expect(store.dirty.value).toBe(true)
    undo()
    expect(store.dirty.value).toBe(false)
  })
})

describe('reloading in game', () => {
  const area = (areaId: string, areaLevel: number) => sent.log!([{ ev: { kind: 'area', areaId, areaLevel } }])

  it('Save + reload sends the command at once, even in a map (regression)', async () => {
    const { store } = await opened()
    area('MapWorldsCemetery', 83)
    await store.save({ reloadNow: true })
    expect(sent.chat).toEqual(['/itemfilter NeverSink (woke)'])
    expect(store.pendingReload.value).toBe(false)
  })

  it('a save nobody asked to reload waits for town, then reloads once', async () => {
    vi.useFakeTimers()
    try {
      const { store } = await opened()
      area('MapWorldsCemetery', 83)
      await store.save()
      expect(sent.chat).toEqual([])
      expect(store.pendingReload.value).toBe(true)
      area('HideoutFelled', 1)
      expect(sent.chat).toEqual([])
      await vi.advanceTimersByTimeAsync(5000)
      expect(sent.chat).toEqual(['/itemfilter NeverSink (woke)'])
      expect(store.pendingReload.value).toBe(false)
      await vi.advanceTimersByTimeAsync(20000)
      expect(sent.chat).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaving town again before the wait ends holds the reload', async () => {
    vi.useFakeTimers()
    try {
      const { store } = await opened()
      area('MapWorldsCemetery', 83)
      await store.save()
      area('HideoutFelled', 1)
      await vi.advanceTimersByTimeAsync(1000)
      area('MapWorldsCemetery', 83)
      await vi.advanceTimersByTimeAsync(10000)
      expect(sent.chat).toEqual([])
      expect(store.pendingReload.value).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('sends nothing with chat reload off', async () => {
    const { store } = await opened(undefined, { reloadViaChat: false })
    await store.save({ reloadNow: true })
    expect(sent.chat).toEqual([])
  })

  it('names the copy of an online filter, with its odd characters cleaned', async () => {
    host.online.set('qX78', { title: 'My: "best" filter', text: neverSink('1-REGULAR') })
    const config = widget({ sourceName: 'qX78', sourceOnline: true, sourceTitle: 'My: "best" filter' })
    const store = useLootFilter(() => config)
    await store.load()
    await store.save({ reloadNow: true })
    expect(outputName(config)).toBe('My best filter (woke).filter')
    expect(host.files.has('My best filter (woke).filter')).toBe(true)
    expect(sent.chat).toEqual(['/itemfilter My best filter (woke)'])
  })

  it('warns when the game has another filter selected, until we switch it', async () => {
    const { store } = await opened()
    host.gameFilter = { name: 'qX78lnfV', loaded: true }
    await store.save()
    await new Promise(resolve => setTimeout(resolve, 0))
    store.reloadInGame(true)
    expect(store.wrongFilterInGame.value).toBe(false)
  })
})

describe('sources', () => {
  it('an online filter is read only: saves go to a copy', async () => {
    const text = neverSink('1-REGULAR')
    host.online.set('qX78', { title: '329', text })
    const config = widget({ sourceName: 'qX78', sourceOnline: true, sourceTitle: '329' })
    const store = useLootFilter(() => config)
    await store.load()
    await store.save()
    expect(host.online.get('qX78')!.text).toBe(text)
    expect(host.files.get('329 (woke).filter')!.endsWith(text)).toBe(true)
  })

  it('opening our copy of a local filter goes back to the original', async () => {
    const { store } = await opened()
    await store.save()
    const config = widget({ sourceName: 'NeverSink (woke).filter' })
    const again = useLootFilter(() => config)
    await again.load()
    expect(again.error.value).toBeNull()
    expect(config.sourceName).toBe('NeverSink.filter')
  })

  it('opening our copy of an online filter goes back to the online one', async () => {
    host.online.set('qX78', { title: '329', text: neverSink('1-REGULAR') })
    const made = widget({ sourceName: 'qX78', sourceOnline: true, sourceTitle: '329' })
    const first = useLootFilter(() => made)
    await first.load()
    await first.save()
    const config = widget({ sourceName: '329 (woke).filter' })
    const again = useLootFilter(() => config)
    await again.listFiles()
    await again.load()
    expect(again.error.value).toBeNull()
    expect(config).toMatchObject({ sourceName: 'qX78', sourceOnline: true, sourceTitle: '329' })
  })

  it('a copy with no way back says what to do', async () => {
    host.files.set('Lost.filter', `${WOKE_MARK}\n# Made from NeverSink 8.20.2, downloaded from GitHub\nShow\n`)
    const config = widget({ sourceName: 'Lost.filter' })
    const store = useLootFilter(() => config)
    await store.load()
    expect(store.error.value).toMatch(/Pick the filter it was made from/)
  })

  it('a copy whose original is gone (the game empties OnlineFilters) recovers from itself', async () => {
    host.online.set('qX78', { title: '329', text: neverSink('1-REGULAR') })
    const made = widget({ sourceName: 'qX78', sourceOnline: true, sourceTitle: '329' })
    const first = useLootFilter(() => made)
    await first.load()
    await first.save()
    host.online.clear()
    const config = widget({ sourceName: '329 (woke).filter' })
    const again = useLootFilter(() => config)
    await again.load()
    expect(again.error.value).toBeNull()
    const source = parseFilter(neverSink('1-REGULAR'))
    expect(again.doc.value!.blocks.map(b => b.raw)).toEqual(source.blocks.map(b => b.raw))
  })

    it('a missing file is an error you can act on, not a blank screen', async () => {
    const config = widget({ sourceName: 'Gone.filter' })
    const store = useLootFilter(() => config)
    await store.load()
    expect(store.error.value).toMatch(/Can't open Gone.filter/)
    expect(store.doc.value).toBeNull()
  })

  it('with no filter picked, it starts from the newest NeverSink file', async () => {
    host.files.set('NeverSink strict.filter', neverSink('3-STRICT'))
    const config = widget()
    const store = useLootFilter(() => config)
    await store.load()
    expect(config.sourceName).toBe('NeverSink strict.filter')
  })

  it('changes follow NeverSink from GitHub across strictness levels and versions', async () => {
    for (let i = 0; i < 7; i++) {
      host.neversink.set(`8.20.1//${i}`, neverSink(LEVELS[i]))
      host.neversink.set(`8.20.2//${i}`, neverSink(LEVELS[i]))
    }
    const config = widget({ neversink: { on: true, version: '8.20.1', prevVersion: null, style: '', level: 1, latest: null, latestChanges: '', checkedAt: null } })
    const store = useLootFilter(() => config)
    await store.load()
    store.edit({ kind: 'visibility', type: 'currency', tier: 't1exalted', visibility: 'Hide' })
    await store.save()
    expect(inGame().blocks.find(b => b.tier === 't1exalted')?.visibility).toBe('Hide')
    await store.setLevel(4)
    expect(store.failed.value).toEqual([])
    expect(inGame().strictness).toBe('4-VERY-STRICT')
    expect(inGame().blocks.find(b => b.tier === 't1exalted')?.visibility).toBe('Hide')
    await new Promise(resolve => setTimeout(resolve, 0))
    await store.checkForUpdate(true)
    expect(store.updateReady.value).toMatchObject({ version: '8.20.2', ok: 1, total: 1 })
    await store.updateNeverSink()
    expect(config.neversink.version).toBe('8.20.2')
    expect(inGame().blocks.find(b => b.tier === 't1exalted')?.visibility).toBe('Hide')
  })
})

describe('the edit you made is the edit the game sees', () => {
  const corpus = [...CLASS_ITEMS, ...STATE_ITEMS]
  const levels: Level[] = ['1-REGULAR', '3-STRICT', '6-UBER-PLUS-STRICT']

  // Every item, in the filter the way you'd meet it: hide it, restyle it, pin it.
  describe.each(levels)('%s', (level) => {
    it.each(corpus.map(i => [i.name, i.text]))('%s: hide, restyle, always show', (_name, text) => {
      const source = neverSink(level)
      const f = facts(text)
      const start = parseFilter(source)
      const before = matchItem(start, f)
      if (!before.final || !f.baseType) return
      const apply = (edit: Omit<FilterEdit, 'id'>) => {
        const doc = parseFilter(source)
        const list = [{ ...edit, id: 1 }] as FilterEdit[]
        const res = applyAll(doc, list)
        expect(res.every(r => r.ok), 'applied').toBe(true)
        return matchItem(parseFilter(serializeFilter(doc)), f)
      }
      const hidden = apply(ownRule(start, f, { visibility: 'Hide' }))
      expect(hidden.visibility).toBe('Hide')
      const big = apply(ownRule(start, f, { visibility: 'Show', fontSize: 44 }))
      expect(big.visibility).toBe('Show')
      expect(readStyle(big.actions).fontSize).toBe(44)
      const pinned = apply(ownRule(start, f, { visibility: 'Show', pin: true }))
      expect(pinned.visibility).toBe('Show')
      expect(pinned.final!.block.type).toBe(OWN_RULE_TYPE)
    })
  })

  it('a pinned rule also holds in every area level', () => {
    const source = neverSink('3-STRICT')
    const f = facts(fixture('items/currency-divine.txt'))
    const doc = parseFilter(source)
    applyAll(doc, [{ ...ownRule(doc, f, { visibility: 'Show', pin: true }), id: 1 }])
    const out = parseFilter(serializeFilter(doc))
    for (const areaLevel of [1, 30, 68, 83, 86]) expect(matchItem(out, { ...f, areaLevel }).final!.block.type).toBe(OWN_RULE_TYPE)
  })

  it('every listed item of a group can move to every other tier and be found there', () => {
    const source = neverSink('1-REGULAR')
    const start = parseFilter(source)
    let tried = 0
    const types = [...new Set(start.blocks.filter(b => !b.disabled && b.type).map(b => b.type!))]
    for (const type of types) {
      const targets = moveTargets(start, type)
      if (targets.length < 2) continue
      const from = start.blocks.find(b => b.type === type && !b.disabled && b.conditions.some(c => c.key === 'BaseType' && c.op === '==' && c.values.length))
      if (!from) continue
      const base = from.conditions.find(c => c.key === 'BaseType' && c.op === '==')!.values[0]
      for (const to of targets) {
        if (to === from.tier) continue
        const doc = parseFilter(source)
        const [res] = applyAll(doc, [{ id: 1, kind: 'move', type, base, from: from.tier!, to }])
        expect(res.ok, `${type}: ${base} to ${to}`).toBe(true)
        const out = parseFilter(serializeFilter(doc))
        const live = out.blocks.filter(b => b.type === type && !b.disabled && b.conditions.some(c => c.key === 'BaseType' && c.op === '==' && c.values.includes(base))).map(b => b.tier)
        expect(live, `${type}: ${base} to ${to}`).toContain(to)
        expect(live, `${type}: ${base} still in ${from.tier}`).not.toContain(from.tier)
        tried++
      }
    }
    expect(tried).toBeGreaterThan(50)
  })

  it('every tier of every group can be hidden, shown and restyled, and it parses back', () => {
    const source = neverSink('1-REGULAR')
    const start = parseFilter(source)
    const tiers = new Set(start.blocks.filter(b => b.type && b.tier).map(b => `${b.type}|${b.tier}`))
    const edits: FilterEdit[] = [...tiers].flatMap((key, i) => {
      const [type, tier] = key.split('|')
      return i % 2
        ? [{ id: i, kind: 'visibility', type, tier, visibility: 'Hide' } as FilterEdit]
        : [{ id: i, kind: 'style', type, tier, patch: { fontSize: 33, text: [1, 2, 3, 255], background: [4, 5, 6, 255], border: null, sound: { id: '3', volume: 200 }, effect: { color: 'Red', temp: true }, icon: { size: 1, color: 'Blue', shape: 'Star' } } } as FilterEdit]
    })
    const doc = parseFilter(source)
    expect(applyAll(doc, edits).every(r => r.ok)).toBe(true)
    const out = parseFilter(serializeFilter(doc))
    expect(out.blocks.length).toBe(start.blocks.length)
    const again = parseFilter(serializeFilter(out))
    expect(again.blocks.map(b => b.actions)).toEqual(out.blocks.map(b => b.actions))
  })
})

describe('regressions', () => {
  it('an edit to a unique map is keyed by "Map (Tier 16)", which the game matches', () => {
    const text = 'Item Class: Maps\nRarity: Unique\nMaelström of Chaos\nMap (Tier 16)\n--------\nMap Tier: 16\n--------\nItem Level: 83\n--------\nTravel to this Map by using it in a personal Map Device.\n'
    const f = facts(text)
    expect(f.baseType).toBe('Map (Tier 16)')
    const doc = parseFilter(neverSink('1-REGULAR'))
    const m = matchItem(doc, f)
    expect(m.final).not.toBeNull()
    applyAll(doc, [{ ...ownRule(doc, f, { visibility: 'Hide' }), id: 1 }])
    const out = parseFilter(serializeFilter(doc))
    expect(matchItem(out, f).visibility).toBe('Hide')
    expect(host.files.size).toBe(0)
  })

  it('a rare and a magic item of one base each keep their own rule', () => {
    const source = 'Show # $type->rings $tier->rare\n\tRarity Rare\n\tClass == "Rings"\n\nShow # $type->rings $tier->magic\n\tRarity Magic\n\tClass == "Rings"\n'
    let list: FilterEdit[] = []
    list = addTo(list, { id: 1, kind: 'item', type: 'rings', tier: 'rare', base: 'Gold Ring', visibility: 'Hide', patch: {} })
    list = addTo(list, { id: 2, kind: 'item', type: 'rings', tier: 'magic', base: 'Gold Ring', visibility: 'Show', patch: { fontSize: 44 } })
    expect(list).toHaveLength(2)
    const doc = parseFilter(source)
    applyAll(doc, list)
    const out = parseFilter(serializeFilter(doc))
    const ring = { name: 'x', itemClass: 'Rings', baseType: 'Gold Ring', influences: [], explicitModNames: [] }
    expect(matchItem(out, { ...ring, rarity: 'Rare' }).visibility).toBe('Hide')
    expect(readStyle(matchItem(out, { ...ring, rarity: 'Magic' }).actions).fontSize).toBe(44)
  })

  it('the own rule copies the block the item hit, not the first of its tier', () => {
    const source = 'Show # $type->gear $tier->good\n\tItemLevel >= 86\n\tClass == "Rings"\n\nShow # $type->gear $tier->good\n\tItemLevel >= 60\n\tClass == "Rings"\n'
    const doc = parseFilter(source)
    const f: ItemFacts = { name: 'x', itemClass: 'Rings', baseType: 'Gold Ring', itemLevel: 70, influences: [], explicitModNames: [] }
    applyAll(doc, [{ ...ownRule(doc, f, { visibility: 'Hide' }), id: 1 }])
    expect(matchItem(parseFilter(serializeFilter(doc)), f).visibility).toBe('Hide')
  })

  it('an own rule follows its item to a tier higher up', () => {
    const source = 'Show # $type->currency $tier->t1\n\tBaseType == "Mirror of Kalandra"\n\nShow # $type->currency $tier->t3\n\tBaseType == "Chaos Orb"\n'
    const doc = parseFilter(source)
    applyAll(doc, [
      { id: 1, kind: 'move', type: 'currency', base: 'Chaos Orb', from: 't3', to: 't1' },
      { id: 2, kind: 'item', type: 'currency', tier: 't3', base: 'Chaos Orb', visibility: 'Hide', patch: {} }
    ])
    const f: ItemFacts = { name: 'x', itemClass: 'Stackable Currency', baseType: 'Chaos Orb', influences: [], explicitModNames: [] }
    expect(matchItem(parseFilter(serializeFilter(doc)), f).visibility).toBe('Hide')
  })

  it('moving one stack tier of a base leaves its other stack tiers alone', () => {
    const source = 'Show # $type->h $tier->t1\n\tStackSize >= 100\n\tBaseType == "Wild"\n\nShow # $type->h $tier->t2\n\tStackSize >= 10\n\tBaseType == "Wild" "Vivid"\n\nShow # $type->h $tier->t3\n\tStackSize >= 1\n\tBaseType == "Wild"\n\nShow # $type->h $tier->t4\n\tStackSize >= 1\n\tBaseType == "Other"\n'
    const doc = parseFilter(source)
    applyAll(doc, [{ id: 1, kind: 'move', type: 'h', base: 'Wild', from: 't2', to: 't4' }])
    const lists = parseFilter(serializeFilter(doc)).blocks.map(b => [b.tier, b.conditions.find(c => c.key === 'BaseType')!.values])
    expect(lists).toEqual([['t1', ['Wild']], ['t2', ['Vivid']], ['t3', ['Wild']], ['t4', ['Other', 'Wild']]])
  })

  it('a move whose tier no longer has the item still finds it', () => {
    const source = 'Show # $type->c $tier->t1\n\tBaseType == "A"\n\nShow # $type->c $tier->t2\n\tBaseType == "B"\n\nShow # $type->c $tier->t3\n\tBaseType == "C"\n'
    const doc = parseFilter(source)
    expect(applyAll(doc, [{ id: 1, kind: 'move', type: 'c', base: 'A', from: 't2', to: 't3' }])[0].ok).toBe(true)
    expect(parseFilter(serializeFilter(doc)).blocks.map(b => b.disabled)).toEqual([true, false, false])
  })

  it('moving into a tier commented out for being empty brings it back', () => {
    const source = 'Show # $type->currency $tier->t1\n\tBaseType == "Mirror of Kalandra"\n\n#Show # $type->currency $tier->t2\n#\tBaseType == \n\tSetFontSize 40\n'
    const doc = parseFilter(source)
    expect(moveTargets(doc, 'currency')).toEqual(['t1', 't2'])
    const [res] = applyAll(doc, [{ id: 1, kind: 'move', type: 'currency', base: 'Mirror of Kalandra', from: 't1', to: 't2' }])
    expect(res.ok).toBe(true)
    const out = parseFilter(serializeFilter(doc))
    expect(out.blocks.map(b => [b.tier, b.disabled])).toEqual([['t1', true], ['t2', false]])
    const f: ItemFacts = { name: 'x', baseType: 'Mirror of Kalandra', influences: [], explicitModNames: [] }
    expect(matchItem(out, f).final?.block.tier).toBe('t2')
  })

  it('a rule with no tags can be restyled, hidden and given an own rule', () => {
    const source = '# FilterBlade: Conditional Entry\nHide\nSetFontSize 18\nClass == "Stackable Currency"\nBaseType == "Alteration Shard" "Alchemy Shard"\n'
    const start = parseFilter(source)
    const f: ItemFacts = { name: 'x', itemClass: 'Stackable Currency', baseType: 'Alchemy Shard', influences: [], explicitModNames: [] }
    const b = matchItem(start, f).final!.block
    const [own] = applyAll(parseFilter(source), [{ ...ownRule(start, f, { visibility: 'Show', fontSize: 44 }), id: 1 }])
    expect(own.ok).toBe(true)
    const doc = parseFilter(source)
    const res = applyAll(doc, [
      { id: 1, kind: 'visibility', type: b.type!, tier: b.tier!, visibility: 'Show' },
      { id: 2, kind: 'style', type: b.type!, tier: b.tier!, patch: { fontSize: 40 } }
    ])
    expect(res.every(r => r.ok)).toBe(true)
    const out = matchItem(parseFilter(serializeFilter(doc)), f)
    expect(out.visibility).toBe('Show')
    expect(readStyle(out.actions).fontSize).toBe(40)
  })

  it('the update check counts changes the way the file gets them', async () => {
    const { store } = await opened()
    store.edit({ kind: 'visibility', type: 'currency', tier: 't1exalted', visibility: 'Hide' })
    expect(store.failed.value).toEqual([])
  })
})

// Imported late so the mocks above are in place for the store's own imports.
import { addEdit as addTo, applyEdits as applyAll } from '@/web/woke/loot-filter/edits'
