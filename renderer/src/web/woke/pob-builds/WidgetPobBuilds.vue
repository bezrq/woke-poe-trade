<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex min-h-0 gap-x-1 text-gray-100">
      <div class="flex flex-col min-h-0" style="width: 20rem; max-height: 70vh;">
        <div class="p-1 flex items-center gap-2">
          <span class="truncate grow">{{ config.wmTitle || 'PoB builds' }}</span>
          <button @click="refresh" :class="$style.iconBtn" title="Reload builds folder">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }" />
          </button>
        </div>
        <input v-model="filter" placeholder="Filter by name, class, skill, folder…"
          class="bg-gray-900 rounded px-1 mx-1 mb-1 leading-6" />
        <div v-if="error" class="text-red-400 text-sm px-2 pb-1">{{ error }}</div>
        <div class="overflow-y-auto min-h-0 px-1 flex flex-col gap-y-1">
          <div v-for="b in shown" :key="b.relPath" class="flex gap-x-1">
            <button @click="select(b)" :class="[$style.entryBtn, { [$style.selected]: selected === b.relPath }]"
              :title="b.relPath">
              <span class="flex items-center gap-1 min-w-0">
                <i v-if="config.activeBuild === b.relPath" class="fas fa-check-circle text-green-400" title="Active build" />
                <span class="truncate">{{ b.name }}</span>
              </span>
              <span class="text-xs text-gray-400 truncate">{{ describe(b) }}<template v-if="b.folder"> · {{ b.folder }}</template></span>
            </button>
            <button @click="togglePin(b.relPath)" :class="$style.iconBtn" :title="isPinned(b.relPath) ? 'Unpin' : 'Pin to top'">
              <i :class="isPinned(b.relPath) ? 'fas fa-thumbtack text-yellow-400' : 'fas fa-thumbtack'" />
            </button>
          </div>
          <div v-if="!loading && !shown.length && !error" class="text-gray-500 p-2 text-center">
            {{ builds.length ? 'No matches' : `No builds found in ${dir || 'the builds folder'}` }}
          </div>
        </div>
      </div>

      <div v-if="selectedBuild" class="flex flex-col min-h-0 border-l border-gray-700 pl-2" style="width: 22rem; max-height: 70vh;">
        <div class="flex items-center gap-1 pb-1">
          <span class="truncate grow font-semibold">{{ selectedBuild.name }}</span>
          <button @click="selected = null" :class="$style.iconBtn" title="Close"><i class="fas fa-times" /></button>
        </div>
        <div class="flex flex-wrap gap-1 pb-2">
          <button class="btn" @click="act(pobApi.open(config, selectedBuild.relPath))">Open in PoB</button>
          <button class="btn" @click="act(pobApi.show(config, selectedBuild.relPath))">Show file</button>
          <button class="btn" @click="setActive(selectedBuild.relPath)" :disabled="config.activeBuild === selectedBuild.relPath">
            {{ config.activeBuild === selectedBuild.relPath ? 'Active build' : 'Make active' }}
          </button>
        </div>
        <div class="overflow-y-auto min-h-0 text-sm">
          <div v-if="detailsError" class="text-red-400">{{ detailsError }}</div>
          <template v-else-if="details">
            <div class="text-gray-400 pb-2">{{ describe(details) }}</div>
            <div v-if="details.trees.length" class="pb-2">
              <div :class="$style.heading">Passive trees</div>
              <a v-for="t in details.trees" :key="t.title + t.url" :href="safeUrl(t.url)" target="_blank"
                class="block truncate hover:text-white" :class="t.isActive ? 'text-gray-100' : 'text-gray-400'">
                <i class="fas fa-external-link-alt text-xs" /> {{ t.title }}<span v-if="t.isActive" class="text-gray-500"> (active)</span>
              </a>
            </div>
            <div v-if="details.skills.length" class="pb-2">
              <div :class="$style.heading">Gem setups</div>
              <div v-for="(s, i) in details.skills" :key="i" class="pb-1" :class="{ 'opacity-50': !s.enabled }">
                <div class="text-gray-400 text-xs">
                  {{ s.label || s.slot || `Group ${i + 1}` }}<span v-if="s.isMain" class="text-yellow-400"> · main</span>
                </div>
                <div class="pl-2">
                  <span v-for="(g, j) in s.gems" :key="j" :class="{ 'line-through text-gray-500': !g.enabled }">
                    {{ g.name }}<span class="text-gray-500 text-xs" v-if="g.level != null"> {{ g.level }}/{{ g.quality ?? 0 }}</span><span v-if="j < s.gems.length - 1">, </span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="details.notes">
              <div :class="$style.heading">Notes</div>
              <div class="whitespace-pre-wrap text-gray-300">{{ details.notes }}</div>
            </div>
          </template>
          <div v-else class="text-gray-500">Loading…</div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { POB_BUILDS_TYPE } from './widget'
