<template>
  <WPanel :title="config.wmTitle || 'Map mods'" width="44rem" max-height="85vh">
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
      <div v-if="regex.tooLong" class="w-down text-xs w-full">Too long for the game's search box. Remove some mods or minimums.</div>
      <div v-if="regex.missing.length" class="w-warn text-xs w-full">No unique text found for: {{ regex.missing.join(', ') }}</div>
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
      <span class="flex-1 min-w-0" :class="{ 'w-dim': !profile.ratings[m] }">{{ m }}</span>
      <WSegmented :model-value="profile.ratings[m] ?? 'ok'" :options="RATING_OPTIONS"
        @update:model-value="setRating(m, $event as ModRating)" />
    </div>
    <WEmpty v-if="!visible.length" icon="fas fa-search">No mods match.</WEmpty>
    <div v-if="hiddenCount" class="w-dim text-xs p-2 text-center">{{ hiddenCount }} more. Search to narrow the list.</div>
    <template #footer>
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
import { WPanel, WButton, WField, WSegmented, WSelect, WTabs, WEmpty } from '../ui'
import { PRESETS, applyPreset, nextPresetRating, presetRating, withRating } from './rules'
import type { MapModPreset, ModRating } from './rules'
import { MAX_SEARCH_LENGTH, MIN_LABELS } from './regex'
import type { MinStat } from './regex'
import { allAreaMods, profileRegex } from './data'
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
  { value: 'reward', label: 'Reward' }
])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const ratings = profile.value.ratings
  return allMods.value.filter(m => {
    if (q && !m.toLowerCase().includes(q)) return false
    if (filter.value === 'picked') return ratings[m] != null
    if (filter.value === 'danger') return isDanger(m)
    if (filter.value === 'reward') return !isDanger(m)
    return true
  })
})
const visible = computed(() => filtered.value.slice(0, MAX_ROWS))
const hiddenCount = computed(() => Math.max(0, filtered.value.length - MAX_ROWS))

const regex = computed(() => profileRegex(profile.value))

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
  border-radius: var(--w-radius-sm);
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
}
.regex {
  flex: 1;
  min-width: 0;
  font-family: var(--w-num);
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.preset {
  font-size: 11.5px;
  padding: 1px 8px;
  border-radius: 999px;
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
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px var(--w-pad);
  font-size: 12.5px;
}
.row:nth-child(odd) { background: var(--w-panel-2); }
.mins {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px 10px;
  width: 100%;
  padding: 4px 0;
}
</style>
