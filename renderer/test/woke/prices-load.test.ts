// A failed poe.ninja load must not look like a fresh one.
import { describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'

let nextResponse: () => Response
vi.mock('@/web/background/IPC', () => ({ Host: { proxy: async () => nextResponse() } }))
vi.mock('@/web/background/Leagues', () => ({
  useLeagues: () => ({
    selected: shallowRef({ id: 'Mirage', isPopular: true, realm: 'pc-ggg' }),
    selectedId: shallowRef('Mirage')
  })
}))
vi.mock('@/web/woke/market/hook', () => ({ emitWokePricesLoaded: () => {} }))

/* eslint-disable import/first */
import { usePoeninja } from '@/web/background/Prices'
/* eslint-enable import/first */

async function settle () {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve()
    await nextTick()
  }
  await new Promise(resolve => setTimeout(resolve, 0))
}

const overview = (chaos: number) => new Response(`{"type":"Currency","lines":[{"name":"Divine Orb","chaos":${chaos},"graph":[]}]}`)

describe('loading poe.ninja', () => {
  it('counts only a good answer as an update', async () => {
    const ninja = usePoeninja()

    nextResponse = () => new Response('Service Unavailable', { status: 503 })
    ninja.queuePricesFetch()
    await settle()
    expect(ninja.updatedAt.value).toBeNull()

    nextResponse = () => new Response('')
    ninja.queuePricesFetch()
    await settle()
    expect(ninja.updatedAt.value).toBeNull()

    nextResponse = () => overview(180)
    ninja.queuePricesFetch()
    await settle()
    expect(ninja.xchgRate.value).toBe(180)
    const stamped = ninja.updatedAt.value
    expect(stamped).not.toBeNull()
    expect(ninja.findPriceByQuery({ ns: 'ITEM', name: 'Divine Orb', variant: undefined })?.chaos).toBe(180)
  })
})
