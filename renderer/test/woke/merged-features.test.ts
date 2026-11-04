// Features that replaced a duplicate: the old data is carried over once.
import { describe, it, expect } from 'vitest'
import { moveStashSearchToLibrary } from '@/web/woke/regex-library/apt-import'

describe('Stash search strings move into the Regex library', () => {
  it('moves changed strings, skips untouched starters and duplicates, drops the widgets', () => {
    const widgets: Array<Record<string, any> & { wmId: number, wmType: string }> = [
      { wmId: 1, wmType: 'settings' },
      {
        wmId: 2,
        wmType: 'stash-search',
        wmTitle: 'Map rolling',
        entries: [
          { id: 1, name: '', text: 'Reflect', hotkey: null },
          { id: 2, name: 'Bad mods', text: '"!eflec|regen"', hotkey: 'Ctrl + 1' },
          { id: 3, name: '', text: 'Fossil', hotkey: 'F5' }
        ]
      },
      {
        wmId: 3,
        wmType: 'woke-regex-library',
        entries: [{ id: 7, name: 'Mine', text: '"!eflec|regen"', category: 'Maps', tags: [], notes: '', hotkey: null }]
      },
      { wmId: 4, wmType: 'stash-search', wmTitle: '', entries: [{ id: 1, name: '', text: 'abyss', hotkey: null }] }
    ]
    expect(moveStashSearchToLibrary(widgets)).toBe(2)
    expect(widgets.map(w => w.wmType)).toEqual(['settings', 'woke-regex-library'])
    const lib = widgets[1].entries as Array<{ id: number, text: string, category: string, hotkey: string | null }>
    expect(lib.map(e => e.text)).toEqual(['"!eflec|regen"', 'Fossil', 'abyss'])
    expect(lib[1]).toMatchObject({ id: 8, category: 'Map rolling', hotkey: 'F5' })
    expect(lib[2]).toMatchObject({ id: 9, category: 'Stash search' })
  })

  it('makes a library when there is none and leaves configs without stash search alone', () => {
    const widgets: Array<Record<string, any> & { wmId: number, wmType: string }> = [
      { wmId: 5, wmType: 'stash-search', wmTitle: 'Dump', entries: [{ id: 1, name: 'Six-link', text: '"Sockets: \\S-\\S-\\S-\\S-\\S-\\S"', hotkey: null }] }
    ]
    expect(moveStashSearchToLibrary(widgets)).toBe(1)
    expect(widgets).toHaveLength(1)
    expect(widgets[0]).toMatchObject({ wmType: 'woke-regex-library', wmId: 6 })
    const none = [{ wmId: 1, wmType: 'settings' }]
    expect(moveStashSearchToLibrary(none)).toBe(0)
  })
})
