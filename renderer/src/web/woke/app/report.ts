// Problem reports: crash prompts in the overlay and "Report a problem" in
// Settings → About. The main process builds the GitHub issue (crash-reports.ts).
import { AppConfig } from '@/web/Config'
import { MODULES, isModuleOn } from '../modules'
import { hostRequest } from '../shared/host'

export function toolsContext (): string {
  const on = MODULES.filter(m => m.group !== 'apt' && isModuleOn(AppConfig(), m.id)).map(m => m.id)
  return `Tools on: ${on.length ? on.join(', ') : 'none'}`
}

// Opens a pre-filled GitHub issue for a saved crash, or a blank problem report.
export async function reportProblem (crashId: string | null = null) {
  await hostRequest('crash-report', { id: crashId, context: toolsContext() })
}

export async function openCrashFolder () {
  await hostRequest('crash-folder', {})
}

// Overlay errors are kept (in memory, in main) to attach to the next report.
let lastSent = 0
export function captureRendererErrors () {
  const send = (text: string) => {
    const now = Date.now()
    if (now - lastSent < 2000 || /ResizeObserver loop/.test(text)) return
    lastSent = now
    hostRequest('renderer-error', { text }).catch(() => {})
  }
  window.addEventListener('error', (e) => {
    send(e.error instanceof Error ? (e.error.stack ?? e.error.message) : `${e.message} (${e.filename}:${e.lineno})`)
  })
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as unknown
    send(`Unhandled promise rejection: ${r instanceof Error ? (r.stack ?? r.message) : String(r)}`)
  })
}
