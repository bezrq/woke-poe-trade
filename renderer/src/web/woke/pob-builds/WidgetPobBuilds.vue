<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="flex gap-2 min-h-0 items-start">
      <WPanel :title="config.wmTitle || 'PoB builds'" width="20rem" max-height="70vh">
        <template #actions>
          <button @click="refresh" class="w-icon-btn" title="Reload builds folder">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }" />
          </button>
        </template>
        <template #toolbar>
          <WField v-model="filter" icon="fas fa-search" placeholder="Filter by name, class, skill, folder…" class="grow" />
        </template>
        <template v-if="error" #meta><span class="w-down">{{ error }}</span></template>

        <WListItem v-for="b in shown" :key="b.relPath" :active="selected === b.relPath" :title="b.relPath" @select="select(b)">
          <i v-if="config.activeBuild === b.relPath" class="fas fa-check-circle w-up" title="Active build" />
          <span class="w-trunc">{{ b.name }}</span>
          <template #sub>{{ describe(b) }}<template v-if="b.folder"> · {{ b.folder }}</template></template>
          <template #actions>
            <button @click="togglePin(b.relPath)" class="w-icon-btn" :class="{ 'w-icon-btn--on': isPinned(b.relPath) }"
              :title="isPinned(b.relPath) ? 'Unpin' : 'Pin to top'">
              <i class="fas fa-thumbtack" />
            </button>
          </template>
        </WListItem>
        <WEmpty v-if="!loading && !shown.length && !error" icon="fas fa-folder-open">
          {{ builds.length ? 'No matches' : `No builds found in ${dir || 'the builds folder'}` }}
        </WEmpty>
      </WPanel>

      <WPanel v-if="selectedBuild" :title="selectedBuild.name" width="23rem" max-height="70vh">
        <template #actions>
          <button @click="selected = null" class="w-icon-btn" title="Close"><i class="fas fa-times" /></button>
        </template>
        <template #toolbar>
          <WButton size="sm" variant="primary" icon="fas fa-external-link-alt" @click="act(pobApi.open(config, selectedBuild.relPath))">Open in PoB</WButton>
          <WButton size="sm" @click="act(pobApi.show(config, selectedBuild.relPath))">Show file</WButton>
          <WButton size="sm" @click="setActive(selectedBuild.relPath)" :disabled="config.activeBuild === selectedBuild.relPath">
            {{ config.activeBuild === selectedBuild.relPath ? 'Active build' : 'Make active' }}
          </WButton>
        </template>

        <div class="pb-2" style="padding-left: var(--w-pad); padding-right: var(--w-pad);">
          <div v-if="detailsError" class="w-down">{{ detailsError }}</div>
          <template v-else-if="details">
            <div class="w-dim pb-2">{{ describe(details) }}</div>
            <div v-if="details.trees.length" class="pb-2">
              <div :class="$style.heading">Passive trees</div>
              <a v-for="t in details.trees" :key="t.title + t.url" :href="safeUrl(t.url)" target="_blank"
                class="block w-trunc py-0.5 hover:underline" :class="t.isActive ? '' : 'w-dim'">
                <i class="fas fa-external-link-alt text-xs w-faint" /> {{ t.title }}<span v-if="t.isActive" class="w-accent"> · active</span>
              </a>
            </div>
            <div v-if="details.skills.length" class="pb-2">
              <div :class="$style.heading">Gem setups</div>
              <div v-for="(s, i) in details.skills" :key="i" :class="[$style.setup, { 'opacity-50': !s.enabled }]">
                <div class="w-dim text-xs">
                  {{ s.label || s.slot || `Group ${i + 1}` }}<span v-if="s.isMain" class="w-accent"> · main</span>
                </div>
                <div class="flex flex-wrap gap-x-2">
                  <span v-for="(g, j) in s.gems" :key="j" class="w-rarity-gem" :class="{ 'line-through opacity-50': !g.enabled }">
                    {{ g.name }}<span class="w-faint text-xs w-num" v-if="g.level != null"> {{ g.level }}/{{ g.quality ?? 0 }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="details.notes">
              <div :class="$style.heading">Notes</div>
              <div class="whitespace-pre-wrap w-dim">{{ details.notes }}</div>
            </div>
          </template>
          <WEmpty v-else icon="fas fa-spinner fa-spin">Loading…</WEmpty>
        </div>
      </WPanel>
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
import { WPanel, WField, WButton, WEmpty, WListItem } from '../ui'
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

<style module>
.heading {
  padding: 4px 0 2px;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--w-faint);
}
.setup {
  padding: 4px 0;
  border-bottom: 1px solid var(--w-line-soft);
}
</style>
