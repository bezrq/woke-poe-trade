<template>
  <div ref="railEl" :class="[$style.rail, { [$style.atEdge]: atEdge, [$style.onRight]: onRight }]" class="w-surface" :style="railStyle" data-widget-drag>
    <button :class="[$style.ic, $style.tools, { [$style.toolsOn]: popup?.kind === 'launcher' }]" aria-label="All tools"
      @click="openLauncher" @mouseenter="showTip('All tools', false, $event)" @mouseleave="hideTip">
      <i class="fas fa-th" />
    </button>

    <template v-if="fixedTabs.length">
      <span :class="$style.sep" />
      <button v-for="tab in fixedTabs" :key="tab.wmId" :class="[$style.ic, { [$style.open]: tab.open }]" :aria-label="tab.name"
        @click="toggle(tab)" @contextmenu.prevent="openMenu(tab, $event)"
        @mouseenter="showTip(tab.name, tab.open, $event)" @mouseleave="hideTip">
        <tool-icon :art="tab.art" :icon="tab.icon" />
      </button>
    </template>

    <template v-if="pinTabs.length">
      <span :class="$style.sep" />
      <button v-for="tab in pinTabs" :key="tab.wmId" :class="[$style.ic, { [$style.open]: tab.open }]" :aria-label="tab.name"
        @click="toggle(tab)" @contextmenu.prevent="openMenu(tab, $event)"
        @mouseenter="showTip(tab.name, tab.open, $event)" @mouseleave="hideTip">
        <tool-icon :art="tab.art" :icon="tab.icon" />
      </button>
    </template>

    <template v-if="openUnpinned.length">
      <span :class="$style.sep" />
      <button v-for="tab in openUnpinned" :key="tab.wmId" :class="[$style.ic, $style.open]" :aria-label="tab.name"
        @click="toggle(tab)" @contextmenu.prevent="openMenu(tab, $event)"
        @mouseenter="showTip(tab.name, true, $event)" @mouseleave="hideTip">
        <tool-icon :art="tab.art" :icon="tab.icon" />
      </button>
    </template>

    <template v-if="hotkeys.problems.value">
      <span :class="$style.sep" />
      <button :class="[$style.ic, $style.warn]" aria-label="Hotkey problems"
        @click="openHotkeyList" @mouseenter="showTip(`${hotkeys.summary.value}. Click for the hotkey list.`, false, $event)" @mouseleave="hideTip">
        <i class="fas fa-exclamation-triangle" />
        <span :class="$style.badge">{{ hotkeys.problems.value }}</span>
      </button>
    </template>

    <Teleport to="body">
      <div v-if="tip && !popup" :class="[$style.tip, { [$style.tipLeft]: tip.left }]" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">
        {{ tip.text }}<span v-if="tip.open" :class="$style.tipOpen">open</span>
      </div>

      <div v-if="popup" :class="$style.backdrop" @mousedown="closePopup" @contextmenu.prevent="closePopup" />

      <!-- Tools: every tool, one box for search and item paste -->
      <div v-if="popup?.kind === 'launcher'" ref="popupEl" :class="[$style.menu, $style.launcher]" :style="popupStyle" @contextmenu.prevent>
        <label :class="$style.find">
          <i class="fas fa-search" />
          <textarea ref="searchInput" v-model="query" :class="$style.findInput" rows="1" spellcheck="false"
            aria-label="Find a tool, or paste an item" placeholder="Find a tool, or paste an item (Ctrl V)"
            @paste="onBoxPaste" @keydown.esc="closePopup" @keydown.enter.prevent="openFirstMatch" />
        </label>
        <div :class="$style.cols">
          <div v-for="(col, i) in launcherColumns" :key="i">
            <template v-for="group in col" :key="group.label">
              <div v-if="group.items.length" :class="$style.head">{{ group.label }}</div>
              <div v-for="tab in group.items" :key="tab.wmId" :class="[$style.row, { [$style.rowOpen]: tab.open }]"
                @contextmenu.prevent.stop="openMenu(tab, $event)">
                <button :class="$style.rowMain" :aria-label="tab.name" @click="toggle(tab)">
                  <tool-icon :art="tab.art" :icon="tab.icon" />
                  <span :class="$style.rowName">{{ tab.name }}</span>
                  <span v-if="tab.copies > 1" :class="$style.dup" title="Several copies of this tool">×{{ tab.copies }}</span>
                </button>
                <button :class="[$style.pin, { [$style.pinOn]: tab.pinned }]"
                  :aria-label="tab.pinned ? `Unpin ${tab.name} from the rail` : `Pin ${tab.name} to the rail`"
                  :title="tab.pinned ? 'Unpin from the rail' : 'Pin to the rail'" @click="togglePin(tab)">
                  <i class="fas fa-thumbtack" />
                </button>
              </div>
            </template>
          </div>
        </div>
        <div v-if="!launcherHasMatch" :class="$style.none">No tool matches "{{ query.trim() }}"</div>
        <div :class="$style.foot">
          <span>Gold means open. Pin a tool to keep it on the rail.</span>
          <button :class="$style.footBtn" @click="openAdd"><i class="fas fa-plus" /> Add another tool</button>
        </div>
      </div>

      <!-- right-click menu -->
      <div v-if="popup?.kind === 'menu' && menuTab" ref="popupEl" :class="$style.menu" :style="popupStyle" @contextmenu.prevent>
        <div :class="$style.head">{{ menuTab.name }}</div>
        <button :class="$style.item" @click="toggle(menuTab); closePopup()">
          <i class="fas" :class="menuTab.open ? 'fa-eye-slash' : 'fa-eye'" />{{ menuTab.open ? 'Close window' : 'Open' }}
        </button>
        <button :class="$style.item" @click="togglePin(menuTab); closePopup()">
          <i class="fas fa-thumbtack" />{{ menuTab.pinned ? 'Unpin from the rail' : 'Pin to the rail' }}
        </button>
        <template v-if="menuTab.pinned && !menuTab.iconOnly">
          <button :class="$style.item" :disabled="!canShift(menuTab, -1)" @click="shift(menuTab, -1)"><i class="fas fa-chevron-up" />Move up</button>
          <button :class="$style.item" :disabled="!canShift(menuTab, 1)" @click="shift(menuTab, 1)"><i class="fas fa-chevron-down" />Move down</button>
        </template>
        <hr :class="$style.rule">
        <button v-if="menuTab.hasAnchor" :class="$style.item" @click="resetPosition(menuTab); closePopup()">
          <i class="fas fa-undo" />Reset window position
        </button>
        <div v-if="renaming" :class="$style.renameRow">
          <input ref="renameInput" v-model="renameValue" :class="$style.input" placeholder="Tool name"
            @keydown.enter="commitRename" @keydown.esc="closePopup">
          <button :class="$style.iconBtn" title="Save" @click="commitRename"><i class="fas fa-check" /></button>
        </div>
        <button v-else-if="!menuTab.iconOnly" :class="$style.item" @click="startRename"><i class="fas fa-pen" />Rename</button>
        <template v-if="menuTab.removable">
          <hr :class="$style.rule">
          <button v-if="menuTab.copies > 1" :class="[$style.item, $style.danger]" @click="removeCopies(menuTab)">
            <i class="fas fa-clone" />Remove extra copies ({{ menuTab.copies - 1 }})
          </button>
          <button :class="[$style.item, $style.danger]" @click="removeTab(menuTab)">
            <i class="fas fa-trash" />{{ confirmRemove ? 'Click again to remove' : 'Remove from overlay' }}
          </button>
        </template>
      </div>

      <!-- Add a tool -->
      <div v-if="popup?.kind === 'add'" ref="popupEl" :class="[$style.menu, $style.addList]" :style="popupStyle" @contextmenu.prevent>
        <div :class="$style.search">
          <i class="fas fa-search" />
          <input ref="searchInput" v-model="query" :class="$style.searchInput" placeholder="Find a tool"
            @keydown.esc="closePopup" @keydown.enter="addFirstMatch">
        </div>
        <div :class="$style.scroll">
          <template v-for="group in addGroups" :key="group.label">
            <div :class="$style.head">{{ group.label }}</div>
            <button v-for="spec in group.types" :key="spec.type" :class="$style.item" @click="add(spec.type)">
              <i class="fas" :class="iconFor(spec.type)" />{{ spec.name }}
              <span :class="[$style.state, { [$style.stateOn]: stateOf(spec.type) === 'Open it' }]">{{ stateOf(spec.type) }}</span>
            </button>
          </template>
          <div v-if="!addGroups.length" :class="$style.foot">No tool matches "{{ query }}"</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { popupAnchor } from '../ui/window-anchor'
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { WidgetManager } from '@/web/overlay/interfaces'
import type { Widget, Anchor } from '@/web/overlay/widgets'
import { registry } from '@/web/overlay/widget-registry'
import { AppConfig } from '@/web/Config'
import { isWidgetTypeOn } from '@/web/woke/modules'
import { useI18n } from 'vue-i18n'
import { useHotkeyHealth } from '../switchboard/hotkey-health'
import ToolIcon from './ToolIcon.vue'
import { artFor, iconFor, allowsCopies, groupByModule, groupTypes, looksLikeItem, migrateToRail, parseWidgetTitle } from './tools'
import type { TabBarConfig } from './tools'

