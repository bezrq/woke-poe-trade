import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { parseDenseChunks } from '@/web/woke/market/parse'
import type { DenseChunk } from '@/web/woke/market/parse'

const proxy = vi.fn()
// Fresh refs per test: each test's copy of the module keeps watching its own.
function leagueRefs () {
  return {
    selected: shallowRef({ id: 'Allflame', realm: 'pc-ggg', isPopular: true }),
    selectedId: shallowRef('Allflame')
  }
}
let league = leagueRefs()

vi.mock('@/web/background/IPC', () => ({ Host: { proxy: (...args: unknown[]) => proxy(...args) } }))
vi.mock('@/web/background/Leagues', () => ({ useLeagues: () => league }))

const LINES = {
  Currency: '{"type":"Currency","lines":[{"name":"Divine Orb","chaos":400,"graph":[1,2,3,4,5,6,7]},{"name":"Exalted Orb","chaos":20,"graph":[1,2,3,4,5,6,7]}]}',
  Fragment: '{"type":"Fragment","lines":[{"name":"Fragment of the Chimera","chaos":50,"graph":[1,2,3,4,5,6,7]}]}',
  Scarab: '{"type":"Scarab","lines":[{"name":"Gilded Divination Scarab","chaos":30,"graph":[1,2,3,4,5,6,7]}]}'
}
const FEED = `{"currencyOverviews":[${LINES.Currency},${LINES.Fragment}],"itemOverviews":[${LINES.Currency},${LINES.Fragment},${LINES.Scarab}]}`

function reply (body: string, status = 200) {
  return { ok: status < 400, status, text: async () => body }
}

// A download that finishes when `finish` is called and rejects when aborted.
function pendingDownload () {
  let finish = () => {}
  const started = vi.fn((_url: string, init: { signal: AbortSignal }) => new Promise((resolve, reject) => {
    finish = () => { resolve(reply(FEED)) }
    init.signal.addEventListener('abort', () => {
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
    })
  }))
  return { started, finish: () => { finish() } }
}

async function setup () {
  vi.resetModules()
  const { usePoeninja } = await import('@/web/background/Prices')
  const hook = await import('@/web/woke/market/hook')
  const emitted: DenseChunk[][] = []
  hook.onWokePricesLoaded((_league, chunks) => { emitted.push(chunks) })
  const ninja = usePoeninja()
  const divine = () => ninja.findPriceByQuery({ ns: 'ITEM', name: 'Divine Orb', variant: undefined })?.chaos ?? null
  const scarab = () => ninja.findPriceByQuery({ ns: 'ITEM', name: 'Gilded Divination Scarab', variant: undefined })?.chaos ?? null
  // Prices are fresh once fetched, so step past the 31 minute wait first.
  const refetch = async () => {
    await vi.advanceTimersByTimeAsync(31 * 60 * 1000)
    ninja.queuePricesFetch()
    await vi.advanceTimersByTimeAsync(0)
  }
  ninja.queuePricesFetch()
  await vi.advanceTimersByTimeAsync(0)
  return { ninja, emitted, divine, scarab, refetch }
}

