// Map mods replaced APT's own map check. It brings over the mods rated there,
// kept in the item-check widget's `maps` config, so nothing marked deadly is
// lost. Pure logic, no Vue.
import type { MapCheckConfig } from '@/web/map-check/common'
import { defaultProfile } from './rules'
import type { MapModProfile, ModRating } from './rules'

const APT_PROFILES = 3
const DECISION: Record<string, ModRating | undefined> = { d: 'deadly', w: 'warn', g: 'good' }

// Adds APT's ratings to `profiles` (in place). APT profile N fills our profile
// with id N, made when missing; a mod already rated here keeps its rating. Its
// list held every kind of mod: `heistRow` sends heist mods to their Heist tab row.
// Returns how many ratings were added.
export function importAptMapRatings (
  profiles: MapModProfile[],
  apt: MapCheckConfig | undefined,
  heistRow: (matcher: string) => string | undefined = () => undefined,
  makeProfiles = true
): number {
  if (!apt || !Array.isArray(apt.selectedStats)) return 0
  let added = 0
  for (let n = 1; n <= APT_PROFILES; n++) {
    const rated: Array<[string, ModRating]> = []
    for (const s of apt.selectedStats) {
      const r = DECISION[s.decision?.[n - 1] ?? '-']
      if (r && s.matcher) rated.push([s.matcher, r])
    }
    if (!rated.length) continue
    let profile = profiles.find(p => p.id === n)
    if (!profile) {
      if (!makeProfiles) continue
      profile = { ...defaultProfile(), id: n, name: `Profile ${n}`, ratings: {} }
      profiles.push(profile)
    }
    const ratings = { ...profile.ratings }
    const heistRatings = { ...profile.heistRatings }
    for (const [matcher, r] of rated) {
      const row = heistRow(matcher)
      const list = row ? heistRatings : ratings
      const key = row ?? matcher
      if (list[key]) continue
      list[key] = r
      added++
    }
    profile.ratings = ratings
    profile.heistRatings = heistRatings
  }
  profiles.sort((a, b) => a.id - b.id)
  return added
}

// The first import put heist marks with the map ratings: moves them to their own
// list, where one already there wins.
export function moveHeistRatings (profiles: MapModProfile[], heistRow: (matcher: string) => string | undefined) {
  for (const profile of profiles) {
    const moved = Object.entries(profile.ratings).filter(([m]) => heistRow(m))
    if (!moved.length) continue
    profile.heistRatings = { ...Object.fromEntries(moved.map(([m, r]) => [heistRow(m)!, r])), ...profile.heistRatings }
    profile.ratings = Object.fromEntries(Object.entries(profile.ratings).filter(([m]) => !heistRow(m)))
  }
}
