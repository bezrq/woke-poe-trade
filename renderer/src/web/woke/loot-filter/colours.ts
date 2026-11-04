// Named colours, shapes and sounds the filter syntax accepts for beams,
// minimap icons and alert sounds.
export const POE_COLOURS = ['Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow', 'Cyan', 'Grey', 'Orange', 'Pink', 'Purple'] as const

const CSS: Record<string, string> = {
  Red: '#e0453a',
  Green: '#4bc35b',
  Blue: '#4a7fe0',
  Brown: '#9a6a3a',
  White: '#f0f0f0',
  Yellow: '#f0d64a',
  Cyan: '#4ad8e0',
  Grey: '#9a9a9a',
  Orange: '#f08a2a',
  Pink: '#f07ac8',
  Purple: '#a45ae0'
}

export function poeColour (name: string): string {
  return CSS[name] ?? '#999'
}

export const ICON_SHAPES = ['Circle', 'Diamond', 'Hexagon', 'Square', 'Star', 'Triangle', 'Cross', 'Moon', 'Raindrop', 'Kite', 'Pentagon', 'UpsideDownHouse'] as const

const GLYPH: Record<string, string> = {
  Circle: '●',
  Diamond: '◆',
  Hexagon: '⬢',
  Square: '■',
  Star: '★',
  Triangle: '▲',
  Cross: '✚',
  Moon: '☾',
  Raindrop: '⬮',
  Kite: '⬥',
  Pentagon: '⬟',
  UpsideDownHouse: '⌂'
}

export function shapeGlyph (shape: string): string {
  return GLYPH[shape] ?? '●'
}

// 0 is the largest icon.
export const ICON_SIZES = [{ value: '0', label: 'Large' }, { value: '1', label: 'Medium' }, { value: '2', label: 'Small' }]

// Built-in alert sounds 1-16.
export const SOUND_IDS = Array.from({ length: 16 }, (_, i) => String(i + 1))
