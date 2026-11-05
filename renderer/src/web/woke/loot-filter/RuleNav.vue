<template>
  <div :class="$style.nav" @keydown="onKey">
    <div :class="$style.tools">
      <WField v-model="query" type="search" icon="fas fa-filter" placeholder="Filter groups" />
      <WSegmented :model-value="config.ruleNav.mode" :options="MODE_OPTIONS" @update:model-value="setMode" />
      <div class="flex items-center gap-1">
        <WChip clickable :active="changedOnly" @click="changedOnly = !changedOnly">Only what I changed{{ changedTotal ? ` ${changedTotal}` : '' }}</WChip>
      </div>
    </div>

    <nav v-if="!flatList" :class="$style.crumbs" aria-label="Where you are in the rule list">
      <button type="button" class="w-focusable" :class="$style.crumb" @click="at = { cat: null, chapter: null }">All</button>
      <template v-if="here.category">
        <span class="w-faint"> › </span>
        <button type="button" class="w-focusable" :class="$style.crumb" @click="openCat(here.category!)">{{ here.category.label }}</button>
      </template>
      <template v-if="here.chapter && here.category!.chapters.length > 1">
        <span class="w-faint"> › </span>
        <span class="w-dim w-trunc">{{ here.chapter.title }}</span>
      </template>
    </nav>

    <div ref="listEl" :class="$style.list" class="w-scroll">
      <!-- Filter results, the Changed list: flat, each saying where it lives. -->
      <template v-if="flatList">
        <WEmpty v-if="!flatList.length" icon="fas fa-search">{{ changedOnly && !query.trim() ? 'No changes yet.' : `No group matches "${query}".` }}</WEmpty>
        <WListItem v-for="s in flatList" :key="s.group.type" :active="s.group.type === selType" @select="pick(s)" @contextmenu="emit('group-menu', $event, s.group.type)">
          <span class="flex items-center gap-2 w-full min-w-0" :class="{ [$style.off]: s.group.hidden }">
            <span class="w-trunc">{{ nameOf(s.group) }}</span>
            <span v-if="changedIn(s.group.type)" :class="$style.changed" class="text-xs">{{ changedIn(s.group.type) }}</span>
            <span class="grow" />
          </span>
          <template #sub>{{ s.category.label }}<template v-if="s.category.chapters.length > 1"> › {{ s.chapter.title }}</template></template>
        </WListItem>
      </template>

      <!-- Top level: pinned groups, then categories. -->
      <template v-else-if="!here.category">
        <template v-if="pinned.length">
          <div class="w-group-label">Pinned</div>
          <WListItem v-for="s in pinned" :key="s.group.type" :active="s.group.type === selType" @select="pick(s)" @contextmenu="emit('group-menu', $event, s.group.type)">
            <span class="flex items-center gap-2 w-full min-w-0">
              <i class="fas fa-star" :class="$style.star" aria-hidden="true" />
              <span class="w-trunc">{{ nameOf(s.group) }}</span>
            </span>
          </WListItem>
          <div class="w-group-label">Categories</div>
        </template>
        <WListItem v-for="c in nav" :key="c.id" :active="c.id === selectedSpot?.category.id" @select="openCat(c)">
          <span class="flex items-center gap-2 w-full min-w-0">
            <img v-if="iconOf(c)" :src="iconOf(c)!" :class="$style.art" alt="">
            <i v-else :class="[c.fa, $style.fa]" aria-hidden="true" />
            <span class="w-trunc grow">{{ c.label }}</span>
            <span v-if="changedInCat(c)" :class="$style.changed" class="text-xs" :title="`You changed ${changedInCat(c)} thing(s) here`">{{ changedInCat(c) }}</span>
            <span class="w-faint text-xs w-num">{{ c.groupCount }}</span>
            <i class="fas fa-chevron-right w-faint text-xs" aria-hidden="true" />
          </span>
        </WListItem>
      </template>

      <!-- A category's chapters. -->
      <template v-else-if="!here.chapter">
        <WListItem v-for="ch in here.category.chapters" :key="ch.id" :active="ch.id === selectedSpot?.chapter.id" @select="at = { cat: here.category!.id, chapter: ch.id }">
          <span class="flex items-center gap-2 w-full min-w-0">
            <span class="w-trunc grow" :title="ch.id">{{ ch.title }}</span>
            <span v-if="changedInChapter(ch)" :class="$style.changed" class="text-xs">{{ changedInChapter(ch) }}</span>
            <span class="w-faint text-xs w-num">{{ ch.groups.length }}</span>
            <i class="fas fa-chevron-right w-faint text-xs" aria-hidden="true" />
          </span>
        </WListItem>
      </template>

      <!-- A chapter's groups. -->
      <template v-else>
        <WListItem v-for="g in here.chapter.groups" :key="g.type" :active="g.type === selType" @select="emit('select', g.type)" @contextmenu="emit('group-menu', $event, g.type)">
          <span class="flex items-center gap-2 w-full min-w-0" :class="{ [$style.off]: g.hidden }">
            <span class="w-trunc grow" :title="nameOf(g)">{{ shortGroupName(nameOf(g)) }}</span>
            <span v-if="changedIn(g.type)" :class="$style.changed" class="text-xs" :title="`You changed ${changedIn(g.type)} thing(s) here`">{{ changedIn(g.type) }}</span>
            <span class="w-faint text-xs w-num">{{ g.tiers.length }}</span>
          </span>
          <template #actions>
            <button type="button" class="w-icon-btn" :class="{ [$style.star]: isPinned(g.type) }" :title="isPinned(g.type) ? 'Unpin' : 'Pin to the top of the list'" :aria-label="`${isPinned(g.type) ? 'Unpin' : 'Pin'} ${nameOf(g)}`" @click="togglePin(g.type)"><i :class="isPinned(g.type) ? 'fas fa-star' : 'far fa-star'" aria-hidden="true" /></button>
          </template>
        </WListItem>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { WChip, WEmpty, WField, WListItem, WSegmented, gameIcon } from '../ui'
