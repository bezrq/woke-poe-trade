import { Worker } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'
import type { WorkerAPI } from './link-worker'
import type { ImageData } from './utils'
import type { ScanOptions } from '../woke/map-scan-vision'
import { app } from 'electron'
import path from 'path'
import { perfTime } from '../woke/perf'

export class OcrWorker {
  private binDir = path.join(app.getPath('userData'), 'apt-data/cv-ocr')
  private api: Comlink.Remote<WorkerAPI>
  private lang = ''
  private worker: Worker
  // opencv + tesseract load in the background (about a second), so startup
  // doesn't wait for them; every call waits for this first.
  private ready: Promise<void> = Promise.resolve()

  private constructor () {
    this.worker = new Worker(__dirname + '/vision.js')
    this.api = Comlink.wrap<WorkerAPI>(nodeEndpoint(this.worker))
  }

  static async create () {
    const worker = new OcrWorker()
    worker.ready = perfTime('OCR worker load', worker.api.init(worker.binDir)).catch(() => {})
    return worker
  }

  // Frees the worker's memory (opencv + tesseract heaps); the object is unusable after.
  async terminate () {
    await this.worker.terminate()
  }

  async updateOptions (lang: string) {
    await this.ready
    try {
      if (lang !== this.lang) {
        await this.api.changeLanguage(lang, this.binDir)
      }
    } catch {} finally {
      this.lang = lang
    }
  }

  async findHeistGems (image: ImageData) {
    await this.ready
    const result = await this.api.findHeistGems(
      Comlink.transfer(image, [image.data.buffer]))
    return result
  }

  async scanMapTooltip (image: ImageData, opts: ScanOptions) {
    await this.ready
    return await this.api.scanMapTooltip(
      Comlink.transfer(image, [image.data.buffer]), opts)
  }

  async scanEssenceLabel (image: ImageData, opts: ScanOptions) {
    await this.ready
    return await this.api.scanEssenceLabel(
      Comlink.transfer(image, [image.data.buffer]), opts)
  }
}
