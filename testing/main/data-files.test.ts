// Keyed documents in the user data folder (main/src/woke/data-files.ts):
// imported league histories and the price check log live here.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { docHandlers } from '../../main/src/woke/data-files'

describe('keyed documents', () => {
  beforeEach(() => {
    process.env.WOKE_FAKE_USER_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-docs-'))
  })

  it('puts, gets, lists and deletes', async () => {
    await docHandlers['doc-put']({ collection: 'invest-leagues', key: 'Settlers', value: { league: 'Settlers', n: 1 } })
    await docHandlers['doc-put']({ collection: 'invest-leagues', key: 'Necropolis', value: { league: 'Necropolis', n: 2 } })
    expect(await docHandlers['doc-get']({ collection: 'invest-leagues', key: 'Settlers' })).toEqual({ league: 'Settlers', n: 1 })
    expect(await docHandlers['doc-get']({ collection: 'invest-leagues', key: 'Nope' })).toBeNull()
    expect((await docHandlers['doc-list']({ collection: 'invest-leagues' }) as unknown[]).length).toBe(2)
    await docHandlers['doc-delete']({ collection: 'invest-leagues', key: 'Settlers' })
    expect(await docHandlers['doc-list']({ collection: 'invest-leagues' })).toEqual([{ league: 'Necropolis', n: 2 }])
  })

  it('keeps odd keys inside the folder', async () => {
    await docHandlers['doc-put']({ collection: 'x', key: '../../evil', value: 1 })
    const files = fs.readdirSync(path.join(process.env.WOKE_FAKE_USER_DATA!, 'woke-docs', 'x'))
    expect(files).toEqual(['.._.._evil.json'])
  })
})
