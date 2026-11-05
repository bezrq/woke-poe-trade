// Display info for the overlay tab bar: icon, name and group per widget type.
import { MODULES, MODULE_GROUPS, ModuleGroup } from '@/web/woke/modules'
import type { Anchor, WidgetMenu } from '@/web/overlay/widgets'
import { moduleIconForWidget } from '../ui/game-icons'

// Stored on the menu widget's own config. Older configs have neither field.
export interface TabBarConfig extends WidgetMenu {
  pinned?: number[]
  labels?: Record<number, string>
  // Moved to the rail layout (migrateToRail). Unset on older and new configs.
  rail?: boolean
  // Left by older versions, which had a "remove from bar" button. Every tool
  // is in the launcher now, so migrateToRail drops it.
  dismissed?: number[]
}

// Pinned on the rail until the user picks their own in the launcher.
const DEFAULT_PIN_TYPES = ['woke-market-tracker', 'woke-boss-runs', 'woke-map-scan', 'woke-loot-filter']

// A window title that is only an icon ("{icon=fa-cog}"): settings and search.
export function parseWidgetTitle (wmTitle: string): { icon?: string, title: string } {
  const m = wmTitle.match(/^(?:\{icon=(?<icon>[^}]+)\}\s*)?(?<title>.*)$/)
  return { icon: m?.groups?.icon, title: m?.groups?.title ?? '' }
}

// Once per config: the bar becomes a short rail on the left edge, below the
// game's buffs. Icon-only tools stay on it, plus one of each default pin.
export function migrateToRail (
  config: TabBarConfig,
  widgets: Array<{ wmId: number, wmType: string, wmTitle: string }>
): void {
  if (config.rail) return
  const iconOnly = widgets.filter(w => {
    const { icon, title } = parseWidgetTitle(w.wmTitle)
    return !!icon && !title
  })
  const pins = DEFAULT_PIN_TYPES
    .map(type => widgets.find(w => w.wmType === type))
    .filter((w): w is typeof widgets[number] => !!w)
  config.pinned = [...iconOnly, ...pins].map(w => w.wmId)
  config.anchor = railAnchor()
  delete config.dismissed
  config.rail = true
}

export function railAnchor (): Anchor {
  return { pos: 'tl', x: 0, y: 10.5 }
}

// Copied item text has separator lines, in every game language. Anything else
// pasted into the launcher is just a search.
export function looksLikeItem (text: string): boolean {
  return /^-{8}\s*$/m.test(text)
}

// APT's own windows; toolkit modules use their module icon (modules.ts).
const APT_ICONS: Record<string, string> = {
  'settings': 'fa-cog',
  'image-strip': 'fa-images',
  'timer': 'fa-stopwatch'
}

// APT's icon-only windows have no name of their own to show on hover.
export const ICON_TOOL_NAMES: Record<string, string> = {
  'settings': 'Settings',
  'item-search': 'Item search'
}

export function artFor (wmType: string): string | null {
  return moduleIconForWidget(wmType)?.art ?? null
}

export function iconFor (wmType: string): string {
  const mod = moduleIconForWidget(wmType)
  if (mod) return mod.fa.replace(/^fa[srb] /, '')
  return APT_ICONS[wmType] ?? 'fa-window-maximize'
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

export interface ModuleGroupOf<T> {
  label: string
  items: T[]
}

// Every group, even an empty one, so a filtered launcher keeps its columns.
export function groupByModule<T extends { wmType: string }> (items: T[]): Array<ModuleGroupOf<T>> {
  const groupOf = new Map<string, ModuleGroup>()
  for (const m of MODULES) for (const t of m.widgetTypes) groupOf.set(t, m.group)
  const groups: Array<ModuleGroupOf<T>> = MODULE_GROUPS
    .filter(g => g.id !== 'apt')
    .map(g => ({ label: g.label, items: items.filter(i => groupOf.get(i.wmType) === g.id) }))
  groups.push({ label: 'Overlay', items: items.filter(i => !groupOf.has(i.wmType)) })
  return groups
}