const props = defineProps<{ config: TabBarConfig }>()
const emit = defineEmits<{ (e: 'paste', text: string, from: DOMRect): void }>()

const wm = inject<WidgetManager>('wm')!
const { t } = useI18n()

interface Tab {
  wmId: number
  wmType: string
  name: string
  icon: string
  art: string | null
  iconOnly: boolean
  open: boolean
  pinned: boolean
  copies: number
  removable: boolean
  hasAnchor: boolean
}

function typeName (wmType: string): string {
  const spec = registry.widgets.find(w => w.widget.type === wmType)?.widget
  return spec?.trNameKey ? t(spec.trNameKey) : wmType
}

const listed = computed(() => wm.widgets.value.filter(w =>
  !w.wmFlags.includes('menu::skip') && isWidgetTypeOn(AppConfig(), w.wmType)))

migrateToRail(props.config, listed.value)

const tabs = computed<Tab[]>(() => {
  const counts = new Map<string, number>()
  for (const w of listed.value) counts.set(w.wmType, (counts.get(w.wmType) ?? 0) + 1)
  const pinned = props.config.pinned ?? []
  return listed.value.map(w => {
    const parsed = parseWidgetTitle(w.wmTitle)
    const custom = props.config.labels?.[w.wmId]
    const title = custom || parsed.title
    return {
      wmId: w.wmId,
      wmType: w.wmType,
      name: title || typeName(w.wmType) || `#${w.wmId}`,
      icon: parsed.icon ?? iconFor(w.wmType),
      art: artFor(w.wmType),
      iconOnly: !title && !!parsed.icon,
      open: w.wmWants === 'show',
      pinned: pinned.includes(w.wmId),
      copies: allowsCopies(w.wmType) ? 1 : counts.get(w.wmType)!,
      removable: w.wmType !== 'settings',
      hasAnchor: 'anchor' in w
    }
  })
})

