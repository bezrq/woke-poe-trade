<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="flex gap-2 min-h-0 items-start">
      <WPanel :title="config.wmTitle || 'Trade searches'" width="19rem" max-height="70vh">
        <template #actions>
          <WChip v-if="hasHotkeys" clickable :active="config.enableHotkeys" title="Use each search's hotkey"
            @click="config.enableHotkeys = !config.enableHotkeys"><i class="fas fa-keyboard" /> Hotkeys</WChip>
        </template>
        <template #toolbar>
          <WField v-model="filter" icon="fas fa-search" placeholder="Filter by name, tag, category…" class="grow" />
        </template>

        <template v-for="group in groups" :key="group.category">
          <div class="w-group-label">{{ group.category }}</div>
          <WListItem v-for="entry in group.entries" :key="entry.id" :active="openId === entry.id"
            :title="tooltip(entry)" @select="open(entry, 'overlay')">
            <i v-if="isLiveSearch(entry.url)" class="fas fa-bolt w-accent" title="Live search" />
            <span class="w-trunc">{{ entry.name || entry.url }}</span>
            <WChip v-if="otherLeague(entry)" :title="`Saved in ${otherLeague(entry)}. Opens in ${league}.`">{{ otherLeague(entry) }} → now</WChip>
            <WKbd v-if="config.enableHotkeys && entry.hotkeyOverlay" :keys="entry.hotkeyOverlay" class="ml-auto" />
            <template #actions>
              <button @click="open(entry, 'external')" class="w-icon-btn" title="Open in your browser">
                <i class="fas fa-external-link-alt" />
              </button>
            </template>
          </WListItem>
        </template>
        <WEmpty v-if="!groups.length" icon="fas fa-search">
          {{ config.entries.length ? 'No matches' : 'No saved searches yet. Open settings to add some.' }}
        </WEmpty>

        <template #footer>
          <span>Opens the official trade site</span>
        </template>
      </WPanel>

      <WPanel v-if="openEntry" :title="openEntry.name || openEntry.url" :scroll="false" max-height="none"
        :class="{ [$style.flash]: flashing }" style="width: 60vw; height: 75vh;">
        <template #actions>
          <WChip v-if="isLiveSearch(openEntry.url)" clickable :active="!!config.liveAlert" class="mr-1"
            :title="config.liveAlert ? 'Beeps when a new result appears. Click to turn off.' : 'Beep and flash when a new result appears on this page'"
            @click="config.liveAlert = !config.liveAlert"><i class="fas fa-bell" /> Ping</WChip>
          <span class="w-faint text-xs whitespace-nowrap mr-1">{{ overlayKey }} to interact</span>
          <button @click="open(openEntry, 'external')" class="w-icon-btn" title="Open in your browser">
            <i class="fas fa-external-link-alt" />
          </button>
          <button @click="closeBrowser" class="w-icon-btn" title="Close">
            <i class="fas fa-times" />
          </button>
        </template>
        <webview ref="webviewEl" class="pointer-events-auto w-full h-full flex"
          width="100%" height="100%" />
      </WPanel>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { TRADE_SEARCHES_TYPE } from './widget'
import type { TradeSearchesWidget } from './widget'

export default {
  widget: {
    type: TRADE_SEARCHES_TYPE,
    instances: 'multi',
    trNameKey: 'Trade searches'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, watch, shallowRef, nextTick, onUnmounted } from 'vue'
import { Host, MainProcess } from '@/web/background/IPC'
import { AppConfig, pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WField, WChip, WKbd, WEmpty, WListItem } from '../ui'
import { useLeagues } from '@/web/background/Leagues'
import { groupByCategory, isLiveSearch, isValidUrl, leagueOf, matchesFilter, parseHotkeyTarget, withLeague } from './widget'
import type { OpenTarget, TradeSearchEntry } from './widget'

const props = defineProps<{
  config: TradeSearchesWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Trade searches'
  props.config.anchor = { pos: 'tl', x: 30, y: 25 }
  props.config.enableHotkeys = true
  props.config.entries = []
  wm.show(props.config.wmId)
}

const filter = shallowRef('')
const openId = shallowRef<number | null>(null)
const webviewEl = shallowRef<HTMLElement & { src: string, executeJavaScript?: (code: string) => Promise<unknown> } | null>(null)
const leagues = useLeagues()
const league = computed(() => leagues.selectedId.value)

// Saved league differs from the current one (and we'll rewrite it).
function otherLeague (entry: TradeSearchEntry): string | null {
  if (props.config.followLeague === false || !league.value) return null
  const saved = leagueOf(entry.url)
  return saved && saved !== league.value ? saved : null
}

function urlFor (entry: TradeSearchEntry): string {
  return props.config.followLeague === false ? entry.url : withLeague(entry.url, league.value)
}

// Live-search ping: counts result rows on the page that's already open (no
// extra requests) and beeps when the count goes up.
const flashing = shallowRef(false)
let lastCount = -1
const ROWS_JS = "document.querySelectorAll('.resultset > .row[data-id]').length"
const livePoll = setInterval(async () => {
  const el = webviewEl.value
  if (!props.config.liveAlert || !openEntry.value || !isLiveSearch(openEntry.value.url) || !el?.executeJavaScript) {
    lastCount = -1
    return
  }
  try {
    const n = Number(await el.executeJavaScript(ROWS_JS))
    if (lastCount >= 0 && n > lastCount) ping()
    lastCount = n
  } catch {}
}, 1500)
onUnmounted(() => { clearInterval(livePoll) })

function ping () {
  flashing.value = true
  setTimeout(() => { flashing.value = false }, 900)
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
    osc.onended = () => { ctx.close().catch(() => {}) }
  } catch {}
}

const openEntry = computed(() => props.config.entries.find(e => e.id === openId.value))
const groups = computed(() => groupByCategory(
  props.config.entries.filter(e => matchesFilter(e, filter.value))))
const hasHotkeys = computed(() => props.config.entries.some(e => e.hotkeyOverlay || e.hotkeyExternal))
const overlayKey = computed(() => AppConfig().overlayKey)

watch(() => props.config.enableHotkeys, () => { pushHostConfig() })

// While a search is open, keep it visible over the game (useful for live
// searches); the list alone hides when the game has focus, like stash search.
watch(openEntry, (entry) => {
  wm.setFlag(props.config.wmId, 'invisible-on-blur', !entry)
})

function open (entry: TradeSearchEntry, where: OpenTarget) {
  // Only http(s): the host passes window.open URLs to the OS shell.
  const url = urlFor(entry)
  if (!isValidUrl(url)) return
  if (where === 'external' || !Host.isElectron) {
    window.open(url)
    return
  }
  openId.value = entry.id
  lastCount = -1
  wm.show(props.config.wmId)
  nextTick(() => {
    if (webviewEl.value) webviewEl.value.src = url
  })
}

function closeBrowser () {
  openId.value = null
}

const hotkeyController = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  const parsed = parseHotkeyTarget(e.target)
  if (!parsed || parsed.wmId !== props.config.wmId) return
  const entry = props.config.entries.find(en => en.id === parsed.entryId)
  if (entry) open(entry, parsed.where)
})
onUnmounted(() => { hotkeyController.abort() })

function tooltip (entry: TradeSearchEntry) {
  return [entry.url, entry.tags.length ? `Tags: ${entry.tags.join(', ')}` : '', entry.notes]
    .filter(Boolean).join('\n')
}
</script>

<style module>
.flash { box-shadow: 0 0 0 2px var(--w-accent); transition: box-shadow 0.2s; }
</style>
