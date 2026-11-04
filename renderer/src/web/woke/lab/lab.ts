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
}

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