// Which side of the screen the rail is on decides where things open from it.
const onRight = computed(() => {
  const { pos, x } = props.config.anchor
  return pos.endsWith('r') ? x > 50 : x >= 50
})
const atEdge = computed(() => props.config.anchor.pos.endsWith('l') && props.config.anchor.x <= 0)

// Keep every icon reachable: it scrolls instead of running off the screen.
const railStyle = computed(() => {
  const { pos, y } = props.config.anchor
  const room = pos.startsWith('t') ? 100 - y : pos.startsWith('b') ? y : 2 * Math.min(y, 100 - y)
  return { maxHeight: `calc(${room}vh - 8px)` }
})

const pinnedTabs = computed(() => {
  const byId = new Map(tabs.value.map(tab => [tab.wmId, tab]))
  return (props.config.pinned ?? []).map(id => byId.get(id)).filter((x): x is Tab => !!x)
})
const fixedTabs = computed(() => pinnedTabs.value.filter(tab => tab.iconOnly))
const pinTabs = computed(() => pinnedTabs.value.filter(tab => !tab.iconOnly))
const openUnpinned = computed(() => tabs.value.filter(tab => !tab.pinned && tab.open))

// Two actions on one key, or a key another program holds: either way one
// of them silently does nothing, so say so where it's always seen.
const hotkeys = useHotkeyHealth()
function openHotkeyList () {
  const settings = wm.widgets.value.find(w => w.wmType === 'settings')
  if (!settings) return
  wm.setFlag(settings.wmId, 'settings::page=Hotkey list', true)
  wm.show(settings.wmId)
}