import type { GroupNode, SectionNode } from './groups'
import { allSpots, buildNav, filterNav, findSpot, levelUp, openCategory, shortGroupName } from './nav'
import type { NavCategory, NavChapter, NavMode, NavSpot } from './nav'
import type { LootFilterWidget } from './widget'

const props = defineProps<{
  tree: SectionNode[]
  selType: string | null
  config: LootFilterWidget
  changedIn: (type: string) => number
  nameOf: (g: GroupNode) => string
}>()

const emit = defineEmits<{
  (e: 'select', type: string): void
  (e: 'group-menu', ev: MouseEvent, type: string): void
}>()

const MODE_OPTIONS = [
  { value: 'endgame', label: 'Endgame' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'all', label: 'Both' }
]

const query = ref('')
const changedOnly = ref(false)
const at = ref<{ cat: string | null, chapter: string | null }>({ cat: null, chapter: null })
const listEl = ref<HTMLElement | null>(null)

const nav = computed(() => buildNav(props.tree, props.config.ruleNav.mode))
const here = computed(() => {
  const category = nav.value.find(c => c.id === at.value.cat) ?? null
  const chapter = category?.chapters.find(c => c.id === at.value.chapter) ?? null
  return { category, chapter }
})
const selectedSpot = computed(() => findSpot(nav.value, props.selType))

const changedTotal = computed(() => allSpots(nav.value).filter(s => props.changedIn(s.group.type) > 0).length)
const flatList = computed<NavSpot[] | null>(() => {
  if (query.value.trim()) {
    const found = filterNav(nav.value, query.value, props.nameOf)
    return changedOnly.value ? found.filter(s => props.changedIn(s.group.type) > 0) : found
  }
  return changedOnly.value ? allSpots(nav.value).filter(s => props.changedIn(s.group.type) > 0) : null
})

