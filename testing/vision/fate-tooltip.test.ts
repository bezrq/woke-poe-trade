// A hovered Fate reward's tooltip: the white text box is cut into lines, read
// by the OCR worker, and the gear modifier picked out ("Physical"). The fixture
// is a 1100p crop with the cursor on the Axe reward of the Crowkeeper card.
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { decodePng } from '../fake-host/png'
import { parseRewardModifier, rewardTooltipLines } from '../../main/src/woke/fate-tooltip'

const require = createRequire(import.meta.url)
const SCREENS = path.resolve(__dirname, '../fixtures/screens')
const OCR_DIR = process.env.WOKE_OCR_DIR ?? path.resolve(__dirname, '../.cache/cv-ocr')
const haveOcr = fs.existsSync(path.join(OCR_DIR, 'opencv.js'))
const SCAN_MODEL = path.resolve(__dirname, '../../renderer/public/data/ocr/poe.traineddata')
const S = 1100 / 2160
const CURSOR = { x: 655, y: 450 }

function screen (file: string) {
  const img = decodePng(fs.readFileSync(path.join(SCREENS, file)))
  const data = new Uint8Array(img.width * img.height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = img.data[i + 2]; data[i + 1] = img.data[i + 1]; data[i + 2] = img.data[i]; data[i + 3] = 255
  }
  return { width: img.width, height: img.height, data }
}

describe('Fate reward tooltip', () => {
  it('cuts the two white lines of the box over the hovered reward', () => {
    const img = screen('fates-tooltip-axe.png')
    const lines = rewardTooltipLines(img.data, img.width, img.height, CURSOR.x, CURSOR.y, S)
    expect(lines).toHaveLength(2)
    expect(lines[1].width).toBeGreaterThan(lines[1].height * 10)
  })

  it('picks the modifier out of the text, misreads and all', () => {
    expect(parseRewardModifier(['Empowered Monster will drop additional Rare Axes', 'Axes dropped by Empowered Monster will have a Physical modifier'])).toBe('Physical')
    expect(parseRewardModifier(['Wands dropped by Empowered Monster will have no Attack modifiers'])).toBe('no Attack')
    expect(parseRewardModifier(['Boots dropped by Empowered Monster will have a Spced modifier'])).toBe('Speed')
    expect(parseRewardModifier(['Empowered Monster will drop additional Rare Maces'])).toBeNull()
  })
})

describe.skipIf(!haveOcr)('Fate reward tooltip, OCR', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let V: any
  beforeAll(async () => {
    V = require('../fake-host/dist/vision-lib.cjs')
    await V.Bindings.init(OCR_DIR)
    await V.Bindings.changeLanguage('en', OCR_DIR)
    V.Bindings.loadModelData(new Uint8Array(fs.readFileSync(SCAN_MODEL)), 'poe')
  })

  it('reads "Physical" off the Axe reward', () => {
    const img = screen('fates-tooltip-axe.png')
    const text = rewardTooltipLines(img.data, img.width, img.height, CURSOR.x, CURSOR.y, S).map(l => V.ocrLine(l))
    expect(parseRewardModifier(text), text.join(' | ')).toBe('Physical')
  })
})
