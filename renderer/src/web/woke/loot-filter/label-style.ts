// A label's colours as CSS, and an item's picture, for the places that draw them.
import type { FilterAction } from './parse'
import { DEFAULT_BG, DEFAULT_TEXT, readStyle } from './edits'
import type { Colour } from './edits'
import { gameIcon } from '../ui/game-icons'

export const cssColour = (c: Colour) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${(c[3] ?? 255) / 255})`

export function labelCss (actions: FilterAction[]): { color: string, background: string, border: string } {
  const s = readStyle(actions)
  return {
    color: cssColour(s.text ?? DEFAULT_TEXT),
    background: cssColour(s.background ?? DEFAULT_BG),
    border: `1px solid ${s.border ? cssColour(s.border) : 'transparent'}`
  }
}

// A base type's picture, wherever the game data files it.
export function baseIcon (name: string): string | null {
  return gameIcon(name, 'ITEM') ?? gameIcon(name, 'DIVINATION_CARD') ?? gameIcon(name, 'GEM')
}
