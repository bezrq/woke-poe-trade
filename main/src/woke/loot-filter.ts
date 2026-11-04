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
}

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
  return { dir, files }
}

export async function readFilter (args: { dir?: string, name: string }): Promise<{ text: string, mtime: number }> {
  const full = resolveFile(args?.dir, args?.name)
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
