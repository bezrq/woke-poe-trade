// Parses the Client.txt lines that APT's GameLogWatcher already streams.
// English client lines only.

export type LogEvent =
  { kind: 'area', areaId: string, areaLevel: number } |
  { kind: 'zone', name: string } |
  { kind: 'level', charName: string, className: string, level: number }

const AREA_RE = /Generating level (\d+) area "([^"]+)"/
const ZONE_RE = /\] : You have entered (.+?)\.?$/
const LEVEL_RE = /\] : (\S+) \(([^)]+)\) is now level (\d+)\s*$/

export function parseLogLine (line: string): LogEvent | null {
  let m = AREA_RE.exec(line)
  if (m) return { kind: 'area', areaLevel: Number(m[1]), areaId: m[2] }
  m = ZONE_RE.exec(line)
  if (m) return { kind: 'zone', name: m[1] }
  m = LEVEL_RE.exec(line)
  if (m) return { kind: 'level', charName: m[1], className: m[2], level: Number(m[3]) }
  return null
}

// Campaign area ids look like "1_3_7" or "2_6_town": the second number is
// the act (1-10, 11 = epilogue). Maps, hideouts etc. return null.
export function actFromAreaId (areaId: string): number | null {
  const m = /^(\d+)_(\d+)_/.exec(areaId)
  if (!m) return null
  const act = Number(m[2])
  return act >= 1 && act <= 11 ? act : null
}

export function isTown (areaId: string): boolean {
  return /_town$/i.test(areaId)
}

// Picks the PoB tree spec meant for the current level, based on numbers in
// spec titles ("Level 30", "lvl 55", "40-60"). Uses the highest level that
// has been reached; falls back to the active spec.
export function pickTreeForLevel<T extends { title: string, isActive: boolean }> (trees: T[], level: number | null): T | null {
  if (!trees.length) return null
  if (level != null) {
    let best: { tree: T, at: number } | null = null
    for (const tree of trees) {
      const m = /(\d{1,3})/.exec(tree.title)
      if (!m) continue
      const at = Number(m[1])
      if (at <= level && at <= 100 && (!best || at > best.at)) best = { tree, at }
    }
    if (best) return best.tree
  }
  return trees.find(t => t.isActive) ?? trees[0]
}

export function actLabel (act: number | null): string {
  if (act == null) return ''
  return act === 11 ? 'Epilogue' : `Act ${act}`
}
