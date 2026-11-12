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
  --w-header-bg: linear-gradient(${mix(c.panel, 90, 'white')}, ${mix(c.panel, 95, 'white')});
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
  --w-bevel: linear-gradient(${mix(c.panel, 88, 'white')}, ${c.panel});
  --w-bevel-primary: linear-gradient(${mix(c.accent, 50, c.panel)}, ${mix(c.accent, 25, c.panel)});
  --w-bevel-primary-shadow: inset 0 1px 0 ${mix(c.accent, 40, 'transparent')}, 0 0 6px ${mix(c.accent, 25, 'transparent')};
  --w-pressed: linear-gradient(${mix(c.panel, 80, 'black')}, ${mix(c.panel, 92, 'white')});
  --w-pressed-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.9), inset 0 -1px 0 ${mix(c.accent, 35, 'transparent')};
  --w-well: ${mix(c.panel, 55, 'black')};
  --w-well-line: ${mix(c.accent, 22, c.panel)};
  --w-chip-line: ${mix(c.accent, 30, c.panel)};
  --w-chip-ground: ${mix(c.panel, 80, 'black')};
  --w-chip-on: linear-gradient(${mix(c.accent, 16, c.panel)}, ${mix(c.accent, 6, c.panel)});
  --w-head-ground: linear-gradient(${mix(c.accent, 14, c.panel)}, ${mix(c.panel, 85, 'black')});
  --w-gold-fade: linear-gradient(90deg, transparent, ${mix(c.accent, 60, c.panel)} 20%, ${c.accent} 50%, ${mix(c.accent, 60, c.panel)} 80%, transparent);
  --w-row-fade: linear-gradient(90deg, transparent, ${mix(c.accent, 35, 'transparent')} 15%, ${mix(c.accent, 35, 'transparent')} 85%, transparent);
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
  --w-gold-fade: linear-gradient(var(--w-line), var(--w-line));
  --w-row-fade: linear-gradient(var(--w-line-soft), var(--w-line-soft));
}`
}
