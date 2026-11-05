import { clipboard, Clipboard, NativeImage } from 'electron'
import type { Logger } from '../RemoteLogger'

// woke: 48 → 24. The wait between PoE writing the item text and us noticing
// it averages half this delay, so the price check opens ~12 ms sooner.
const POLL_DELAY = 24
const POLL_LIMIT = 500

// PoE must read clipboard within this timeframe,
// after that we restore clipboard.
// If game lagged for some reason, it will read
// wrong content (= restored clipboard, potentially containing password).
// woke: 120 → 250. The game does lag past 120 ms, and then it pastes your own
// text and presses Enter. This also spaces chat commands apart a little more.
const RESTORE_AFTER = 250

export class HostClipboard {
  private pollPromise?: Promise<string>
  private elapsed = 0
  private shouldRestore = false

  private isRestored = true

  get isPolling () { return this.pollPromise != null }

  constructor (
    private logger: Logger
  ) {}

  updateOptions (restoreClipboard: boolean) {
    this.shouldRestore = restoreClipboard
  }

  async readItemText (): Promise<string> {
    this.elapsed = 0
    if (this.pollPromise) {
      return await this.pollPromise
    }

    let textBefore = clipboard.readText()
    const imageBefore = this.shouldRestore && !textBefore ? keepImage() : null
    const restore = () => {
      if (imageBefore) clipboard.writeImage(imageBefore)
      else clipboard.writeText(textBefore)
    }
    if (isPoeItem(textBefore)) {
      textBefore = ''
      if (process.platform !== 'linux') {
        clipboard.writeText('')
      } else {
        // workaround KDE's "Prevent empty clipboard" feature
        // see https://github.com/SnosMe/awakened-poe-trade/issues/1790#issuecomment-4062830614
        clipboard.writeText(`__APT_FORCE_EMPTY_${Date.now()}`)
      }
    } else if (process.platform === 'linux') {
      // workaround bug in Proton 10+ https://github.com/SnosMe/awakened-poe-trade/issues/1846
      clipboard.writeText(`__APT_FORCE_EMPTY_${Date.now()}`)
    }

    this.pollPromise = new Promise((resolve, reject) => {
      const poll = () => {
        const textAfter = clipboard.readText()

        if (isPoeItem(textAfter)) {
          if (this.shouldRestore) {
            restore()
          }
          this.pollPromise = undefined
          resolve(textAfter)
        } else {
          this.elapsed += POLL_DELAY
          if (this.elapsed < POLL_LIMIT) {
            setTimeout(poll, POLL_DELAY)
          } else {
            if (this.shouldRestore) {
              restore()
            }
            this.pollPromise = undefined

            if (!isPoeItem(textAfter)) {
              this.logger.write('warn [ClipboardPoller] No item text found.')
            }
            reject(new Error('Reading clipboard timed out'))
          }
        }
      }
      setTimeout(poll, POLL_DELAY)
    })

    return this.pollPromise
  }

  // when `shouldRestore` is false, this function continues
  // to work as a throttler for callback
  restoreShortly (cb: (clipboard: Clipboard) => void) {
    // Not only do we not overwrite the clipboard, but we don't exec callback.
    // This throttling helps against disconnects from "Too many actions".
    if (!this.isRestored) {
      return
    }

    this.isRestored = false
    const saved = clipboard.readText()
    const savedImage = this.shouldRestore && !saved ? keepImage() : null
    cb(clipboard)
    setTimeout(() => {
      if (this.shouldRestore) {
        if (savedImage) clipboard.writeImage(savedImage)
        else clipboard.writeText(saved)
      }
      this.isRestored = true
    }, RESTORE_AFTER)
  }
}

// woke: a screenshot on the clipboard used to be lost, as only text was kept.
function keepImage (): NativeImage | null {
  // Reading an image is slow; asking what's there isn't.
  if (!clipboard.availableFormats().some(f => f.startsWith('image/'))) return null
  const image = clipboard.readImage()
  return image.isEmpty() ? null : image
}

function isPoeItem (text: string) {
  return LANGUAGE_DETECTOR.find(({ firstLine }) => text.startsWith(firstLine))
}

const LANGUAGE_DETECTOR = [{
  lang: 'en',
  firstLine: 'Item Class: '
}, {
  lang: 'ru',
  firstLine: 'Класс предмета: '
}, {
  lang: 'fr',
  firstLine: 'Classe d\'objet: '
}, {
  lang: 'de',
  firstLine: 'Gegenstandsklasse: '
}, {
  lang: 'pt',
  firstLine: 'Classe do Item: '
}, {
  lang: 'es',
  firstLine: 'Clase de objeto: '
}, {
  lang: 'th',
  firstLine: 'ชนิดไอเทม: '
}, {
  lang: 'ko',
  firstLine: '아이템 종류: '
}, {
  lang: 'cmn-Hant',
  firstLine: '物品種類: '
}, {
  lang: 'cmn-Hans',
  firstLine: '物品类别: '
}]
