// Light, dependency-free reading of Path of Building build XML.
// PoB writes a predictable layout, so attribute regexes are enough for the
// summary we need; anything missing just comes back empty.

export interface PobSummary {
  className: string
  ascendClassName: string
  level: number | null
  mainSkill: string
}

export interface PobGem {
  name: string
  level: number | null
  quality: number | null
  enabled: boolean
}

export interface PobSkillGroup {
  label: string
  slot: string
  enabled: boolean
  isMain: boolean
  gems: PobGem[]
}

export interface PobTreeSpec {
  title: string
  url: string
  isActive: boolean
}

export interface PobDetails extends PobSummary {
  notes: string
  skills: PobSkillGroup[]
  trees: PobTreeSpec[]
}

function attrs (tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of tag.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)) {
    out[m[1]] = decodeEntities(m[2])
  }
  return out
}

export function decodeEntities (s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
}

function num (value: string | undefined): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function parseSkills (xml: string, mainSocketGroup: number | null): PobSkillGroup[] {
  const groups: PobSkillGroup[] = []
  // Skills may sit directly under <Skills> or inside <SkillSet> blocks;
  // with several skill sets, prefer the active one.
  const skillsBlock = /<Skills\b([^>]*)>([\s\S]*?)<\/Skills>/.exec(xml)
  if (!skillsBlock) return groups
  let body = skillsBlock[2]
  const activeSet = attrs(skillsBlock[1]).activeSkillSet
  if (activeSet) {
    const set = new RegExp(`<SkillSet\\b[^>]*\\bid="${activeSet}"[^>]*>([\\s\\S]*?)</SkillSet>`).exec(body)
    if (set) body = set[1]
  }
  for (const m of body.matchAll(/<Skill\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Skill>)/g)) {
    const a = attrs(m[1])
    const gems: PobGem[] = []
    for (const g of (m[2] ?? '').matchAll(/<Gem\b([^>]*?)\/?>/g)) {
      const ga = attrs(g[1])
      gems.push({
        name: ga.nameSpec || ga.skillId || '',
        level: num(ga.level),
        quality: num(ga.quality),
        enabled: ga.enabled !== 'false'
      })
    }
    groups.push({
      label: a.label ?? '',
      slot: a.slot ?? '',
      enabled: a.enabled !== 'false',
      isMain: mainSocketGroup != null && groups.length + 1 === mainSocketGroup,
      gems
    })
  }
  return groups
}

function parseTrees (xml: string): PobTreeSpec[] {
  const tree = /<Tree\b([^>]*)>([\s\S]*?)<\/Tree>/.exec(xml)
  if (!tree) return []
  const active = num(attrs(tree[1]).activeSpec)
  const out: PobTreeSpec[] = []
  let i = 0
  for (const m of tree[2].matchAll(/<Spec\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Spec>)/g)) {
    i++
    const a = attrs(m[1])
    const urlMatch = /<URL>\s*([\s\S]*?)\s*<\/URL>/.exec(m[2] ?? '')
    const url = urlMatch ? decodeEntities(urlMatch[1].trim()) : ''
    out.push({ title: a.title || `Tree ${i}`, url, isActive: active === i })
  }
  return out
}

function mainSkillName (skills: PobSkillGroup[]): string {
  const main = skills.find(s => s.isMain) ?? skills.find(s => s.enabled && s.gems.length)
  if (!main) return ''
  const gem = main.gems.find(g => g.enabled && !/support/i.test(g.name)) ?? main.gems[0]
  return gem?.name || main.label
}

export function parseBuild (xml: string): PobDetails {
  const buildTag = /<Build\b([^>]*)>/.exec(xml)
  const b = buildTag ? attrs(buildTag[1]) : {}
  const skills = parseSkills(xml, num(b.mainSocketGroup))
  const notesMatch = /<Notes>([\s\S]*?)<\/Notes>/.exec(xml)
  return {
    className: b.className ?? '',
    ascendClassName: (b.ascendClassName && b.ascendClassName !== 'None') ? b.ascendClassName : '',
    level: num(b.level),
    mainSkill: mainSkillName(skills),
    // PoB colour codes like ^7 or ^xFFFFFF are stripped.
    notes: notesMatch ? decodeEntities(notesMatch[1]).replace(/\^x[0-9a-fA-F]{6}|\^\d/g, '').trim() : '',
    skills,
    trees: parseTrees(xml)
  }
}

export function summarize (details: PobDetails): PobSummary {
  const { className, ascendClassName, level, mainSkill } = details
  return { className, ascendClassName, level, mainSkill }
}
