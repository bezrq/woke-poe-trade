// Where the OCR data (opencv + tesseract) lives. Files the player put in the
// config folder win (other languages, newer data); otherwise the copy that
// ships with the installer is used.
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export const USER_OCR_DIR = () => path.join(app.getPath('userData'), 'apt-data/cv-ocr')

export function ocrDir (): string {
  const user = USER_OCR_DIR()
  if (fs.existsSync(path.join(user, 'opencv.js'))) return user
  const bundled = app.isPackaged ? path.join(process.resourcesPath, 'cv-ocr') : path.join(__dirname, '../build/cv-ocr')
  if (fs.existsSync(path.join(bundled, 'opencv.js'))) return bundled
  return user
}
