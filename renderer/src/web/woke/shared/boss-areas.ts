// Pinnacle boss arenas by area id (the "Generating level N area" line), the
// ids Exile-UI's map tracker uses. Most are Map* ids, so without this list a
// boss fight counted as a map in a farming session. Kept apart from zone.ts
// so farming.ts can use it without the IPC import.
export const BOSS_AREAS: Record<string, string[]> = {
  mapworldsshapersrealm: ['shaper', 'uber-shaper'],
  mapworldselderarena: [],
  mapworldselderarenauber: ['uber-elder', 'uber-uber-elder'],
  mapworldsprimordialboss1: [],
  mapworldsprimordialboss2: [],
  mapworldsprimordialboss3: ['exarch', 'uber-exarch'],
  mapworldsprimordialboss4: ['eater', 'uber-eater'],
  mavenboss: ['maven', 'uber-maven'],
  mavenhub: ['feared'],
  atlasexilesboss5: ['uber-sirus'],
  synthesis_mapboss: ['uber-cortex']
}

export function bossAreaIds (areaId: string): string[] | undefined {
  return BOSS_AREAS[areaId.toLowerCase()]
}

export function isBossArea (areaId: string): boolean {
  return bossAreaIds(areaId) != null
}
