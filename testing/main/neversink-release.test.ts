import { describe, it, expect, vi, beforeEach } from 'vitest'

const fetched = vi.hoisted(() => ({ urls: [] as string[], tag: '8.20.2' as string | null }))

vi.mock('electron', () => ({
  app: { getPath: () => '' },
  net: {
    fetch: async (url: string) => {
      fetched.urls.push(url)
      if (url.includes('api.github.com')) {
        return fetched.tag
          ? new Response(JSON.stringify({ tag_name: fetched.tag }))
          : new Response('rate limited', { status: 403 })
      }
      return new Response('# VERSION:  8.20.2\n')
    }
  }
}))

const { latestNeverSink } = await import('../../main/src/woke/neversink')

describe('where NeverSink comes from', () => {
  beforeEach(() => { fetched.urls = []; fetched.tag = '8.20.2' })

  it('takes the latest release, not whatever master holds', async () => {
    expect((await latestNeverSink()).version).toBe('8.20.2')
    expect(fetched.urls.some(u => u.includes('/NeverSink-Filter/8.20.2/'))).toBe(true)
    expect(fetched.urls.some(u => u.includes('/master/'))).toBe(false)
  })

  it('falls back to master when GitHub says nothing about releases', async () => {
    fetched.tag = null
    await latestNeverSink()
    expect(fetched.urls.some(u => u.includes('/NeverSink-Filter/master/'))).toBe(true)
  })
})
