// The quick look the Fates marks repeat while they're up: finds the cards on
// every Fate window, nothing on other screens, and is quick.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { decodePng } from '../fake-host/png'
import { glanceFates } from '../../main/src/woke/fate-read'

const SCREENS = path.resolve(__dirname, '../fixtures/screens')

function bgra (file: string) {
  const img = decodePng(fs.readFileSync(path.join(SCREENS, file)))
  const data = new Uint8Array(img.width * img.height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = img.data[i + 2]; data[i + 1] = img.data[i + 1]; data[i + 2] = img.data[i]; data[i + 3] = 255
  }
  return { ...img, data }
}

describe('Fates glance', () => {
  const cases: Array<[string, number]> = [
    ['fates-pick-stormcaller.png', 4], ['fates-pick-sanguine.png', 3], ['fates-pick-two-held.png', 5],
    ['fates-invoke-three-held.png', 3], ['fates-invoke-one.png', 2], ['fates-invoke-duplicate.png', 1]
  ]
  for (const [file, cards] of cases) {
    it(`sees ${cards} cards on ${file}`, () => {
      const img = bgra(file)
      const t0 = performance.now()
      const sig = glanceFates(img.data, img.width, img.height, 1100 / img.height)
      const ms = performance.now() - t0
      expect(sig.split(' ').filter(Boolean)).toHaveLength(cards)
      expect(ms).toBeLessThan(250)
    })
  }

  it('sees nothing on other screens', () => {
    for (const file of fs.readdirSync(SCREENS).filter(f => f.endsWith('.png') && !f.startsWith('fates-'))) {
      const img = bgra(file)
      expect(glanceFates(img.data, img.width, img.height), file).toBe('')
    }
  })
})
