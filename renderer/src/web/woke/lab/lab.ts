import type { Widget, Anchor } from '@/web/overlay/widgets'

export const LAB_TYPE = 'woke-lab'

export type LabDifficulty = 'normal' | 'cruel' | 'merciless' | 'uber'
export const DIFFICULTIES: LabDifficulty[] = ['normal', 'cruel', 'merciless', 'uber']
export type OpenTarget = 'overlay' | 'external'

// poelab.com's daily layout pages. Editable in settings in case they move.
export const DEFAULT_LAB_URLS: Record<LabDifficulty, string> = {
  normal: 'https://www.poelab.com/gtgax',
  cruel: 'https://www.poelab.com/r8aws',
  merciless: 'https://www.poelab.com/riikv',
  uber: 'https://www.poelab.com/wfbra'
}

export interface LabWidget extends Widget {
  anchor: Anchor
  urls: Record<LabDifficulty, string>
  defaultDifficulty: LabDifficulty
  hotkeyOverlay: string | null
  hotkeyExternal: string | null
  notes: string
  // Open the layout when you enter Aspirants' Plaza (default on).
  autoOpen?: boolean
  // Show poelab's whole page instead of just the layout image.
  fullPage?: boolean
}

// The lab's entrance. The game spells it "Aspirants' Plaza" (its boss rooms
// are "Aspirant's Trial"), so it is recognised by its area id, which is the
// same in every client language: "3_Labyrinth_Airlock" (merciless), etc.
export const PLAZA_ZONE = "Aspirants' Plaza"

export function isPlazaArea (areaId: string): boolean {
  return /(^|_)Labyrinth_Airlock$/i.test(areaId)
}

// The plaza's area level tells the difficulty: 33 / 55 / 68 / 75.
export function difficultyForAreaLevel (level: number): LabDifficulty {
  if (level <= 33) return 'normal'
  if (level <= 55) return 'cruel'
  if (level <= 68) return 'merciless'
  return 'uber'
}

// poelab layout images carry the layout's date (e.g. …/2026-11-04_uber.jpg).
export function dateInUrl (url: string): string | null {
  return /(\d{4}-\d{2}-\d{2})/.exec(url)?.[1] ?? null
}

// Finds the layout image on a poelab page (runs inside the page).
export const FIND_LAYOUT_JS = `(() => {
  const pick = document.getElementById('notesImg') ||
    Array.from(document.images).find(i => /labfiles/i.test(i.src));
  return pick ? pick.src : null;
})()`

export function hotkeyTarget (wmId: number, where: OpenTarget): string {
  return `woke-lab:${wmId}:${where}`
}

export function parseHotkeyTarget (target: string): { wmId: number, where: OpenTarget } | null {
  const m = /^woke-lab:(\d+):(overlay|external)$/.exec(target)
  return m ? { wmId: Number(m[1]), where: m[2] as OpenTarget } : null
}

export function labLabel (d: LabDifficulty): string {
  return d === 'uber' ? 'Uber' : d[0].toUpperCase() + d.slice(1)
}

// Lab layouts change daily at midnight UTC (7 PM US Central in summer,
// 6 PM in winter). Returns ms until the next reset.
export function msUntilLabReset (now: number): number {
  const DAY = 24 * 60 * 60 * 1000
  return DAY - (now % DAY)
}

export function formatDuration (ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h}h ${m}m` : `${m}m`
}
