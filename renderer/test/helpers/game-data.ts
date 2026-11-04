// Loads APT's item + stat data once per test file, the way the app does at
// startup, so tests can parse real clipboard text.
import fs from 'fs'
import path from 'path'
import * as Data from '@/assets/data'
import { parseClipboard } from '@/parser'
import type { ParsedItem } from '@/parser'

let loading: Promise<void> | null = null

export function loadGameData (): Promise<void> {
  if (!loading) loading = Data.init('en')
  return loading
}

export const FIXTURES = path.resolve(__dirname, '../../../testing/fixtures')

export function fixture (rel: string): string {
  return fs.readFileSync(path.join(FIXTURES, rel), 'utf-8').replace(/\r\n/g, '\n')
}

export function fixtureFiles (dir: string, ext: string): string[] {
  return fs.readdirSync(path.join(FIXTURES, dir)).filter(f => f.endsWith(ext)).sort()
}

// Parses a clipboard fixture (Ctrl+C on an item in game), failing loudly.
export function parseItem (text: string): ParsedItem {
  const res = parseClipboard(text)
  if (res.isErr()) throw new Error(`Parser error: ${res.error}`)
  return res.value
}
