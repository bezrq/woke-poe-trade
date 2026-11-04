<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex min-h-0 gap-x-1 text-gray-100">
      <div class="flex flex-col min-h-0" style="width: 16rem; max-height: 75vh;">
        <div class="p-1 truncate">{{ config.wmTitle || 'Atlas strategies' }}</div>
        <input v-model="filter" placeholder="Filter strategies…" class="bg-gray-900 rounded px-1 mx-1 mb-1 leading-6" />
        <div class="overflow-y-auto min-h-0 px-1 flex flex-col gap-y-1">
          <button v-for="s in shown" :key="s.id" @click="config.selectedId = s.id"
            :class="[$style.entryBtn, { [$style.selected]: config.selectedId === s.id }]">
            <span class="truncate">{{ s.name || 'Untitled' }}</span>
            <span class="text-xs text-gray-400 truncate">{{ [s.league, ...s.tags].filter(Boolean).join(' · ') }}</span>
          </button>
          <div v-if="!config.strategies.length" class="text-gray-500 p-2 text-center">
            No strategies yet. Add or import them in this widget's settings.
          </div>
        </div>
      </div>

      <div v-if="selected" class="flex flex-col min-h-0 border-l border-gray-700 pl-2" style="width: 26rem; max-height: 75vh;">
        <div class="font-semibold pb-1 truncate">{{ selected.name || 'Untitled' }}</div>
        <div class="flex flex-wrap gap-1 pb-2">
          <a v-if="treeLink" :href="treeLink" target="_blank" class="btn">Open atlas tree</a>
          <button v-if="selected.regex" class="btn" @click="copy(selected.regex)">{{ copied ? 'Copied' : 'Copy map regex' }}</button>
          <button v-if="selected.regex" class="btn" @click="pasteSearch(selected.regex)" title="Types it into the in-game search box">Search with regex</button>
        </div>
        <div class="overflow-y-auto min-h-0 text-sm flex flex-col gap-2">
          <div v-if="selected.scarabs.trim()">
            <div :class="$style.heading">Scarabs</div>
            <div class="whitespace-pre-wrap">{{ selected.scarabs }}</div>
          </div>
          <div v-if="selected.device.trim()">
            <div :class="$style.heading">Map device and crafting</div>
            <div class="whitespace-pre-wrap">{{ selected.device }}</div>
          </div>
          <div v-if="selected.notes.trim()">
            <div :class="$style.heading">Notes</div>
            <div class="whitespace-pre-wrap text-gray-300">{{ selected.notes }}</div>
          </div>

          <div>
            <div :class="$style.heading">What to allocate</div>
            <div v-if="!selected.treeUrl" class="text-gray-500">Add an atlas tree link in settings to see the allocation.</div>
            <div v-else-if="decodeError" class="text-red-400">{{ decodeError }}</div>
            <div v-else-if="atlasDataError && !atlasData" class="text-red-400">{{ atlasDataError }}</div>
            <div v-else-if="!atlasData" class="text-gray-500">Loading atlas tree data…</div>
            <template v-else-if="view">
              <div class="text-gray-400 pb-1">
                {{ view.total }} points · {{ notableCount }} notables and keystones · {{ view.small }} small
                <span v-if="view.unknown"> · {{ view.unknown }} not in the tree data (outdated link or data)</span>
              </div>
              <div v-for="g in view.groups" :key="g.mechanic" class="pb-1">
                <div class="text-yellow-400 text-xs">{{ g.mechanic }} ({{ g.nodes.length }})</div>
                <div class="pl-2">
                  <span v-for="(n, i) in g.nodes" :key="n.id" :title="n.stats.join('\n')"
                    :class="n.kind === 'keystone' ? 'font-semibold' : ''">{{ n.name }}<span v-if="i < g.nodes.length - 1">, </span></span>
                </div>
              </div>
            </template>
          </div>

          <div v-if="otherStrategies.length && view">
            <div :class="$style.heading">Compare with</div>
            <select v-model="compareId" class="bg-gray-900 rounded px-1 leading-6 mb-1">
              <option :value="null">Choose a strategy…</option>
              <option v-for="s in otherStrategies" :key="s.id" :value="s.id">{{ s.name || 'Untitled' }}</option>
            </select>
            <div v-if="compareError" class="text-red-400">{{ compareError }}</div>
            <template v-else-if="diff">
              <div v-if="diff.added.length"><span class="text-green-400">Also allocate:</span> {{ diff.added.join(', ') }}</div>
              <div v-if="diff.removed.length"><span class="text-red-400">Refund:</span> {{ diff.removed.join(', ') }}</div>
              <div v-if="!diff.added.length && !diff.removed.length" class="text-gray-500">Same notables.</div>
              <div class="text-gray-500 text-xs">Going from this strategy to the other; notables and keystones only.</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { ATLAS_TYPE } from './widget'
