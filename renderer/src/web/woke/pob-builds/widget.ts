import type { Widget, Anchor } from '@/web/overlay/widgets'
import { hostRequest } from '../shared/host'

export const POB_BUILDS_TYPE = 'woke-pob-builds'

export interface PobBuildsWidget extends Widget {
  anchor: Anchor
  // '' = PoB's default folder (Documents/Path of Building/Builds)
  buildsDir: string
  // Path to Path of Building.exe; '' = open the file with the system default app
  pobExe: string
  pinned: string[]
  // The build other modules (e.g. the campaign tracker) should use.
  activeBuild: string | null
}

// Shapes returned by main/src/woke/pob-builds.ts
export interface PobBuildEntry {
  relPath: string
  name: string
  folder: string
  mtime: number
  className: string
  ascendClassName: string
  level: number | null
  mainSkill: string
}

export interface PobGem {
  name: string
  level: number | null
  quality: number | null
  enabled: boolean
}

export interface PobSkillGroup {
  label: string
  slot: string
  enabled: boolean
  isMain: boolean
  gems: PobGem[]
}

export interface PobTreeSpec {
  title: string
  url: string
  isActive: boolean
}

export interface PobDetails {
  className: string
  ascendClassName: string
  level: number | null
  mainSkill: string
  notes: string
  skills: PobSkillGroup[]
  trees: PobTreeSpec[]
}

function dirArg (cfg: PobBuildsWidget) {
  return cfg.buildsDir || undefined
}

export const pobApi = {
  list: (cfg: PobBuildsWidget) =>
    hostRequest<{ dir: string, builds: PobBuildEntry[] }>('pob-list', { dir: dirArg(cfg) }),
  read: (cfg: PobBuildsWidget, relPath: string) =>
    hostRequest<PobDetails>('pob-read', { dir: dirArg(cfg), relPath }),
  open: (cfg: PobBuildsWidget, relPath: string) =>
    hostRequest<void>('pob-open', { dir: dirArg(cfg), relPath, pobExe: cfg.pobExe || undefined }),
  show: (cfg: PobBuildsWidget, relPath: string) =>
    hostRequest<void>('pob-show', { dir: dirArg(cfg), relPath })
}

export function buildMatches (b: PobBuildEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [b.name, b.folder, b.className, b.ascendClassName, b.mainSkill]
    .some(f => f.toLowerCase().includes(q))
}

// Pinned first (in pin order), then most recently saved.
export function sortBuilds (builds: PobBuildEntry[], pinned: string[]): PobBuildEntry[] {
  return [...builds].sort((a, b) => {
    const pa = pinned.indexOf(a.relPath)
    const pb = pinned.indexOf(b.relPath)
    if (pa !== -1 || pb !== -1) {
      if (pa === -1) return 1
      if (pb === -1) return -1
      return pa - pb
    }
    return b.mtime - a.mtime
  })
}

export function describe (b: { className: string, ascendClassName: string, level: number | null, mainSkill: string }): string {
  return [
    b.mainSkill,
    b.ascendClassName || b.className,
    b.level != null ? `lvl ${b.level}` : ''
  ].filter(Boolean).join(' · ')
}
