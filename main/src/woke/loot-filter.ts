// File access for the loot filter editor: list, read and write .filter files
// in the game's filter folder. Only plain file names inside that folder are
// accepted, never paths.
import { promises as fs } from 'fs'
import path from 'path'
import { app, shell } from 'electron'

export interface FilterFileEntry {
  name: string
  size: number
  mtime: number
  // From the game's OnlineFilters folder (filters followed on the website).
  // `name` is then the file's id and `title` the filter's name.
  online?: boolean
  title?: string
}

const ONLINE_DIR = 'OnlineFilters'
const MAX_ONLINE_BYTES = 8 * 1024 * 1024

export function defaultFilterDir (): string {
  return path.join(app.getPath('documents'), 'My Games', 'Path of Exile')
}

function resolveDir (dir: unknown): string {
  return (typeof dir === 'string' && dir.trim()) ? dir.trim() : defaultFilterDir()
}

function resolveFile (dir: unknown, name: unknown): string {
  if (typeof name !== 'string' || !name) throw new Error('Missing filter name')
  const lower = name.toLowerCase()
  if (name !== path.basename(name) || !(lower.endsWith('.filter') || lower.endsWith('.filter.bak'))) {
    throw new Error('Not a filter file name')
  }
  return path.join(resolveDir(dir), name)
}

export async function listFilters (args: { dir?: string }): Promise<{ dir: string, files: FilterFileEntry[] }> {
  const dir = resolveDir(args?.dir)
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: FilterFileEntry[] = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.filter')) continue
    try {
      const stat = await fs.stat(path.join(dir, e.name))
      files.push({ name: e.name, size: stat.size, mtime: stat.mtimeMs })
    } catch {}
  }
  files.sort((a, b) => b.mtime - a.mtime)
  files.push(...await listOnlineFilters(dir))
  return { dir, files }
}

// Online filters are stored under an id with no extension; the filter's
// name is in a `#name:` line near the top (when present).
async function listOnlineFilters (dir: string): Promise<FilterFileEntry[]> {
  const onlineDir = path.join(dir, ONLINE_DIR)
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(onlineDir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: FilterFileEntry[] = []
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith('.')) continue
    try {
      const full = path.join(onlineDir, e.name)
      const stat = await fs.stat(full)
      if (stat.size > MAX_ONLINE_BYTES) continue
      const fh = await fs.open(full, 'r')
      const buf = Buffer.alloc(2048)
      const { bytesRead } = await fh.read(buf, 0, buf.length, 0)
      await fh.close()
      const head = buf.subarray(0, bytesRead).toString('utf8')
      const title = /^#\s*name:\s*(.+)$/im.exec(head)?.[1].trim()
      out.push({ name: e.name, size: stat.size, mtime: stat.mtimeMs, online: true, title: title || e.name })
    } catch {}
  }
  return out.sort((a, b) => b.mtime - a.mtime)
}

function resolveOnlineFile (dir: unknown, name: unknown): string {
  if (typeof name !== 'string' || !name || name !== path.basename(name) || name.startsWith('.')) {
    throw new Error('Not an online filter name')
  }
  return path.join(resolveDir(dir), ONLINE_DIR, name)
}

// Online filters are read only: writeFilter never touches that folder.
export async function readFilter (args: { dir?: string, name: string, online?: boolean }): Promise<{ text: string, mtime: number }> {
  const full = args?.online ? resolveOnlineFile(args?.dir, args?.name) : resolveFile(args?.dir, args?.name)
  const [text, stat] = await Promise.all([fs.readFile(full, 'utf8'), fs.stat(full)])
  return { text, mtime: stat.mtimeMs }
}

// Writes via a temp file so the game never reads a half-written filter.
// `<name>.filter.bak` holds the untouched original when the editor
// overwrites a filter in place.
export async function writeFilter (args: { dir?: string, name: string, text: string }): Promise<{ path: string }> {
  const full = resolveFile(args?.dir, args?.name)
  if (typeof args.text !== 'string' || !args.text) throw new Error('Nothing to write')
  const tmp = full + '.tmp'
  await fs.writeFile(tmp, args.text, 'utf8')
  await fs.rename(tmp, full)
  return { path: full }
}

export async function showFilterFolder (args: { dir?: string }): Promise<void> {
  await shell.openPath(resolveDir(args?.dir))
}