const isPinned = (type: string) => props.config.ruleNav.pins.includes(type)
const pinned = computed(() => props.config.ruleNav.pins.flatMap(type => findSpot(nav.value, type) ?? []))

function togglePin (type: string) {
  const pins = props.config.ruleNav.pins
  props.config.ruleNav.pins = pins.includes(type) ? pins.filter(p => p !== type) : [...pins, type]
}

function setMode (mode: string) {
  props.config.ruleNav.mode = mode as NavMode
}

function changedInChapter (ch: NavChapter): number {
  return ch.groups.reduce((n, g) => n + props.changedIn(g.type), 0)
}
function changedInCat (c: NavCategory): number {
  return c.chapters.reduce((n, ch) => n + changedInChapter(ch), 0)
}

function iconOf (c: NavCategory): string | null {
  return c.icon ? gameIcon(c.icon.name, c.icon.ns) : null
}

function openCat (c: NavCategory) {
  at.value = openCategory(c)
}

function pick (s: NavSpot) {
  query.value = ''
  changedOnly.value = false
  at.value = { cat: s.category.id, chapter: s.chapter.id }
  emit('select', s.group.type)
}

// Only the first time: after that, where you are is where you went.
let revealed = false

// Coming from elsewhere (an item's rule, a link), show where that group lives.
// One the switch is hiding brings everything back, or you'd lose your place.
watch(() => props.selType, (type) => {
  if (!type || type.startsWith('woke->rule')) return
  if (!findSpot(nav.value, type) && findSpot(buildNav(props.tree, 'all'), type)) props.config.ruleNav.mode = 'all'
  const spot = findSpot(nav.value, type)
  if (spot) {
    at.value = { cat: spot.category.id, chapter: spot.chapter.id }
    revealed = true
  }
}, { immediate: true })

// The group's own tree can arrive after the selection. The switch can also empty
// the category you're in, or change its chapters.
watch(nav, (list) => {
  const cat = list.find(c => c.id === at.value.cat)
  if (at.value.cat && !cat) at.value = { cat: null, chapter: null }
  else if (cat && (at.value.chapter ? !cat.chapters.some(c => c.id === at.value.chapter) : cat.chapters.length === 1)) at.value = openCategory(cat)
  else if (!at.value.cat && props.selType && !revealed) {
    const spot = findSpot(list, props.selType)
    if (spot) { at.value = { cat: spot.category.id, chapter: spot.chapter.id }; revealed = true }
  }
})

function goUp () {
  at.value = levelUp(nav.value, at.value)
}

// Up and Down walk the rows, Left and Backspace go up a level.
function onKey (e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  const typing = t?.tagName === 'INPUT'
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const rows = [...(listEl.value?.querySelectorAll<HTMLElement>('button:not(.w-icon-btn)') ?? [])]
    if (!rows.length) return
    e.preventDefault()
    const i = rows.indexOf(document.activeElement as HTMLElement)
    const next = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
    rows[next].focus()
    return
  }
  if (typing) return
  if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
    e.preventDefault()
    goUp()
  } else if (e.key === 'ArrowRight' && t?.tagName === 'BUTTON') {
    e.preventDefault()
    t.click()
  }
}
</script>

<style module>
.nav {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.tools {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 6px 6px;
  border-bottom: 1px solid var(--w-line);
}
.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px;
  padding: 4px 8px;
  font-size: var(--w-text-sm);
  border-bottom: 1px solid var(--w-line-soft);
}
.crumb {
  background: none;
  border: 0;
  padding: 0;
  color: var(--w-accent);
  cursor: pointer;
}
.crumb:hover { text-decoration: underline; }
.list {
  flex: 1;
  min-height: 0;
}
.art { width: 22px; height: 22px; object-fit: contain; flex: none; }
.fa { width: 22px; text-align: center; flex: none; color: var(--w-dim); }
.star { color: var(--w-accent); }
.changed { color: var(--w-warn); white-space: nowrap; }
.off { opacity: 0.5; }
</style>
