import { describe, it, expect } from 'vitest'
import { LOOT_FILTER_TYPE, neverSinkFromOutput, seedLootFilterWidget } from '@/web/woke/loot-filter/widget'

const OUTPUT = [
  '# WOKE-LOOT-FILTER-EDITOR',
  '# Made from NeverSink 8.20.2 Very strict, downloaded from GitHub, with 1 change(s).',
  '# This file is rewritten on every save from the loot filter editor; change it there.',
  '',
  '# VERSION:  8.20.2',
  '# TYPE:     4-VERY-STRICT',
  '# STYLE:    DEFAULT',
  '# AUTHOR:   NeverSink'
].join('\r\n')

describe('seedLootFilterWidget', () => {
  it('is ready and hidden, so adding it opens nothing over the game', () => {
    const w = seedLootFilterWidget(7)
    expect(w.wmId).toBe(7)
    expect(w.wmType).toBe(LOOT_FILTER_TYPE)
    expect(w.wmWants).toBe('hide')
    expect(w.wmFlags).not.toContain('uninitialized')
    expect(w.sampleHotkey).toBe('Alt + F')
  })

  it('leaves a key unset when something else already uses it', () => {
    const w = seedLootFilterWidget(1, ['Alt + F'])
    expect(w.sampleHotkey).toBeNull()
    expect(w.editorHotkey).toBe('Alt + Shift + F')
    expect(seedLootFilterWidget(1, ['Shift + Alt + F']).editorHotkey).toBeNull()
  })
})

describe('neverSinkFromOutput', () => {
  it('reads the version and strictness of a saved download', () => {
    expect(neverSinkFromOutput(OUTPUT)).toEqual({ version: '8.20.2', level: 4 })
  })

  it('ignores files the editor did not make', () => {
    expect(neverSinkFromOutput(OUTPUT.replace('# WOKE-LOOT-FILTER-EDITOR', '# Mine'))).toBeNull()
  })

  it('ignores a copy made from a local file', () => {
    expect(neverSinkFromOutput(OUTPUT.replace('downloaded from GitHub', 'from a file'))).toBeNull()
  })

  it('ignores a style it could not restore', () => {
    expect(neverSinkFromOutput(OUTPUT.replace('DEFAULT', 'CUSTOM-SOUNDS'))).toBeNull()
  })
})
