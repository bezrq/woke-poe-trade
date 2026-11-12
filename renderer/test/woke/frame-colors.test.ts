import { describe, it, expect } from 'vitest'
import { DEFAULT_APP_COLORS, FRAME_SELECTOR, frameColorCss, parseAppColors, textOn } from '@/web/woke/ui/frame-colors'

describe('app colours', () => {
  it('reads only three full hex colours', () => {
    expect(parseAppColors(null)).toBeNull()
    expect(parseAppColors('not json')).toBeNull()
    expect(parseAppColors('{"accent":"#fff","panel":"#000000","fg":"#ffffff"}')).toBeNull()
    expect(parseAppColors('{"accent":"#d4a64a","panel":"#13110f"}')).toBeNull()
    expect(parseAppColors(JSON.stringify(DEFAULT_APP_COLORS))).toEqual(DEFAULT_APP_COLORS)
  })

  it('puts dark text on a light accent and light text on a dark one', () => {
    expect(textOn('#d4a64a')).toBe('#17130c')
    expect(textOn('#ffffff')).toBe('#17130c')
    expect(textOn('#1a237e')).toBe('#ffffff')
  })

  it('colours only the frame, and derives the panel tokens there', () => {
    const css = frameColorCss({ accent: '#3fa7ff', panel: '#101820', fg: '#f0f0f0' })
    // Every rule lands on the frame elements; :root only picks the look.
    const selectors = [...css.matchAll(/^([^\s{}/*-][^{]*)\{/gm)].map(m => m[1].trim())
    expect(selectors).toEqual([
      FRAME_SELECTOR,
      `:root[data-woke-look="game"] :is(${FRAME_SELECTOR})`,
      `:root[data-woke-look="plain"] :is(${FRAME_SELECTOR})`
    ])
    expect(css).toContain('--w-accent: #3fa7ff;')
    expect(css).toContain('--w-panel-solid-base: #101820;')
    expect(css).toContain('--w-fg: #f0f0f0;')
    // Derived on :root from the *-base colours, so they must be derived again
    // here or the frame would keep the theme's background.
    expect(css).toContain('--w-panel: var(--w-panel-base);')
    expect(css).toContain('--w-panel-2: var(--w-panel-2-base);')
    expect(css).toContain('--w-panel-solid: var(--w-panel-solid-base);')
  })
})
