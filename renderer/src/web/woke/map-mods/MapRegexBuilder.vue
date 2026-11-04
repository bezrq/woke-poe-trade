<template>
  <WPanel :title="config.wmTitle || 'Map mods'" icon="map" width="44rem" max-height="85vh">
    <template #actions>
      <WSelect :model-value="String(config.activeProfile)" :options="profileOptions"
        @update:model-value="config.activeProfile = Number($event)" title="Build profile" />
      <WSegmented :model-value="profile.highlight" :options="HIGHLIGHT_OPTIONS"
        @update:model-value="profile.highlight = $event as 'good' | 'bad'" />
      <slot name="actions" />
    </template>
    <template #toolbar>
      <div :class="$style.regexBar">
        <code :class="$style.regex" :title="regex.text">{{ regex.text || 'Pick mods or minimums below' }}</code>
        <span class="w-num text-xs" :class="regex.tooLong ? 'w-down' : 'w-up'">{{ regex.length }}/{{ MAX_SEARCH_LENGTH }}</span>
        <WButton size="sm" variant="primary" :icon="copied ? 'fas fa-check' : 'far fa-copy'" :disabled="!regex.text" @click="copy">Copy</WButton>
        <WButton size="sm" icon="fas fa-search" :disabled="!regex.text" @click="paste" title="Type it into the open stash's search box">Stash</WButton>
      </div>
      <div class="flex items-center gap-2 w-full text-xs">
        <WChip clickable :active="!!profile.autoTrim" @click="profile.autoTrim = !profile.autoTrim"
          title="When the search is too long, leave out wanted mods first, then avoided mods that aren't in a Quick preset, longest first">
          <i class="fas fa-cut" /> Auto-trim to fit
        </WChip>
        <span v-if="regex.tooLong" class="w-down">
          Too long by {{ regex.length - MAX_SEARCH_LENGTH }}. Biggest: {{ costliest }}
        </span>
        <span v-else-if="regex.dropped.length" class="w-warn" :title="regex.dropped.join('\n')">
          Left out {{ regex.dropped.length }} to fit: {{ regex.dropped.slice(0, 3).join(', ') }}{{ regex.dropped.length > 3 ? '…' : '' }}
        </span>
      </div>
      <div v-if="regex.missing.length" class="w-warn text-xs w-full">No unique text found for: {{ regex.missing.join(', ') }}</div>
      <div v-if="pickGroups.length || minChips.length" :class="$style.picks">
        <div v-for="g in pickGroups" :key="g.rating" :class="$style.pickRow">
          <span :class="[$style.pickHead, $style[g.rating]]">{{ g.label }}</span>
          <span v-for="c in g.chips" :key="c.matcher" :class="[$style.chip, $style[g.rating]]">
            <button type="button" :class="$style.chipText" :title="`Show “${c.matcher}” in the list`" @click="jumpTo(c.matcher)">{{ c.label }}</button>
            <button type="button" :class="$style.chipX" :aria-label="`Remove ${c.label}`" title="Remove" @click="setRating(c.matcher, 'ok')">×</button>
          </span>
        </div>
        <div v-if="minChips.length" :class="$style.pickRow">
          <span :class="$style.pickHead">Min</span>
          <span v-for="c in minChips" :key="c.key" :class="[$style.chip, $style.min]">
            <span :class="$style.chipText">{{ c.label }}</span>
            <button type="button" :class="$style.chipX" :aria-label="`Remove minimum ${c.label}`" title="Remove" @click="setMin(c.key, 0)">×</button>
          </span>
        </div>
      </div>
      <div class="flex flex-wrap gap-1 w-full">
        <span class="w-dim text-xs self-center mr-1">Quick:</span>
        <button v-for="p in presets" :key="p.preset.id" type="button"
          :class="[$style.preset, $style[p.rating]]" @click="cyclePreset(p.preset, p.rating)"
          :title="'Click: careful → can\'t run → off'">{{ p.preset.label }}</button>
      </div>
      <div class="flex items-center gap-2 w-full">
        <WField v-model="search" type="search" icon="fas fa-search" :placeholder="`Search ${allMods.length} map mods`" class="flex-1" />
        <WTabs v-model="filter" :options="filterOptions" />
      </div>
    </template>
    <div v-for="m in visible" :key="m" :class="$style.row">
      <span class="flex-1 min-w-0" :class="{ 'w-dim': !profile.ratings[m] }">
        {{ m }}<span v-if="t17.has(m)" :class="$style.t17">T17</span>
      </span>
      <span v-if="regex.tokens[m]" :class="$style.cost"
        :title="`Shortened to &quot;${regex.tokens[m]}&quot;, costs ${tokenCost(regex.tokens[m])} characters`">
        <code>{{ regex.tokens[m] }}</code> {{ tokenCost(regex.tokens[m]) }}
      </span>
      <span v-else-if="regex.dropped.includes(m)" class="w-warn text-xs" title="Left out by auto-trim">trimmed</span>
      <WSegmented :model-value="profile.ratings[m] ?? 'ok'" :options="RATING_OPTIONS"
        @update:model-value="setRating(m, $event as ModRating)" />
    </div>
    <WEmpty v-if="!visible.length" icon="fas fa-search">No mods match.</WEmpty>
    <div v-if="hiddenCount" class="w-dim text-xs p-2 text-center">{{ hiddenCount }} more. Search to narrow the list.</div>
    <template #footer>
      <div class="flex items-center gap-2 text-xs w-full">
        <span class="w-dim">A map needs</span>
        <WSegmented :model-value="profile.minsAny ? 'any' : 'all'" :options="MINS_MODE_OPTIONS"
          @update:model-value="profile.minsAny = $event === 'any'" />
        <span class="w-dim">of these minimums</span>
      </div>
      <div :class="$style.mins">
        <label v-for="key in MIN_KEYS" :key="key" class="flex flex-col gap-1">
          <span class="w-dim">Min {{ MIN_LABELS[key].toLowerCase() }}</span>
          <WField type="number" :model-value="profile.mins[key] ?? ''" placeholder="any" suffix="%"
            @update:model-value="setMin(key, $event)" />
        </label>
      </div>
    </template>
  </WPanel>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { pushHostConfig } from '@/web/Config'