function toggle (tab: Tab) {
  hideTip()
  if (tab.open) wm.hide(tab.wmId)
  else wm.show(tab.wmId)
}

function togglePin (tab: Tab) {
  const pinned = props.config.pinned ?? []
  props.config.pinned = tab.pinned ? pinned.filter(id => id !== tab.wmId) : [...pinned, tab.wmId]
}
function canShift (tab: Tab, dir: -1 | 1) {
  const i = pinTabs.value.findIndex(x => x.wmId === tab.wmId)
  return i >= 0 && i + dir >= 0 && i + dir < pinTabs.value.length
}
function shift (tab: Tab, dir: -1 | 1) {
  if (!canShift(tab, dir)) return
  // Swap with the neighbour shown on the rail, inside the full pinned list:
  // pins of switched-off modules (not shown) must survive the move.
  const shown = pinTabs.value.map(x => x.wmId)
  const other = shown[shown.indexOf(tab.wmId) + dir]
  const ids = [...(props.config.pinned ?? [])]
  const a = ids.indexOf(tab.wmId)
  const b = ids.indexOf(other)
  if (a < 0 || b < 0) return
  ;[ids[a], ids[b]] = [ids[b], ids[a]]
  props.config.pinned = ids
}

function resetPosition (tab: Tab) {
  const w = wm.widgets.value.find(x => x.wmId === tab.wmId) as (Widget & { anchor?: Anchor }) | undefined
  if (w?.anchor) w.anchor = popupAnchor()
  wm.show(tab.wmId)
}

function forget (wmId: number) {
  props.config.pinned = (props.config.pinned ?? []).filter(id => id !== wmId)
  setLabel(wmId, '')
  wm.remove(wmId)
}
const confirmRemove = ref(false)
function removeTab (tab: Tab) {
  if (!confirmRemove.value) { confirmRemove.value = true; return }
  forget(tab.wmId)
  closePopup()
}
function removeCopies (tab: Tab) {
  for (const w of listed.value) {
    if (w.wmType === tab.wmType && w.wmId !== tab.wmId) forget(w.wmId)
  }
  closePopup()
}

const renaming = ref(false)
const renameValue = ref('')
const renameInput = ref<HTMLInputElement>()
function startRename () {
  renaming.value = true
  renameValue.value = menuTab.value?.name ?? ''
  nextTick(() => renameInput.value?.select())
}
function commitRename () {
  const tab = menuTab.value
  if (tab) setLabel(tab.wmId, renameValue.value.trim())
  closePopup()
}
function setLabel (wmId: number, label: string) {
  const labels = Object.fromEntries(Object.entries(props.config.labels ?? {})
    .filter(([id]) => Number(id) !== wmId))
  if (label) labels[wmId] = label
  props.config.labels = labels
}

// Names on hover. Drawn on body so a window can't cover them.
const railEl = ref<HTMLElement | null>(null)
const tip = ref<{ text: string, open: boolean, x: number, y: number, left: boolean } | null>(null)
function showTip (text: string, open: boolean, e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const rail = railEl.value?.getBoundingClientRect() ?? r
  tip.value = {
    text,
    open,
    left: onRight.value,
    x: onRight.value ? rail.left - 6 : rail.right + 6,
    y: r.top + r.height / 2
  }
}
function hideTip () { tip.value = null }

