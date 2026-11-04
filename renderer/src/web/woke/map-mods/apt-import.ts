// Map mods replaced APT's own map check (Settings → Item info → maps). The
// first time Map mods sets up, it brings over the mods rated there, so
// nothing marked deadly in APT's list is lost. Pure logic, no Vue.
import type { MapCheckConfig } from '@/web/map-check/common'
import { defaultProfile } from './rules'
import type { MapModProfile, ModRating } from './rules'

const APT_PROFILES = 3
const DECISION: Record<string, ModRating | undefined> = { d: 'deadly', w: 'warn', g: 'good' }

// Adds APT's ratings to `profiles` (in place). APT profile N fills our profile
// with id N, made when missing; a mod already rated here keeps its rating.
// Returns how many ratings were added.
export function importAptMapRatings (profiles: MapModProfile[], apt: MapCheckConfig | undefined): number {
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
      profile = { ...defaultProfile(), id: n, name: `Profile ${n}`, ratings: {} }
      profiles.push(profile)
    }
    const ratings = { ...profile.ratings }
    for (const [matcher, r] of rated) {
      if (ratings[matcher]) continue
      ratings[matcher] = r
      added++
    }
    profile.ratings = ratings
  }
  profiles.sort((a, b) => a.id - b.id)
  return added
}