describe('poe.ninja fetch', () => {
  const rejected: unknown[] = []
  const onRejected = (err: unknown) => { rejected.push(err) }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T08:00:00Z'))
    proxy.mockReset()
    league = leagueRefs()
    rejected.length = 0
    process.on('unhandledRejection', onRejected)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    process.off('unhandledRejection', onRejected)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps each price type once, though poe.ninja sends some twice', async () => {
    proxy.mockResolvedValue(reply(FEED))
    const { emitted } = await setup()
    const items = parseDenseChunks(emitted[0])
    expect(items.map(item => item.name).sort()).toEqual([
      'Divine Orb', 'Exalted Orb', 'Fragment of the Chimera', 'Gilded Divination Scarab'
    ])
  })

  it('keeps different blocks of the same type', async () => {
    const more = '{"type":"Scarab","lines":[{"name":"Winged Scarab","chaos":9,"graph":[1,2,3,4,5,6,7]}]}'
    proxy.mockResolvedValue(reply(FEED.replace(LINES.Scarab, `${LINES.Scarab},${more}`)))
    const { emitted } = await setup()
    expect(parseDenseChunks(emitted[0]).map(item => item.name)).toContain('Winged Scarab')
    expect(parseDenseChunks(emitted[0]).map(item => item.name)).toContain('Gilded Divination Scarab')
  })

  it.each([
    ['a server error', () => reply('{"title":"Internal Server Error","status":500}', 500)],
    ['an error page sent as 200', () => reply('<html>Just a moment...</html>')],
    ['a cut-off body', () => reply(FEED.slice(0, FEED.indexOf(LINES.Scarab)))],
    ['a feed with no prices', () => reply('{"currencyOverviews":[],"itemOverviews":[{"type":"Currency","lines":[]}]}')]
  ])('keeps the last good prices through %s', async (_label, bad) => {
    proxy.mockResolvedValue(reply(FEED))
    const { emitted, divine, scarab, refetch } = await setup()
    expect(emitted).toHaveLength(1)

    proxy.mockResolvedValue(bad())
    await refetch()

    expect(divine()).toBe(400)
    expect(scarab()).toBe(30)
    expect(emitted).toHaveLength(1)
  })

  it('retries within minutes after a failure, not at the next 31 minute update', async () => {
    proxy.mockResolvedValue(reply(FEED))
    const { ninja, emitted, refetch } = await setup()

    proxy.mockResolvedValue(reply('', 500))
    await refetch()
    const failedCalls = proxy.mock.calls.length

    proxy.mockResolvedValue(reply(FEED))
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000)
    ninja.queuePricesFetch()
    await vi.advanceTimersByTimeAsync(0)

    expect(proxy.mock.calls.length).toBe(failedCalls + 1)
    expect(emitted).toHaveLength(2)
  })

  it('does not download again on every price check while failing', async () => {
    proxy.mockResolvedValue(reply('', 500))
    const { ninja } = await setup()
    expect(proxy).toHaveBeenCalledTimes(1)

    ninja.queuePricesFetch()
    await vi.advanceTimersByTimeAsync(10 * 1000)
    ninja.queuePricesFetch()
    await vi.advanceTimersByTimeAsync(0)

    expect(proxy).toHaveBeenCalledTimes(1)
  })

  it('survives being offline without an unhandled error', async () => {
    proxy.mockRejectedValue(new TypeError('Failed to fetch'))
    const { divine } = await setup()
    vi.useRealTimers()
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(divine()).toBe(null)
    expect(rejected).toEqual([])
  })

  it('joins a running download instead of cancelling it', async () => {
    const download = pendingDownload()
    proxy.mockImplementation(download.started)
    const { ninja, divine } = await setup()

    ninja.queuePricesFetch()
    await vi.advanceTimersByTimeAsync(0)
    expect(proxy).toHaveBeenCalledTimes(1)
    expect(ninja.initialLoading()).toBe(true)

    download.finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(divine()).toBe(400)
    expect(ninja.initialLoading()).toBe(false)
  })

  it('restarts a download that is stuck', async () => {
    const download = pendingDownload()
    proxy.mockImplementation(download.started)
    const { ninja, divine } = await setup()

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    ninja.queuePricesFetch()
    await vi.advanceTimersByTimeAsync(0)
    expect(proxy).toHaveBeenCalledTimes(2)

    download.finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(divine()).toBe(400)
    vi.useRealTimers()
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(rejected).toEqual([])
  })

  it('starts over on a league change, with no unhandled error and still loading', async () => {
    const download = pendingDownload()
    proxy.mockImplementation(download.started)
    const { ninja, divine } = await setup()

    league.selected.value = { id: 'Hardcore Allflame', realm: 'pc-ggg', isPopular: true }
    league.selectedId.value = 'Hardcore Allflame'
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)

    expect(proxy).toHaveBeenCalledTimes(2)
    expect(ninja.initialLoading()).toBe(true)
    download.finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(divine()).toBe(400)
    vi.useRealTimers()
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(rejected).toEqual([])
  })

  it('drops a download that lands after moving to a league with no prices', async () => {
    const download = pendingDownload()
    proxy.mockImplementation(download.started)
    const { emitted, divine } = await setup()

    league.selected.value = { id: 'My League (PL123)', realm: 'pc-ggg', isPopular: false }
    league.selectedId.value = 'My League (PL123)'
    await nextTick()
    download.finish()
    await vi.advanceTimersByTimeAsync(0)

    expect(emitted).toEqual([])
    expect(divine()).toBe(null)
  })

  it('stops loading when moving to a league with no prices during a stuck download', async () => {
    const download = pendingDownload()
    proxy.mockImplementation(download.started)
    const { ninja } = await setup()
    expect(ninja.initialLoading()).toBe(true)

    league.selected.value = { id: 'My League (PL123)', realm: 'pc-ggg', isPopular: false }
    league.selectedId.value = 'My League (PL123)'
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)

    expect(ninja.initialLoading()).toBe(false)
    vi.useRealTimers()
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(rejected).toEqual([])
  })

  it('ignores an old download that lands after a newer one started', async () => {
    const finishers: Array<() => void> = []
    const feeds = [FEED.replace('"chaos":400', '"chaos":111'), FEED]
    proxy.mockImplementation(() => new Promise((resolve) => {
      const body = feeds[finishers.length]
      finishers.push(() => { resolve(reply(body)) })
    }))
    const { emitted, divine } = await setup()

    league.selected.value = { id: 'Hardcore Allflame', realm: 'pc-ggg', isPopular: true }
    league.selectedId.value = 'Hardcore Allflame'
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    finishers[0]()
    await vi.advanceTimersByTimeAsync(0)
    expect(emitted).toEqual([])
    expect(divine()).toBe(null)

    finishers[1]()
    await vi.advanceTimersByTimeAsync(0)
    expect(divine()).toBe(400)
  })
})
