// main/src/host-files/GameConfig.ts: PoE's own keys and fullscreen mode, read from
// values as they appear in production_Config.ini.
import { describe, it, expect } from 'vitest'
import ini from '../../main/node_modules/ini'
import { readGameSettings } from '../../main/src/host-files/GameConfig'

const read = (text: string) => readGameSettings(ini.parse(text))

describe('readGameSettings', () => {
  it('names the game\'s keys, with and without a modifier', () => {
    const { binds } = read('[ACTION_KEYS]\nopen_atlas_screen=71\nuse_flask_in_slot1=49\nzoom_in=33 2\n')
    expect(binds).toContainEqual({ hotkey: 'G', action: 'Open atlas screen' })
    expect(binds).toContainEqual({ hotkey: '1', action: 'Use flask in slot1' })
    expect(binds).toContainEqual({ hotkey: 'Ctrl + PageUp', action: 'Zoom in' })
  })

  it('skips mouse buttons and keys it can\'t name', () => {
    expect(read('[ACTION_KEYS]\nuse_bound_skill1=1\nuse_bound_skill2=4\n').binds).toEqual([])
  })

  it.each([
    ['fullscreen=true\nborderless_windowed_fullscreen=false', true],
    ['fullscreen=false\nborderless_windowed_fullscreen=true', false],
    ['fullscreen=true\nborderless_windowed_fullscreen=true', false],
    ['fullscreen=false\nborderless_windowed_fullscreen=false', false],
    ['', false]
  ])('fullscreen settings %j mean exclusive: %j', (display, expected) => {
    expect(read(`[DISPLAY]\n${display}\n`).isExclusiveFullscreen).toBe(expected)
  })
})
