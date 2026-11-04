// Display info for the overlay tab bar: icon, name and group per widget type.
import { MODULES, MODULE_GROUPS, ModuleGroup } from '@/web/woke/modules'
import type { WidgetMenu } from '@/web/overlay/widgets'

// Stored on the menu widget's own config. Older configs have neither field.
export interface TabBarConfig extends WidgetMenu {
  pinned?: number[]
  labels?: Record<number, string>
  // Taken off the bar with ×; listed under "Removed from bar" in the add list.
  dismissed?: number[]
}

const ICONS: Record<string, string> = {
  'settings': 'fa-cog',
  'stash-search': 'fa-search',
  'image-strip': 'fa-images',
  'timer': 'fa-stopwatch',
  'woke-market-tracker': 'fa-chart-line',
  'woke-league-invest': 'fa-sack-dollar',
  'woke-lab-gems': 'fa-gem',
  'woke-farming': 'fa-coins',
  'woke-session-analytics': 'fa-chart-bar',
  'woke-boss-runs': 'fa-skull',
  'woke-map-mods': 'fa-map',
  'woke-map-scan': 'fa-expand',
  'woke-essence-scan': 'fa-flask',
  'woke-loot-filter': 'fa-filter',
  'woke-atlas-strategies': 'fa-globe',
  'woke-mechanics': 'fa-puzzle-piece',
  'woke-campaign': 'fa-route',
  'woke-run-timer': 'fa-stopwatch-20',
  'woke-lab': 'fa-dungeon',
  'woke-pob-builds': 'fa-diagram-project',
  'woke-trade-searches': 'fa-star',
  'woke-trade': 'fa-handshake',
  'woke-regex-library': 'fa-code'
}

export function iconFor (wmType: string): string {
  return ICONS[wmType] ?? 'fa-window-maximize'
}

// Only APT's own multi widgets may have several copies (each holds different
// content). Every woke module is one tool, so adding it again opens the one
// already placed.
export function allowsCopies (wmType: string): boolean {
  return !wmType.startsWith('woke-')
}

export interface ToolGroup {
  label: string
  types: Array<{ type: string, name: string }>
}

export function groupTypes (specs: Array<{ type: string, name: string }>): ToolGroup[] {
  const groupOf = new Map<string, ModuleGroup>()
  for (const m of MODULES) for (const t of m.widgetTypes) groupOf.set(t, m.group)
  const groups: ToolGroup[] = MODULE_GROUPS
    .filter(g => g.id !== 'apt')
    .map(g => ({ label: g.label, types: specs.filter(s => groupOf.get(s.type) === g.id) }))
  groups.push({ label: 'Overlay', types: specs.filter(s => !groupOf.has(s.type)) })
  return groups.filter(g => g.types.length)
}
