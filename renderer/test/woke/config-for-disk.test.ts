// Saving while Settings is open must not record a popup as open: it would show
// again at the next start.
import { describe, it, expect } from 'vitest'
import { configForDisk } from '@/web/woke/shared/config-disk'

describe('configForDisk', () => {
  const config = () => ({
    league: 'Standard',
    widgets: [
      { wmId: 1, wmZorder: 'exclusive', wmWants: 'show' },
      { wmId: 2, wmZorder: 'exclusive', wmWants: 'hide' },
      { wmId: 3, wmZorder: 4, wmWants: 'show' }
    ]
  })

  it('saves an open popup as closed, and leaves the live config alone', () => {
    const live = config()
    const saved = JSON.parse(configForDisk(live)) as ReturnType<typeof config>
    expect(saved.widgets[0].wmWants).toBe('hide')
    expect(live.widgets[0].wmWants).toBe('show')
  })

  it('keeps everything else as it is', () => {
    const saved = JSON.parse(configForDisk(config())) as ReturnType<typeof config>
    expect(saved.league).toBe('Standard')
    expect(saved.widgets[1].wmWants).toBe('hide')
    expect(saved.widgets[2].wmWants).toBe('show')
  })
})