import { WPanel, WButton, WChip, WField, WSegmented, WSelect, WTabs, WEmpty } from '../ui'
import { PRESETS, applyPreset, nextPresetRating, presetRating, shortLabel, withRating } from './rules'
import type { MapModPreset, ModRating } from './rules'
import { MAX_SEARCH_LENGTH, MIN_LABELS, tokenCost } from './regex'
import type { MinStat } from './regex'
import { allAreaMods, profileRegex, tier17Mods } from './data'
import { activeProfile } from './widget'
import type { MapModsWidget } from './widget'

const props = defineProps<{ config: MapModsWidget }>()

const RATING_OPTIONS = [
  { value: 'deadly', label: 'avoid' },
  { value: 'warn', label: 'careful' },
  { value: 'ok', label: '–' },
  { value: 'good', label: 'want' }
]
const HIGHLIGHT_OPTIONS = [
  { value: 'good', label: 'Highlight good' },
  { value: 'bad', label: 'Highlight bad' }
]
const MINS_MODE_OPTIONS = [
  { value: 'all', label: 'all' },
  { value: 'any', label: 'any one' }
]
const MIN_KEYS: MinStat[] = ['quantity', 'rarity', 'packSize', 'quality', 'currency', 'scarabs', 'maps', 'divCards']
const MAX_ROWS = 200

const profile = computed(() => activeProfile(props.config))
const profileOptions = computed(() => props.config.profiles.map(p => ({ value: String(p.id), label: p.name || 'Unnamed' })))
const presets = computed(() => PRESETS.map(preset => ({ preset, rating: presetRating(profile.value, preset) })))

const search = shallowRef('')
const filter = shallowRef('all')

// Mods the player hurts themselves with vs. mods that add monsters/rewards.
function isDanger (m: string) {
  return /^(Monsters|Players|Rare Monsters|Unique Boss|Monster |Buffs on Players|Auras)/.test(m) &&
    !/(more Quantity|Pack size|Rarity of Items)/i.test(m)
}

const allMods = computed(() => {
  // Rated mods missing from today's stat data (renamed by a patch) stay visible.
  return [...new Set([...allAreaMods(), ...Object.keys(profile.value.ratings)])]
})

const filterOptions = computed(() => [
  { value: 'all', label: 'All' },
  { value: 'picked', label: 'Picked', count: Object.keys(profile.value.ratings).length },
  { value: 'danger', label: 'Danger' },
  { value: 'reward', label: 'Reward' },
  { value: 't17', label: 'T17' }
])

const t17 = computed(() => tier17Mods())

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const ratings = profile.value.ratings
  return allMods.value.filter(m => {
    if (q && !m.toLowerCase().includes(q)) return false
    if (filter.value === 'picked') return ratings[m] != null
    if (filter.value === 'danger') return isDanger(m)
    if (filter.value === 'reward') return !isDanger(m)
    if (filter.value === 't17') return t17.value.has(m)
    return true
  })
})
const visible = computed(() => filtered.value.slice(0, MAX_ROWS))
const hiddenCount = computed(() => Math.max(0, filtered.value.length - MAX_ROWS))

const regex = computed(() => profileRegex(profile.value))

