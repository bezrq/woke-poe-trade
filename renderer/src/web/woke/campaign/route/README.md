# Bundled levelling route

`act-1.txt` … `act-10.txt` and the area/quest names in `data.json` come from
[exile-leveling](https://github.com/HeartofPhos/exile-leveling) by HeartofPhos
(MIT, see `LICENSE-exile-leveling.txt`), commit `b7b2dd0`.

- Route files are copied unchanged from `common/data/routes/`.
- `data.json` is a trimmed copy of `common/data/json/areas.json`
  (`[name, act, level, isTown, hasWaypoint, parentTownId, craftingRecipes]` per area id),
  quest names from `quests.json`, and `kill-waypoints.json`.

To update, copy the new route files over these and rebuild `data.json` with:

```sh
jq -c --slurpfile q quests.json --slurpfile k kill-waypoints.json '{
  areas: (to_entries | map({key, value: [.value.name, .value.act, .value.level, .value.is_town_area, .value.has_waypoint, (.value.parent_town_area_id // null), .value.crafting_recipes]}) | from_entries),
  quests: ($q[0] | to_entries | map({key, value: .value.name}) | from_entries),
  killWaypoints: $k[0]
}' areas.json > data.json
```

The parser in `../route.ts` is our own, written for the overlay. It reads the same
syntax: `#section`, `#sub`, `#ifdef`/`#ifndef`/`#endif`, and `{fragment|args}`.
