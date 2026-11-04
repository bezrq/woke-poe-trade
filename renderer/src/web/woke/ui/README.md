# Woke UI

Shared look for every woke module. Build widgets from these pieces instead of
hand-rolled Tailwind greys, so a theme change restyles everything at once.

## Themes

`theme.css` defines `--w-*` tokens on `:root`; `<html data-woke-theme>` picks a
set: `hybrid` (default), `native`, `modern`, `classic`. Users switch in
Settings → Appearance (stored in localStorage `woke.theme`).

Unless the theme is `classic`, a skin layer also recolours APT's own windows
(`.widget-default-style` and the Tailwind `gray-*` utilities inside
`#overlay-window`). Only colours change, never APT logic or layout.

## Components

| Component | Use |
| --- | --- |
| `WPanel` | Widget shell. Slots: `title`, `actions`, `tabs`, `toolbar`, `meta`, default body (scrolls), `footer`. Props: `title`, `width`, `maxHeight`, `scroll`. |
| `WTabs` | Underlined tabs, `v-model` + `options: { value, label, count? }[]`. |
| `WSegmented` | Small segmented control (periods, modes). |
| `WField` | Text/number/search input with optional `icon` and `suffix`; Esc clears. |
| `WSelect` | Select with `options: { value, label }[]`. |
| `WButton` | `variant`: default, primary, ghost, danger; `size`: md, sm; `icon`; `href` renders a link. |
| `WListItem` | Clickable list row with `sub` line and trailing `actions`; `active` highlights. |
| `WPrice` | Chaos value with the chaos/divine icon; switches to divines at 1 div unless `unit` is forced. |
| `WDelta` | Ratio change as a coloured percentage (`0.12` → `+12%`). |
| `WSpark` | Sparkline with area fill and endpoint, coloured by direction. |
| `WChip` | Tag or toggle pill (`clickable`, `active`). |
| `WKbd` | Renders an APT shortcut string (`"Alt + M"`). |
| `WEmpty` | Empty or loading state with an icon. |

## Utility classes

`w-row` (grid row; set `grid-template-columns` yourself), `w-row--head`,
`w-group-label`, `w-num` (tabular mono digits), `w-dim`, `w-faint`, `w-up`,
`w-down`, `w-accent`, `w-trunc`, `w-icon-btn`, `w-surface`, and item colours
`w-rarity-{normal,magic,rare,unique,gem,currency,divination}`.

## Rules

- Colours only from `--w-*` tokens; no `text-gray-*`/`bg-gray-*` in woke code.
- Prices go through `WPrice`, changes through `WDelta`.
- Hotkeys are shown with `WKbd`.