// Everything picked, at a glance above the list.
const PICK_GROUPS: Array<{ rating: ModRating, label: string }> = [
  { rating: 'deadly', label: 'Avoid' },
  { rating: 'warn', label: 'Careful' },
  { rating: 'good', label: 'Want' }
]
const MIN_SHORT: Record<MinStat, string> = {
  quantity: 'quant',
  rarity: 'rarity',
  packSize: 'pack',
  quality: 'quality',
  currency: 'currency',
  scarabs: 'scarabs',
  maps: 'maps',
  divCards: 'div cards'
}
const pickGroups = computed(() => {
  const ratings = profile.value.ratings
  return PICK_GROUPS.map(g => ({
    ...g,
    chips: Object.keys(ratings)
      .filter(m => ratings[m] === g.rating)
      .map(m => ({ matcher: m, label: shortLabel(m) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })).filter(g => g.chips.length)
})
const minChips = computed(() => MIN_KEYS
  .filter(key => (profile.value.mins[key] ?? 0) > 0)
  .map(key => ({ key, label: `${MIN_SHORT[key]} ${profile.value.mins[key]!}%` })))

function jumpTo (matcher: string) {
  filter.value = 'all'
  search.value = matcher
}

// The three picked mods that cost the most characters.
const costliest = computed(() => Object.entries(regex.value.tokens)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 3)
  .map(([m, t]) => `${m.replace(/#/g, 'N')} (${tokenCost(t)})`)
  .join(', '))

// Keep the stored text in sync so the paste hotkey uses the latest regex.
let pushTimer: ReturnType<typeof setTimeout> | undefined
watch(() => regex.value.text, (text) => {
  if (props.config.regexText === text) return
  props.config.regexText = text
  if (!props.config.regexHotkey) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => { pushHostConfig() }, 600)
}, { immediate: true })

function setRating (matcher: string, rating: ModRating) {
  profile.value.ratings = withRating(profile.value.ratings, [matcher], rating)
}

function cyclePreset (preset: MapModPreset, current: ModRating) {
  applyPreset(profile.value, preset, nextPresetRating(current))
}

function setMin (key: MinStat, value: string | number) {
  const n = Number(value)
  profile.value.mins = { ...profile.value.mins, [key]: n > 0 ? Math.min(999, Math.floor(n)) : undefined }
}

const copied = shallowRef(false)
async function copy () {
  try {
    await navigator.clipboard.writeText(regex.value.text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1200)
  } catch {}
}

function paste () {
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text: regex.value.text }
  })
}
</script>

<style module>
.regexBar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--w-r-sm);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
}
.regex {
  flex: 1;
  min-width: 0;
  font-family: var(--w-mono);
  font-size: var(--w-fs-md);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.preset {
  font-size: var(--w-fs-sm);
  padding: 1px 8px;
  border-radius: var(--w-r-pill);
  border: 1px solid var(--w-line);
  background: var(--w-panel-2);
  color: var(--w-dim);
}
.preset:hover { color: var(--w-fg); }
.preset.warn {
  color: var(--w-warn);
  border-color: color-mix(in srgb, var(--w-warn) 45%, transparent);
  background: color-mix(in srgb, var(--w-warn) 12%, transparent);
}
.preset.deadly {
  color: var(--w-down);
  border-color: color-mix(in srgb, var(--w-down) 50%, transparent);
  background: color-mix(in srgb, var(--w-down) 14%, transparent);
}
.picks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-height: 9.5rem;
  overflow-y: auto;
  padding: 6px 8px;
  border-radius: var(--w-r-sm);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
}
.pickRow { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.pickHead { width: 52px; flex: none; font-size: var(--w-fs-xs); color: var(--w-accent); }
.pickHead.deadly { color: var(--w-down); }
.pickHead.warn { color: var(--w-warn); }
.pickHead.good { color: var(--w-up); }
.chip {
  display: inline-flex;
  align-items: center;
  font-size: var(--w-fs-sm);
  border-radius: var(--w-r-pill);
  border: 1px solid color-mix(in srgb, var(--chip) 48%, transparent);
  background: color-mix(in srgb, var(--chip) 13%, transparent);
  color: var(--chip);
  --chip: var(--w-accent);
}
.chip.deadly { --chip: var(--w-down); }
.chip.warn { --chip: var(--w-warn); }
.chip.good { --chip: var(--w-up); }
.chip.min { font-family: var(--w-num); background: transparent; }
.chipText { padding: 1px 2px 1px 8px; color: inherit; background: none; border: 0; font: inherit; }
button.chipText:hover { text-decoration: underline; }
.chipX { padding: 0 6px 0 3px; color: inherit; background: none; border: 0; font: inherit; opacity: 0.7; }
.chipX:hover { opacity: 1; }
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px var(--w-pad);
  font-size: var(--w-fs-md);
  /* Up to 200 rows, ~30 on screen: the browser skips laying out and
     painting the rest until they scroll into view. */
  content-visibility: auto;
  contain-intrinsic-size: auto 30px;
}
.row:nth-child(odd) { background: var(--w-panel-2); }
.cost {
  font-size: var(--w-fs-xs);
  color: var(--w-dim);
  white-space: nowrap;
  font-family: var(--w-num);
}
.t17 {
  margin-left: 6px;
  font-size: var(--w-fs-xs);
  padding: 0 4px;
  border-radius: var(--w-r-sm);
  color: var(--w-warn);
  border: 1px solid color-mix(in srgb, var(--w-warn) 45%, transparent);
}
.mins {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px 10px;
  width: 100%;
  padding: 4px 0;
}
</style>
