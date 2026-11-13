// The pure part of app colours (app-colors.ts): parsing what's stored and the
// CSS that gives the app's frame its own colours. No DOM, so tests import it.
//
// The tokens are set on the frame elements only. Tokens derived on :root from
// others (--w-panel from --w-panel-base, the lines from the accent) are derived
// again here, as a var() resolves where it's declared, not where it's used.

export interface AppColors {
  accent: string
  panel: string
  fg: string
}

// The Hybrid theme's colours, so switching it on starts from what you see.
export const DEFAULT_APP_COLORS: AppColors = { accent: '#d4a64a', panel: '#13110f', fg: '#e8e2d6' }

// Starting points; the pickers fine-tune from any of them.
export const APP_COLOR_PRESETS: Array<{ id: string, label: string, colors: AppColors }> = [
  { id: 'gold', label: 'Gold', colors: DEFAULT_APP_COLORS },
  { id: 'ember', label: 'Ember', colors: { accent: '#e2703a', panel: '#160f0c', fg: '#efe3d8' } },
  { id: 'blood', label: 'Blood', colors: { accent: '#d04848', panel: '#140c0c', fg: '#eee0dd' } },
  { id: 'azure', label: 'Azure', colors: { accent: '#4aa8f0', panel: '#0e131a', fg: '#e3eaf2' } },
  { id: 'verdant', label: 'Verdant', colors: { accent: '#6cbf6f', panel: '#0e140f', fg: '#e2ebe1' } },
  { id: 'amethyst', label: 'Amethyst', colors: { accent: '#ac82e8', panel: '#130f19', fg: '#ebe4f4' } },
  { id: 'steel', label: 'Steel', colors: { accent: '#a3b0bd', panel: '#111315', fg: '#e5e8eb' } }
]

export function sameColors (a: AppColors, b: AppColors): boolean {
  return a.accent.toLowerCase() === b.accent.toLowerCase() &&
    a.panel.toLowerCase() === b.panel.toLowerCase() &&
    a.fg.toLowerCase() === b.fg.toLowerCase()
}

// Settings marks itself with data-w-settings; the rail and dock with data-woke-frame.
export const FRAME_SELECTOR = '[data-w-settings], [data-woke-frame]'

const HEX = /^#[0-9a-f]{6}$/i

export function parseAppColors (text: string | null): AppColors | null {
  if (!text) return null
  try {
    const v = JSON.parse(text) as Partial<AppColors> | null
    if (!v || ![v.accent, v.panel, v.fg].every(c => typeof c === 'string' && HEX.test(c))) return null
    return { accent: v.accent!, panel: v.panel!, fg: v.fg! }
  } catch {
    return null
  }
}

// Dark text on a light accent, light text on a dark one (WCAG relative luminance).
export function textOn (hex: string): string {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#17130c' : '#ffffff'
}

export function frameColorCss (c: AppColors): string {
  const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`
  return `${FRAME_SELECTOR} {
  --w-accent: ${c.accent};
  --w-accent-fg: ${textOn(c.accent)};
  --w-accent-soft: ${mix(c.accent, 12, 'transparent')};
  --w-line: ${mix(c.accent, 16, 'transparent')};
  --w-line-soft: ${mix(c.accent, 7, 'transparent')};
  --w-line-strong: ${mix(c.accent, 38, 'transparent')};
  --w-panel-base: ${mix(c.panel, 94, 'transparent')};
  --w-panel-solid-base: ${c.panel};
  --w-panel-2-base: ${mix(c.panel, 92, 'white')};
  --w-panel-3: ${mix(c.panel, 85, 'white')};
  --w-panel: var(--w-panel-base);
  --w-panel-2: var(--w-panel-2-base);
  --w-panel-solid: var(--w-panel-solid-base);
  --w-header-bg: ${mix(c.panel, 92, 'white')};
  --w-fg: ${c.fg};
  --w-dim: ${mix(c.fg, 65, c.panel)};
  --w-faint: ${mix(c.fg, 42, c.panel)};
}
/* The game look's bronze parts, made from the accent instead. */
:root[data-woke-look="game"] :is(${FRAME_SELECTOR}) {
  --w-frame: ${mix(c.accent, 45, c.panel)};
  --w-frame-hi: ${mix(c.accent, 75, c.panel)};
  --w-frame-lit: ${mix(c.accent, 90, c.panel)};
  --w-gold: ${mix(c.accent, 45, c.fg)};
  --w-gold-hi: ${mix(c.accent, 65, 'white')};
  --w-bevel: ${mix(c.panel, 93, 'white')};
  --w-bevel-primary: ${mix(c.accent, 38, c.panel)};
  --w-bevel-primary-shadow: inset 0 1px 0 ${mix(c.accent, 40, 'transparent')}, 0 0 6px ${mix(c.accent, 25, 'transparent')};
  --w-pressed: ${mix(c.panel, 85, 'black')};
  --w-pressed-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.9), inset 0 -1px 0 ${mix(c.accent, 35, 'transparent')};
  --w-well: ${mix(c.panel, 55, 'black')};
  --w-well-line: ${mix(c.accent, 22, c.panel)};
  --w-chip-line: ${mix(c.accent, 30, c.panel)};
  --w-chip-ground: ${mix(c.panel, 80, 'black')};
  --w-chip-on: ${mix(c.accent, 12, c.panel)};
  --w-head-ground: ${mix(c.accent, 8, c.panel)};
  --w-gold-fade: ${mix(c.accent, 55, c.panel)};
  --w-row-fade: ${mix(c.accent, 30, 'transparent')};
}
/* The plain look points these at other tokens on :root; point them again here,
 * at the frame's own. */
:root[data-woke-look="plain"] :is(${FRAME_SELECTOR}) {
  --w-frame: var(--w-line-strong);
  --w-frame-hi: var(--w-accent);
  --w-frame-lit: var(--w-accent);
  --w-gold: var(--w-fg);
  --w-gold-hi: var(--w-accent);
  --w-bevel: var(--w-panel-2);
  --w-bevel-primary: var(--w-accent);
  --w-pressed: var(--w-accent-soft);
  --w-well: var(--w-panel-2);
  --w-well-line: var(--w-line);
  --w-chip-line: var(--w-line-strong);
  --w-chip-on: var(--w-accent-soft);
  --w-head-ground: var(--w-header-bg);
  --w-gold-fade: var(--w-line);
  --w-row-fade: var(--w-line-soft);
}`
}
