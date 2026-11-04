// The trade assistant reads whispers from other client languages through
// APT's chat parser.
import { describe, it, expect, beforeAll } from 'vitest'
import * as Data from '@/assets/data'
import { parseTradeLine } from '@/web/woke/trade/whispers'

describe('whispers in a Russian client', () => {
  beforeAll(() => Data.init('ru'))

  it('reads a trade site whisper with item, price and tab', () => {
    const line = '2026/11/04 12:00:00 123 abc [INFO Client 1] @От кого Pupkin: Здравствуйте, хочу купить у вас Headhunter Leather Belt за 120 divine в лиге Standard (секция "Sale"; позиция: 3 столбец, 5 ряд)'
    const ev = parseTradeLine(line, 0, 'ru')
    expect(ev).toMatchObject({
      kind: 'whisper-in',
      who: 'Pupkin',
      offer: { item: 'Headhunter Leather Belt', qty: 1, price: { amount: 120, currency: 'Divine Orb' }, tab: { name: 'Sale', left: 3, top: 5 }, bulk: false }
    })
  })

  it('still reads English lines the same way', () => {
    const ev = parseTradeLine('2026/11/04 12:00:00 123 abc [INFO Client 1] : Trade accepted.', 0, 'ru')
    expect(ev?.kind).toBe('trade-accepted')
  })
})