import type { AtlasWidget } from './widget'

export default {
  widget: {
    type: ATLAS_TYPE,
    instances: 'multi',
    trNameKey: 'Atlas strategies'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { strategyMatches, useAtlasData } from './widget'
import { decodeTree, diffTrees, extractTreeCode, overview } from './tree'
import type { DecodedTree } from './tree'

const props = defineProps<{
  config: AtlasWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Atlas strategies'
  props.config.anchor = { pos: 'tl', x: 20, y: 15 }
  props.config.dataUrl = ''
  props.config.selectedId = null
  props.config.strategies = []
  wm.show(props.config.wmId)
}

const { atlasData, atlasDataError } = useAtlasData(props.config.dataUrl)

const filter = shallowRef('')
const compareId = shallowRef<number | null>(null)
const copied = shallowRef(false)

const shown = computed(() => props.config.strategies.filter(s => strategyMatches(s, filter.value)))
const selected = computed(() => props.config.strategies.find(s => s.id === props.config.selectedId) ?? null)
const otherStrategies = computed(() => props.config.strategies.filter(s => s.id !== props.config.selectedId && s.treeUrl))

function tryDecode (url: string): { tree: DecodedTree | null, error: string } {
  try {
    return { tree: decodeTree(url), error: '' }
  } catch (err) {
    return { tree: null, error: (err as Error).message }
  }
}

const decoded = computed(() => selected.value?.treeUrl ? tryDecode(selected.value.treeUrl) : null)
const decodeError = computed(() => decoded.value?.error ?? '')
const view = computed(() => (decoded.value?.tree && atlasData.value) ? overview(decoded.value.tree, atlasData.value) : null)
const notableCount = computed(() => view.value?.groups.reduce((n, g) => n + g.nodes.length, 0) ?? 0)

// Only pathofexile.com links are opened as-is; a bare code gets turned into one.
const treeLink = computed(() => {
  const url = selected.value?.treeUrl.trim()
  if (!url) return undefined
  if (/^https:\/\/(www\.)?pathofexile\.com\//i.test(url)) return url
  const code = extractTreeCode(url)
  return (code && !/^https?:/i.test(url)) ? `https://www.pathofexile.com/fullscreen-atlas-skill-tree/${code}` : undefined
})

const compare = computed(() => {
  const other = props.config.strategies.find(s => s.id === compareId.value)
  return other ? tryDecode(other.treeUrl) : null
})
const compareError = computed(() => compare.value?.error ?? '')
const diff = computed(() => {
  const a = decoded.value?.tree
  const b = compare.value?.tree
  const data = atlasData.value
  if (!a || !b || !data) return null
  const d = diffTrees(a, b)
  const names = (ids: number[]) => ids
    .map(id => data.get(id))
    .filter(n => n && (n.kind === 'notable' || n.kind === 'keystone'))
    .map(n => n!.name)
    .sort()
  return { added: names(d.added), removed: names(d.removed) }
})

async function copy (text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1200)
  } catch {}
}

function pasteSearch (text: string) {
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}
</script>

<style lang="postcss" module>
.entryBtn {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-shrink: 0;
  @apply rounded px-2 py-1 leading-5;
  @apply text-gray-100 bg-gray-800;
  text-align: left;

  &:hover {
    @apply bg-gray-700;
  }
}

.selected {
  @apply bg-gray-600;
}

.heading {
  @apply text-gray-500 text-xs uppercase pb-0.5;
}
</style>
