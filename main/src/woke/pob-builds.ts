import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { app, shell } from 'electron'
import { parseBuild, summarize } from './pob-parse'
import type { PobDetails, PobSummary } from './pob-parse'

const MAX_BUILDS = 1000
const MAX_DEPTH = 4

export interface PobBuildEntry extends PobSummary {
  // Path relative to the builds folder, with forward slashes.
  relPath: string
  name: string
  folder: string
  mtime: number
}

export function defaultBuildsDir (): string {
  // Both PoB Community and the original PoB use this folder by default.
  return path.join(app.getPath('documents'), 'Path of Building', 'Builds')
}

function resolveDir (dir: unknown): string {
  return (typeof dir === 'string' && dir.trim()) ? dir.trim() : defaultBuildsDir()
}

// Only files inside the builds folder with a .xml extension may be touched.
function resolveBuild (dir: unknown, relPath: unknown): string {
  if (typeof relPath !== 'string' || !relPath) throw new Error('Missing build path')
  const root = path.resolve(resolveDir(dir))
  const full = path.resolve(root, relPath)
  if (!full.startsWith(root + path.sep) || path.extname(full).toLowerCase() !== '.xml') {
    throw new Error('Build path is outside the builds folder')
  }
  return full
}

async function walk (root: string, rel: string, depth: number, out: PobBuildEntry[]): Promise<void> {
  if (depth > MAX_DEPTH || out.length >= MAX_BUILDS) return
  const entries = await fs.readdir(path.join(root, rel), { withFileTypes: true })
  for (const entry of entries) {
    if (out.length >= MAX_BUILDS) return
    const childRel = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      await walk(root, childRel, depth + 1, out)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xml')) {
      const full = path.join(root, childRel)
      try {
        const [stat, xml] = await Promise.all([fs.stat(full), fs.readFile(full, 'utf8')])
        out.push({
          relPath: childRel,
          name: entry.name.replace(/\.xml$/i, ''),
          folder: rel,
          mtime: stat.mtimeMs,
          ...summarize(parseBuild(xml))
        })
      } catch {}
    }
  }
}

export async function listBuilds (args: { dir?: string }): Promise<{ dir: string, builds: PobBuildEntry[] }> {
  const dir = resolveDir(args?.dir)
  const builds: PobBuildEntry[] = []
  await walk(path.resolve(dir), '', 0, builds)
  return { dir, builds }
}

export async function readBuild (args: { dir?: string, relPath: string }): Promise<PobDetails> {
  const full = resolveBuild(args?.dir, args?.relPath)
  return parseBuild(await fs.readFile(full, 'utf8'))
}

export async function showBuild (args: { dir?: string, relPath: string }): Promise<void> {
  shell.showItemInFolder(resolveBuild(args?.dir, args?.relPath))
}

// Starts Path of Building with the build file as its argument.
export async function openBuild (args: { dir?: string, relPath: string, pobExe?: string }): Promise<void> {
  const full = resolveBuild(args?.dir, args?.relPath)
  const exe = typeof args?.pobExe === 'string' ? args.pobExe.trim() : ''
  if (!exe) {
    const err = await shell.openPath(full)
    if (err) throw new Error(err)
    return
  }
  await fs.access(exe)
  const child = spawn(exe, [full], { detached: true, stdio: 'ignore', cwd: path.dirname(exe) })
  child.on('error', () => {})
  child.unref()
}