// popups
// y: where the popup's top goes when it opens downward; above: where its
// bottom goes when there is no room below and it opens upward instead.
type PopupKind = 'menu' | 'launcher' | 'add'
const POPUP_WIDTH: Record<PopupKind, number> = { menu: 240, launcher: 900, add: 290 }
const popup = ref<{ kind: PopupKind, x: number, y: number, above: number, up?: boolean, wmId?: number } | null>(null)
const popupEl = ref<HTMLElement | null>(null)
const menuTab = computed(() => tabs.value.find(tab => tab.wmId === popup.value?.wmId))
const popupStyle = computed(() => {
  if (!popup.value) return {}
  const x = Math.min(popup.value.x, window.innerWidth - POPUP_WIDTH[popup.value.kind] - 4)
  const left = `${Math.max(4, x)}px`
  return popup.value.up
    ? { left, bottom: `${window.innerHeight - popup.value.above}px`, maxHeight: `${popup.value.above - 4}px`, overflowY: 'auto' as const }
    : { left, top: `${popup.value.y}px` }
})
// Flip upward when the popup would run off the bottom of the screen and
// there is more room above the click than below it.
function placePopup () {
  nextTick(() => {
    const p = popup.value
    const el = popupEl.value
    if (!p || !el) return
    const h = el.getBoundingClientRect().height
    const roomBelow = window.innerHeight - p.y - 4
    if (h > roomBelow && p.above > roomBelow) p.up = true
  })
}
function openMenu (tab: Tab, e: MouseEvent) {
  hideTip()
  confirmRemove.value = false
  renaming.value = false
  popup.value = { kind: 'menu', x: e.clientX, y: e.clientY, above: e.clientY, wmId: tab.wmId }
  placePopup()
}
// Beside the rail, on whichever side of it faces the screen.
function openBesideRail (kind: 'launcher' | 'add') {
  hideTip()
  const r = railEl.value!.getBoundingClientRect()
  popup.value = {
    kind,
    x: onRight.value ? r.left - 4 - POPUP_WIDTH[kind] : r.right + 4,
    y: r.top,
    above: r.bottom
  }
  placePopup()
  query.value = ''
  nextTick(() => searchInput.value?.focus())
}
function openLauncher () { openBesideRail('launcher') }
function openAdd () { openBesideRail('add') }
function closePopup () {
  popup.value = null
  renaming.value = false
  confirmRemove.value = false
}
watch(() => wm.active.value, active => {
  if (!active) {
    closePopup()
    hideTip()
  }
})

const query = ref('')
const searchInput = ref<HTMLInputElement | HTMLTextAreaElement>()

// launcher
const launcherMatches = computed(() => {
  const q = query.value.trim().toLowerCase()
  // Settings and search live on the rail; listed here only if taken off it,
  // so they can be put back.
  const shown = tabs.value.filter(tab => !(tab.iconOnly && tab.pinned))
  return q ? shown.filter(tab => tab.name.toLowerCase().includes(q)) : shown
})
const launcherHasMatch = computed(() => launcherMatches.value.length > 0)
// One column per group; whatever is left shares the last one.
const launcherColumns = computed(() => {
  const groups = groupByModule(launcherMatches.value)
  return [[groups[0]], [groups[1]], [groups[2]], groups.slice(3)]
})
function openFirstMatch () {
  const first = launcherColumns.value.flat().flatMap(g => g.items)[0]
  if (!first) return
  wm.show(first.wmId)
  closePopup()
}

// An item pasted into the box, or anywhere in the overlay outside a text
// field, goes to the price check. Other text in the box is a search.
function sendItem (text: string, from: HTMLElement | null | undefined) {
  emit('paste', text, (from ?? document.body).getBoundingClientRect())
}
function onBoxPaste (e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text/plain') ?? ''
  if (!looksLikeItem(text)) return
  e.preventDefault()
  const box = e.target as HTMLElement
  sendItem(text, box)
  closePopup()
}
function onOverlayPaste (e: ClipboardEvent) {
  if (!wm.active.value) return
  const target = e.target
  if (target instanceof Element && target.closest('input, textarea, [contenteditable]')) return
  const text = e.clipboardData?.getData('text/plain') ?? ''
  if (!looksLikeItem(text)) return
  e.preventDefault()
  sendItem(text, railEl.value)
}
onMounted(() => document.addEventListener('paste', onOverlayPaste))
onBeforeUnmount(() => document.removeEventListener('paste', onOverlayPaste))

