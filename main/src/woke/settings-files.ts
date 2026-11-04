// Settings window helpers: check a path the user typed, and pick one with the
// system file dialog.
import { dialog } from 'electron'
import fs from 'fs/promises'

export interface PathStat {
  exists: boolean
  isDir: boolean
  modified: number | null
}

export async function pathStat (args: { path?: string | null }): Promise<PathStat> {
  const p = typeof args?.path === 'string' ? args.path.trim() : ''
  if (!p) return { exists: false, isDir: false, modified: null }
  try {
    const st = await fs.stat(p)
    return { exists: true, isDir: st.isDirectory(), modified: st.mtimeMs }
  } catch {
    return { exists: false, isDir: false, modified: null }
  }
}

export async function browsePath (args: { kind?: 'file' | 'dir', title?: string, defaultPath?: string, extensions?: string[] }): Promise<string | null> {
  const opts: Electron.OpenDialogOptions = {
    title: args?.title,
    defaultPath: args?.defaultPath || undefined,
    properties: [args?.kind === 'dir' ? 'openDirectory' : 'openFile']
  }
  if (args?.kind !== 'dir' && args?.extensions?.length) {
    opts.filters = [{ name: args.extensions.join(', '), extensions: args.extensions }]
  }
  const res = await dialog.showOpenDialog(opts)
  return res.canceled ? null : res.filePaths[0] ?? null
}
