// main/src/host-files/ConfigStore.ts: losing config.json must never mean losing
// every setting, and every save must be on disk before the app quits.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { ConfigStore } from '../../main/src/host-files/ConfigStore'

type Save = { contents: string, isTemporary: boolean, quiet?: boolean }

let dir: string
const cfg = (name = 'config.json') => path.join(dir, 'apt-data', name)
const write = (name: string, text: string) => {
  fs.mkdirSync(path.dirname(cfg()), { recursive: true })
  fs.writeFileSync(cfg(name), text)
}

function make () {
  let onSave: (e: Save) => void = () => {}
  const echoes: unknown[] = []
  const server = {
    onEventAnyClient: (_name: string, cb: (e: Save) => void) => { onSave = cb },
    sendEventTo: (_to: string, event: unknown) => { echoes.push(event) }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = new ConfigStore(server as any)
  const save = async (contents: string, opts: Partial<Save> = {}) => {
    onSave({ contents, isTemporary: false, ...opts })
    await store.flushed()
  }
  return { store, save, echoes }
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-config-'))
  process.env.WOKE_FAKE_USER_DATA = dir
})

describe('loading', () => {
  it('reads a good file', async () => {
    write('config.json', '{"a":1}')
    const { store } = make()
    expect(await store.load()).toBe('{"a":1}')
    expect(store.notice).toBeNull()
  })

  it('a first run is quiet', async () => {
    const { store } = make()
    expect(await store.load()).toBeNull()
    expect(store.notice).toBeNull()
  })

  it.each([['damaged', '{"a":1'], ['empty', ''], ['not settings', '[1,2]']])('a %s file gives way to the backup and is kept', async (_name, text) => {
    write('config.json', text)
    write('config.backup.json', '{"a":"backup"}')
    const { store } = make()
    expect(await store.load()).toBe('{"a":"backup"}')
    expect(store.notice).toBe('restored')
    const kept = fs.readdirSync(path.dirname(cfg())).filter(f => f.startsWith('config.broken-'))
    expect(kept).toHaveLength(1)
    expect(fs.readFileSync(path.join(path.dirname(cfg()), kept[0]), 'utf8')).toBe(text)
  })

  it('says so when a damaged file has no backup', async () => {
    write('config.json', 'nonsense')
    const { store } = make()
    expect(await store.load()).toBeNull()
    expect(store.notice).toBe('reset')
  })

  it('a damaged backup is not used', async () => {
    write('config.json', 'nonsense')
    write('config.backup.json', 'also nonsense')
    const { store } = make()
    expect(await store.load()).toBeNull()
    expect(store.notice).toBe('reset')
  })

  it('a missing file with a backup is restored', async () => {
    write('config.backup.json', '{"a":"backup"}')
    const { store } = make()
    expect(await store.load()).toBe('{"a":"backup"}')
    expect(store.notice).toBe('restored')
  })

  it('later loads in one run read the file again and move nothing', async () => {
    write('config.json', 'nonsense')
    write('config.backup.json', '{"a":"backup"}')
    const { store, save } = make()
    await store.load()
    await save('{"a":"new"}')
    expect(await store.load()).toBe('{"a":"new"}')
    expect(fs.readdirSync(path.dirname(cfg())).filter(f => f.startsWith('config.broken-'))).toHaveLength(1)
  })
})

describe('saving', () => {
  it('writes the newest contents and leaves no temp file', async () => {
    const { save } = make()
    await save('{"a":1}')
    await save('{"a":2}')
    expect(fs.readFileSync(cfg(), 'utf8')).toBe('{"a":2}')
    expect(fs.existsSync(cfg('config.json.writing'))).toBe(false)
  })

  it('the backup holds the settings from before this run', async () => {
    write('config.json', '{"a":"before"}')
    const { save } = make()
    await save('{"a":"after"}')
    await save('{"a":"later"}')
    expect(fs.readFileSync(cfg('config.backup.json'), 'utf8')).toBe('{"a":"before"}')
  })

  it('a damaged file is never backed up', async () => {
    write('config.json', '{"a":')
    write('config.backup.json', '{"a":"good"}')
    const { save } = make()
    await save('{"a":"new"}')
    expect(fs.readFileSync(cfg('config.backup.json'), 'utf8')).toBe('{"a":"good"}')
  })

  it('a quiet save reaches the disk with no echo', async () => {
    const { save, echoes } = make()
    await save('{"a":1}', { quiet: true })
    expect(fs.readFileSync(cfg(), 'utf8')).toBe('{"a":1}')
    expect(echoes).toEqual([])
    await save('{"a":2}')
    expect(echoes).toHaveLength(1)
  })

  it('a temporary save leaves the real file alone', async () => {
    write('config.json', '{"a":"real"}')
    const { save } = make()
    await save('{"a":"temp"}', { isTemporary: true })
    await save('{"a":"temp2"}')
    expect(fs.readFileSync(cfg(), 'utf8')).toBe('{"a":"real"}')
    expect(fs.readFileSync(cfg('config.json.tmp'), 'utf8')).toBe('{"a":"temp2"}')
  })

  it('a failed write doesn\'t stop the next one', async () => {
    const { save } = make()
    // A folder where the file should go: every write to it fails.
    fs.mkdirSync(cfg(), { recursive: true })
    await save('{"a":1}')
    fs.rmdirSync(cfg())
    await save('{"a":2}')
    expect(fs.readFileSync(cfg(), 'utf8')).toBe('{"a":2}')
  })
})
