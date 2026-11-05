// Lookup tables for item and stat data the app downloaded. Bundled data gets the
// same tables as files at build time, from make-index-files.mjs; a test checks
// that the two agree.
import fnv1a from '@sindresorhus/fnv1a'
import type { BaseType, StatOrGroup } from './interfaces'

const hash = (text: string) => Number(fnv1a(text, { size: 32 }))

function toIndex (rows: Array<{ hash: number, start: number }>): Uint32Array {
  const sorted = [...rows].sort((a, b) => a.hash - b.hash)
  const index = new Uint32Array(sorted.length * 2)
  sorted.forEach((row, i) => {
    index[i * 2] = row.hash
    index[i * 2 + 1] = row.start
  })
  return index
}

function forEachLine<T> (ndjson: string, visit: (record: T, start: number) => void) {
  let start = 0
  while (start !== ndjson.length) {
    const end = ndjson.indexOf('\n', start)
    if (end === -1) throw new Error('The data does not end with a new line')
    visit(JSON.parse(ndjson.slice(start, end)) as T, start)
    start = end + 1
  }
}

export function buildItemIndexes (ndjson: string) {
  const byKey = new Map<string, { name: number, ref: number, start: number }>()
  forEachLine<BaseType>(ndjson, (item, start) => {
    const key = `${item.namespace}::${item.refName}`
    if (byKey.has(key)) return
    byKey.set(key, { name: hash(`${item.namespace}::${item.name}`), ref: hash(key), start })
  })
  const rows = [...byKey.values()]
  return {
    names: toIndex(rows.map(r => ({ hash: r.name, start: r.start }))),
    refNames: toIndex(rows.map(r => ({ hash: r.ref, start: r.start })))
  }
}

export function buildStatIndexes (ndjson: string) {
  const refs: Array<{ hash: number, start: number }> = []
  const matchers: Array<{ hash: number, start: number }> = []
  forEachLine<StatOrGroup>(ndjson, (statOrGroup, start) => {
    const stats = ('stats' in statOrGroup) ? statOrGroup.stats : [statOrGroup]
    for (const stat of stats) {
      refs.push({ hash: hash(stat.ref), start })
      for (const matcher of stat.matchers) {
        matchers.push({ hash: hash(matcher.advanced ? matcher.advanced : matcher.string), start })
      }
    }
  })
  return { refs: toIndex(refs), matchers: toIndex(matchers) }
}