// add list
const addable = computed(() => registry.widgets
  .filter(({ widget }) => widget.instances === 'multi' && widget.type !== 'stash-search' && isWidgetTypeOn(AppConfig(), widget.type))
  .map(({ widget }) => ({ type: widget.type, name: typeName(widget.type) })))
const addGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  return groupTypes(q ? addable.value.filter(s => s.name.toLowerCase().includes(q)) : addable.value)
})
function stateOf (wmType: string): string {
  const mine = tabs.value.filter(tab => tab.wmType === wmType)
  if (allowsCopies(wmType)) return mine.length ? `${mine.length} placed · Add another` : 'Add'
  return mine.length ? 'Open it' : 'Add'
}
function add (wmType: string) {
  const existing = tabs.value.find(tab => tab.wmType === wmType)
  if (existing && !allowsCopies(wmType)) {
    wm.show(existing.wmId)
    closePopup()
    return
  }
  wm.create(wmType)
  const created = wm.widgets.value.reduce((a, b) => (a.wmId > b.wmId ? a : b))
  props.config.pinned = [...(props.config.pinned ?? []), created.wmId]
  closePopup()
  // The widget initialises on mount; show it once that has happened.
  nextTick(() => nextTick(() => wm.show(created.wmId)))
}
function addFirstMatch () {
  const first = addGroups.value[0]?.types[0]
  if (first) add(first.type)
}
</script>

<style module>
.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px;
  border-radius: var(--w-r-md);
  overflow-y: auto;
  scrollbar-width: none;
  font-family: var(--w-body);
  font-size: var(--w-text);
}
.rail.atEdge { border-left: 0; border-radius: 0 var(--w-r-md) var(--w-r-md) 0; }
.ic {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 32px;
  border-radius: var(--w-r-sm);
  color: var(--w-dim);
}
.ic:hover { background: var(--w-panel-3); color: var(--w-fg); }
.ic.open { background: var(--w-accent-soft); color: var(--w-fg); }
.ic.open::after {
  content: "";
  position: absolute;
  right: 1px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: var(--w-r-sm);
  background: var(--w-accent);
}
.onRight .ic.open::after { right: auto; left: 1px; }
.tools { background: var(--w-panel-3); color: var(--w-fg); }
.tools:hover, .toolsOn { background: color-mix(in srgb, var(--w-accent) 22%, transparent); }
.warn { color: var(--w-warn); background: color-mix(in srgb, var(--w-warn) 14%, transparent); }
.warn:hover { color: var(--w-warn); background: color-mix(in srgb, var(--w-warn) 24%, transparent); }
.badge {
  position: absolute;
  right: 1px;
  top: 1px;
  min-width: 13px;
  height: 13px;
  padding: 0 2px;
  border-radius: var(--w-r-sm);
  font: var(--w-fs-xs)/13px var(--w-num);
  text-align: center;
  color: var(--w-accent-fg);
  background: var(--w-warn);
}
.sep { flex: none; width: 22px; height: 1px; margin: 4px 0; background: var(--w-line); }

.tip {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: var(--w-s2);
  padding: 4px 10px;
  transform: translateY(-50%);
  border-radius: var(--w-r-sm);
  border: 1px solid var(--w-line-strong);
  background: var(--w-tip-bg);
  color: var(--w-fg);
  font-family: var(--w-head);
  font-size: var(--w-head-size);
  letter-spacing: var(--w-head-track);
  white-space: nowrap;
  pointer-events: none;
}
.tipLeft { transform: translate(-100%, -50%); }
.tipOpen { font: var(--w-fs-sm) var(--w-body); letter-spacing: 0; color: var(--w-accent); }

