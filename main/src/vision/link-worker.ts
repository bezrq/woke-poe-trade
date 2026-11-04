import { parentPort } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'
import * as Bindings from './wasm-bindings'
import { HeistGemFinder } from './HeistGemFinder'
import { ImageData } from './utils'
import { scanTooltip } from '../woke/map-scan-vision'
import type { ScanOptions } from '../woke/map-scan-vision'
import { scanEssenceLabel, scanAllEssenceLabels } from '../woke/essence-scan-vision'

let _heistGems: HeistGemFinder
let _changeLangPromise = Promise.resolve()

const WorkerBody = {
  async init (binDir: string) {
    await Bindings.init(binDir)
    _heistGems = await HeistGemFinder.create(binDir)
  },
  async changeLanguage (lang: string, binDir: string) {
    await _changeLangPromise
    _changeLangPromise = Bindings.changeLanguage(lang, binDir)
    await _changeLangPromise
  },
  async findHeistGems (screenshot: ImageData) {
    await _changeLangPromise
    return _heistGems.ocrScreenshot(screenshot)
  },
  // woke map scan mode
  async scanMapTooltip (screenshot: ImageData, opts: ScanOptions) {
    await _changeLangPromise
    return scanTooltip(screenshot, opts)
  },
  // woke essence scan mode
  async scanEssenceLabel (screenshot: ImageData, opts: ScanOptions) {
    await _changeLangPromise
    return scanEssenceLabel(screenshot, opts)
  },
  // woke essence scan: one pass over the whole screen
  async scanAllEssenceLabels (screenshot: ImageData) {
    await _changeLangPromise
    return scanAllEssenceLabels(screenshot)
  }
}
Comlink.expose(WorkerBody, nodeEndpoint(parentPort!))

export type WorkerAPI = Comlink.Remote<typeof WorkerBody>