import type { PobBuildsWidget } from './widget'

export default {
  widget: {
    type: POB_BUILDS_TYPE,
    instances: 'multi',
    trNameKey: 'PoB builds'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { buildMatches, describe, pobApi, sortBuilds } from './widget'
import type { PobBuildEntry, PobDetails } from './widget'

const props = defineProps<{
  config: PobBuildsWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'PoB builds'
  props.config.anchor = { pos: 'tl', x: 25, y: 20 }
  props.config.buildsDir = ''
  props.config.pobExe = ''
  props.config.pinned = []
  props.config.activeBuild = null
  wm.show(props.config.wmId)
}

const builds = shallowRef<PobBuildEntry[]>([])
const dir = shallowRef('')
const loading = shallowRef(false)
const error = shallowRef('')
const filter = shallowRef('')
const selected = shallowRef<string | null>(null)
const details = shallowRef<PobDetails | null>(null)
const detailsError = shallowRef('')

const shown = computed(() => sortBuilds(builds.value, props.config.pinned)
  .filter(b => buildMatches(b, filter.value)))
const selectedBuild = computed(() => builds.value.find(b => b.relPath === selected.value) ?? null)

async function refresh () {
  loading.value = true
  error.value = ''
  try {
    const res = await pobApi.list(props.config)
    builds.value = res.builds
    dir.value = res.dir
  } catch (err) {
    builds.value = []
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

function select (b: PobBuildEntry) {
  selected.value = selected.value === b.relPath ? null : b.relPath
}

watch(selected, async (relPath) => {
  details.value = null
  detailsError.value = ''
  if (!relPath) return
  try {
    const d = await pobApi.read(props.config, relPath)
    if (selected.value === relPath) details.value = d
  } catch (err) {
    detailsError.value = (err as Error).message
  }
})

// Reload when the folder changes, and whenever the widget is shown, so
// builds saved in PoB meanwhile appear.
watch(() => props.config.buildsDir, refresh, { immediate: true })
watch(() => props.config.wmWants, (wants) => { if (wants === 'show') refresh() })

function isPinned (relPath: string) {
  return props.config.pinned.includes(relPath)
}

function togglePin (relPath: string) {
  props.config.pinned = isPinned(relPath)
    ? props.config.pinned.filter(p => p !== relPath)
    : [...props.config.pinned, relPath]
}

function setActive (relPath: string) {
  props.config.activeBuild = relPath
}

// Tree links come from build files, which may be shared by others:
// only web links are opened (window.open URLs go to the OS shell).
function safeUrl (url: string) {
  return /^https?:\/\//i.test(url) ? url : undefined
}

function act (p: Promise<unknown>) {
  p.catch((err: Error) => { detailsError.value = err.message })
}
</script>

<style lang="postcss" module>
.entryBtn {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
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

.iconBtn {
  flex-shrink: 0;
  @apply rounded px-2;
  @apply text-gray-400 bg-gray-800;

  &:hover {
    @apply bg-gray-700 text-gray-100;
  }
}

.heading {
  @apply text-gray-500 text-xs uppercase pb-0.5;
}
</style>