.dup {
  font: var(--w-fs-xs) var(--w-num);
  color: var(--w-down);
  border: 1px solid color-mix(in srgb, var(--w-down) 45%, transparent);
  border-radius: var(--w-r-sm);
  padding: 0 3px;
  letter-spacing: 0;
}
.iconBtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  border-radius: var(--w-r-sm);
  color: var(--w-dim);
}
.iconBtn:hover { background: var(--w-panel-3); color: var(--w-fg); }

.backdrop { position: fixed; inset: 0; z-index: 9998; }
.menu {
  position: fixed;
  z-index: 9999;
  min-width: 220px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  background: var(--w-panel);
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-r-md);
  box-shadow: var(--w-shadow);
  color: var(--w-fg);
  font-family: var(--w-body);
  font-size: var(--w-text);
}

.launcher { box-sizing: border-box; width: 900px; max-width: calc(100vw - 8px); padding: 10px; background: var(--w-panel-solid); }
.find {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  flex: none;
  padding: 0 10px;
  margin-bottom: 10px;
  border-radius: var(--w-r-sm);
  border: 1px solid var(--w-line-strong);
  background: var(--w-panel-2);
  color: var(--w-dim);
}
.findInput {
  flex: 1;
  min-width: 0;
  height: 18px;
  padding: 0;
  resize: none;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  outline: 0;
  background: none;
  color: var(--w-fg);
  font: var(--w-text)/18px var(--w-body);
}
.findInput::placeholder { color: var(--w-dim); }
.cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px 10px; align-items: start; }
.row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 4px 0 7px;
  border-radius: var(--w-r-sm);
}
.row:hover { background: var(--w-accent-soft); }
.rowMain { flex: 1; min-width: 0; height: 100%; display: flex; align-items: center; gap: 9px; text-align: left; color: var(--w-fg); }
.rowMain > i { color: var(--w-dim); }
.rowName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rowOpen .rowName { color: var(--w-accent); }
.pin {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: var(--w-r-sm);
  color: var(--w-dim);
  font-size: var(--w-fs-xs);
  opacity: 0;
}
.pin:hover { color: var(--w-fg); background: var(--w-panel-3); }
.pinOn, .pinOn:hover { color: var(--w-accent); }
.row:hover .pin, .pinOn, .pin:focus-visible { opacity: 1; }
.none { padding: 10px 8px; color: var(--w-dim); }
.foot { padding: 6px 8px 4px; font-size: var(--w-text-sm); color: var(--w-dim); }
.launcher .foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 8px 8px 2px;
  border-top: 1px solid var(--w-line);
}
.footBtn { color: var(--w-dim); padding: 2px 4px; border-radius: var(--w-r-sm); }
.footBtn:hover { color: var(--w-fg); background: var(--w-panel-3); }

.head {
  padding: 5px 8px 3px;
  font-size: var(--w-text-sm);
  font-weight: 600;
  color: var(--w-dim);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 28px;
  padding: 0 8px;
  border-radius: var(--w-r-sm);
  text-align: left;
  white-space: nowrap;
}
.item > i { width: 14px; text-align: center; font-size: var(--w-fs-md); color: var(--w-dim); }
.item:hover:not(:disabled) { background: var(--w-accent-soft); }
.item:disabled { color: var(--w-faint); }
.danger, .danger > i { color: var(--w-down); }
.state { margin-left: auto; padding-left: 16px; font-size: var(--w-text-sm); color: var(--w-faint); }
.stateOn { color: var(--w-accent); }
.rule { border: 0; border-top: 1px solid var(--w-line); margin: 4px 2px; }
.renameRow { display: flex; gap: 4px; padding: 2px; }
.input, .searchInput {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 8px;
  border-radius: var(--w-r-sm);
  border: 1px solid var(--w-line-strong);
  background: var(--w-panel-2);
  color: var(--w-fg);
}
.addList { width: 280px; }
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 2px 6px 8px;
  color: var(--w-faint);
}
.searchInput { border-color: var(--w-line); }
.scroll { max-height: 60vh; overflow-y: auto; display: flex; flex-direction: column; }
</style>
