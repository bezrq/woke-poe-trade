import type { Widget } from '../overlay/widgets.js'
import type { MapCheckConfig } from '../map-check/common.js'
import type { Bookmark } from '../woke/item-lookup/lookup.js'

export interface ItemCheckWidget extends Widget {
  hotkey: string | null
  wikiKey: string | null
  poedbKey: string | null
  craftOfExileKey: string | null
  stashSearchKey: string | null
  bookmarksKey: string | null
  bookmarks: Bookmark[]
  maps: MapCheckConfig
}
