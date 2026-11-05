// APT's map check settings, kept in the item-check widget's config so Map mods
// can bring them over (woke/map-mods/apt-import.ts).
export interface MapCheckConfig {
  profile: number
  showNewStats: boolean
  selectedStats: MapCheckStat[]
}

export interface MapCheckStat {
  matcher: string
  decision: string
}
