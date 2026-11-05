// Newer item and stat data, without a release or a restart. Main downloads it
// and checks its hashes; here it goes through the same checks as bundled data,
// and is only used if it passes. Anything going wrong leaves the data as it was.
import { MainProcess } from '@/web/background/IPC'
import { useLiveData } from '@/assets/data'
import { hostRequest } from '../shared/host'

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000
const FIRST_CHECK_AFTER_MS = 60 * 1000

let inUse: { language: string, version: number } | null = null

async function bundledVersion (): Promise<number> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/data-version.json`)
  return (await res.json() as { version: number }).version
}

async function apply (language: string, version: number) {
  const get = async (name: string) => {
    const res = await fetch(`/live-data/${language}/${name}.ndjson`)
    if (!res.ok) throw new Error(`Couldn't read ${name}: ${res.status}`)
    return await res.text()
  }
  const [items, stats] = await Promise.all([get('items'), get('stats')])
  useLiveData(language, items, stats)
  inUse = { language, version }
}

// Data downloaded on an earlier run. Before anything needs it, at startup and
// after a language change (which goes back to the bundled data).
export async function useDownloadedData (language: string) {
  if (!MainProcess.isElectron) return
  inUse = null
  try {
    const version = await hostRequest<number | null>('live-data-cached', { language, bundled: await bundledVersion() })
    if (version != null) await apply(language, version)
  } catch (e) {
    console.warn('[live data] Staying on the bundled data', e)
  }
}

async function check (getLanguage: () => string) {
  const language = getLanguage()
  try {
    const version = await hostRequest<number | null>('live-data-check', { language, bundled: await bundledVersion() }, 120_000)
    if (version == null || language !== getLanguage()) return
    if (inUse?.language === language && inUse.version === version) return
    await apply(language, version)
    console.info(`[live data] Item data is now version ${version}`)
  } catch (e) {
    console.warn('[live data] Update failed', e)
  }
}

export function startLiveDataChecks (getLanguage: () => string) {
  if (!MainProcess.isElectron) return
  setTimeout(() => {
    check(getLanguage).catch(() => {})
    setInterval(() => { check(getLanguage).catch(() => {}) }, CHECK_EVERY_MS)
  }, FIRST_CHECK_AFTER_MS)
}
