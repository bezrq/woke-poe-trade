// Newer item and stat data from this repo, so a league's new items work without a
// release. Fixed address, fixed languages and every file checked against the
// hashes in the version file. The page decides whether to use what's here.
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { dataDir } from './data-files'

const RAW = 'https://raw.githubusercontent.com/guybnd/woke-poe-trade/master/renderer/public/data'
const FORMAT = 1
const LANGUAGES = ['en', 'ru', 'cmn-Hant', 'ko']
const FILES = ['items', 'stats'] as const
const MAX_FILE_BYTES = 32 * 1024 * 1024
// A stalled download must not hold up every later check.
const DOWNLOAD_TIMEOUT_MS = 90_000

export type Fetcher = (url: string, signal: AbortSignal) => Promise<{ ok: boolean, status: number, text: () => Promise<string> }>

interface Manifest {
  format: number
  version: number
  files: Record<string, Record<string, string>>
}

export const liveDataRoot = () => dataDir('live-data')

function language (value: unknown): string {
  if (typeof value !== 'string' || !LANGUAGES.includes(value)) throw new Error('Unknown language')
  return value
}

// Without carriage returns, as bump-data-version.mjs hashes them.
function hashOf (text: string): string {
  return createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex')
}

async function cachedVersion (lang: string): Promise<number | null> {
  try {
    const { version } = JSON.parse(await fs.readFile(path.join(liveDataRoot(), lang, 'version.json'), 'utf8')) as { version: unknown }
    return typeof version === 'number' ? version : null
  } catch {
    return null
  }
}

async function getText (fetcher: Fetcher, url: string): Promise<string> {
  const res = await fetcher(url, AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS))
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`)
  const text = await res.text()
  if (text.length > MAX_FILE_BYTES) throw new Error('Download too large')
  return text
}

// The version to use for this language, if it's newer than the app's own data.
// An app update can bring newer data than the download, which then just goes.
export async function cachedLiveData (args: { language: unknown, bundled: number }): Promise<number | null> {
  const lang = language(args.language)
  const version = await cachedVersion(lang)
  if (version == null) return null
  if (version > args.bundled) return version
  await fs.rm(path.join(liveDataRoot(), lang), { recursive: true, force: true })
  return null
}

const checking = new Map<string, Promise<number | null>>()

function isManifest (value: Manifest | null, lang: string): value is Manifest {
  return value != null && Number.isInteger(value.format) && Number.isInteger(value.version) &&
    FILES.every(name => typeof value.files?.[lang]?.[name] === 'string')
}

// Into place by renames: anything failing, even a file antivirus has open, leaves
// the old set whole.
async function moveIntoPlace (fresh: string, target: string) {
  const old = `${target}.old`
  await fs.rm(old, { recursive: true, force: true }).catch(() => {})
  let hadOld = true
  try {
    await fs.rename(target, old)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
    hadOld = false
  }
  try {
    await fs.rename(fresh, target)
  } catch (e) {
    if (hadOld) await fs.rename(old, target).catch(() => {})
    throw e
  }
  await fs.rm(old, { recursive: true, force: true }).catch(() => {})
}

async function download (lang: string, bundled: number, fetcher: Fetcher): Promise<number | null> {
  const manifest = JSON.parse(await getText(fetcher, `${RAW}/data-version.json`)) as Manifest | null
  if (!isManifest(manifest, lang)) throw new Error('The version file is not usable')
  const have = Math.max(bundled, await cachedVersion(lang) ?? 0)
  // A new format needs a new app: leave it to the next release.
  if (manifest.format !== FORMAT || !(manifest.version > have)) {
    return await cachedLiveData({ language: lang, bundled })
  }

  const hashes = manifest.files[lang]
  const texts = await Promise.all(FILES.map(async (name) => {
    const text = await getText(fetcher, `${RAW}/${lang}/${name}.ndjson`)
    if (hashOf(text) !== hashes[name]) throw new Error(`${name}.ndjson doesn't match its hash`)
    return text
  }))

  const root = liveDataRoot()
  const fresh = path.join(root, `${lang}.new`)
  const target = path.join(root, lang)
  await fs.rm(fresh, { recursive: true, force: true })
  await fs.mkdir(fresh, { recursive: true })
  await Promise.all(FILES.map(async (name, i) => { await fs.writeFile(path.join(fresh, `${name}.ndjson`), texts[i]) }))
  await fs.writeFile(path.join(fresh, 'version.json'), JSON.stringify({ version: manifest.version }))
  await moveIntoPlace(fresh, target)
  return manifest.version
}

// Returns the version to use, newly downloaded or not, or null for the bundled data.
export function checkLiveData (args: { language: unknown, bundled: number }, fetcher: Fetcher): Promise<number | null> {
  const lang = language(args.language)
  let running = checking.get(lang)
  if (!running) {
    running = download(lang, args.bundled, fetcher).finally(() => { checking.delete(lang) })
    checking.set(lang, running)
  }
  return running
}
