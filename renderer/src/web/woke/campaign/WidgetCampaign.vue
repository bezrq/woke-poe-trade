<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-2 flex flex-col gap-1 text-gray-100 min-h-0" style="width: 22rem; max-height: 60vh;">
      <div class="flex items-center gap-2">
        <span class="font-semibold truncate grow">
          <template v-if="s.zone">{{ actLabel(s.act) }}<template v-if="s.act"> · </template>{{ s.zone }}</template>
          <template v-else>Waiting for a zone change…</template>
        </span>
      </div>
      <div class="text-sm text-gray-400 flex gap-3 flex-wrap">
        <span v-if="s.areaLevel != null">Area {{ s.areaLevel }}</span>
        <span v-if="s.level != null">
          {{ s.charName || 'You' }} {{ s.level }}
          <span v-if="levelDiff != null" :class="levelClass">({{ levelDiff > 0 ? '+' : '' }}{{ levelDiff }})</span>
        </span>
        <span v-if="!s.updatedAt" class="text-gray-500">Updates on your next zone change (reads Client.txt)</span>
      </div>

      <div class="overflow-y-auto min-h-0 flex flex-col gap-2 pt-1">
        <div v-if="zoneNote" class="whitespace-pre-wrap text-sm bg-gray-800 rounded p-1">{{ zoneNote }}</div>
        <div v-if="actNote" class="whitespace-pre-wrap text-sm text-gray-300">{{ actNote }}</div>

        <div v-if="config.showBuild && activeBuild" class="text-sm border-t border-gray-700 pt-1">
          <div class="text-gray-500 text-xs uppercase">Build: {{ activeBuild }}</div>
          <div v-if="buildError" class="text-red-400">{{ buildError }}</div>
          <template v-else-if="details">
            <a v-if="tree && safeUrl(tree.url)" :href="safeUrl(tree.url)" target="_blank" class="block truncate hover:text-white">
              <i class="fas fa-external-link-alt text-xs" /> Tree: {{ tree.title }}
            </a>
            <div v-for="(g, i) in mainGroups" :key="i" class="truncate text-gray-300" :title="g.gems.map(x => x.name).join(', ')">
              {{ g.gems.filter(x => x.enabled).map(x => x.name.replace(/ Support$/, '')).join(' · ') }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { CAMPAIGN_TYPE } from './widget'
import type { CampaignWidget } from './widget'

export default {
  widget: {
    type: CAMPAIGN_TYPE,
    instances: 'multi',
    trNameKey: 'Campaign tracker'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, shallowRef, watch, onUnmounted } from 'vue'
import { Host } from '@/web/background/IPC'
import { AppConfig, saveConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { actFromAreaId, actLabel, parseLogLine, pickTreeForLevel } from './log-parse'
import { emptyState, safeLevelRange } from './widget'
import { POB_BUILDS_TYPE, pobApi } from '../pob-builds/widget'
import type { PobBuildsWidget, PobDetails } from '../pob-builds/widget'

const props = defineProps<{
  config: CampaignWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = []
  props.config.wmTitle = 'Campaign tracker'
  props.config.anchor = { pos: 'tl', x: 70, y: 10 }
  props.config.charName = ''
  props.config.actNotes = {}
  props.config.zoneNotes = []
  props.config.showBuild = true
  props.config.state = emptyState()
  wm.show(props.config.wmId)
}

const s = computed(() => props.config.state)

const levelDiff = computed(() => {
  if (s.value.level == null || s.value.areaLevel == null) return null
  return s.value.level - s.value.areaLevel
})
const levelClass = computed(() => {
  if (levelDiff.value == null || s.value.level == null) return ''
  return Math.abs(levelDiff.value) <= safeLevelRange(s.value.level) ? 'text-green-400' : 'text-red-400'
})

const zoneNote = computed(() => {
  const zone = s.value.zone.toLowerCase()
  if (!zone) return ''
  return props.config.zoneNotes
    .filter(n => n.zone.trim().toLowerCase() === zone && n.text.trim())
    .map(n => n.text).join('\n\n')
})
const actNote = computed(() => s.value.act != null ? (props.config.actNotes[String(s.value.act)] ?? '').trim() : '')

const logListener = Host.onEvent('MAIN->CLIENT::game-log', (e) => {
  const state = props.config.state
  let changed = false
  for (const line of e.lines) {
    const ev = parseLogLine(line)
    if (!ev) continue
    if (ev.kind === 'area') {
      state.areaId = ev.areaId
      state.areaLevel = ev.areaLevel
      const act = actFromAreaId(ev.areaId)
      if (act != null) state.act = act
    } else if (ev.kind === 'zone') {
      state.zone = ev.name
    } else if (ev.kind === 'level') {
      const wanted = props.config.charName.trim()
      if (wanted && wanted !== ev.charName) continue
      state.charName = ev.charName
      state.className = ev.className
      state.level = ev.level
    }
    state.updatedAt = Date.now()
    changed = true
  }
  // APT saves config when the overlay loses focus; log events arrive while
  // the game has focus, so save here to keep progress across restarts.
  if (changed) saveConfig()
})
onUnmounted(() => { logListener.abort() })

// Active build from the PoB builds widget, if one is set.
const pobWidget = computed(() => AppConfig().widgets
  .find(w => w.wmType === POB_BUILDS_TYPE && (w as PobBuildsWidget).activeBuild) as PobBuildsWidget | undefined)
const activeBuild = computed(() => pobWidget.value?.activeBuild ?? null)
const details = shallowRef<PobDetails | null>(null)
const buildError = shallowRef('')

watch([activeBuild, () => props.config.showBuild], async ([relPath, show]) => {
  details.value = null
  buildError.value = ''
  if (!relPath || !show || !pobWidget.value) return
  try {
    details.value = await pobApi.read(pobWidget.value, relPath)
  } catch (err) {
    buildError.value = (err as Error).message
  }
}, { immediate: true })

const tree = computed(() => details.value ? pickTreeForLevel(details.value.trees, s.value.level) : null)
const mainGroups = computed(() => {
  const groups = details.value?.skills.filter(g => g.enabled && g.gems.length) ?? []
  const main = groups.filter(g => g.isMain)
  return (main.length ? main : groups).slice(0, 2)
})

function safeUrl (url: string) {
  return /^https?:\/\//i.test(url) ? url : undefined
}
</script>
