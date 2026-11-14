<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <DockItem id="fates" title="Fates" :show="!!advice" :menu="dockMenu" :wm-id="config.wmId" card-width="22rem">
      <template #card>
        <div v-if="advice" class="w-dim text-xs px-3 pt-2">{{ headline }}</div>
        <FateRows v-if="advice" :rows="advice.rows" />
      </template>
    </DockItem>
    <WPanel :title="config.wmTitle || 'Fates'" icon="/images/fates/covens.png" width="24rem">
      <template #actions>
        <button type="button" class="w-icon-btn" title="Read the Fate window on screen" @click="read()"><i class="fas fa-eye" /></button>
      </template>
      <div v-if="status" class="w-dim text-xs px-3 pt-2">{{ status }}</div>
      <template v-if="advice">
        <div class="w-dim text-xs px-3 pt-2">{{ headline }}</div>
        <FateRows :rows="advice.rows" />
      </template>
      <WEmpty v-else :art="{ mechanic: 'covens' }">
        Open a Fate pick or Invoke Fates in game, then press <WKbd v-if="config.hotkey" :keys="config.hotkey" /><template v-else>the read button</template>.
      </WEmpty>
    </WPanel>
    <Teleport to="body">
      <div v-if="advice && shown" :class="$style.layer">
        <div v-for="(m, i) in advice.marks" :key="i" :class="[$style.mark, m.rank === 1 && $style.take, !m.allowed && $style.no]" :style="markStyle(m)">
          <template v-if="m.rank === 1">Take</template>
          <template v-else-if="m.rank">#{{ m.rank }}</template>
          <template v-else-if="m.label">{{ m.label }}</template>
          <template v-else>Skip</template>
          <div v-if="m.rank && m.reasons.length" :class="$style.why">{{ m.reasons.join(' · ') }}</div>
        </div>
        <div :class="$style.side" :style="sideStyle">
          <div :class="$style.sideHead">{{ headline }}</div>
          <FateRows :rows="advice.rows" />
          <div v-if="advice.placed" :class="$style.note">
            Fates already in the slots aren't counted: their rewards aren't shown. Take them out and read again.
          </div>
        </div>
      </div>
    </Teleport>
  </Widget>
</template>

<script lang="ts">
import { widgetFatesSpec } from '../widget-specs'

export default { widget: widgetFatesSpec }
</script>

<script setup lang="ts">
import { computed, onUnmounted, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WEmpty, WKbd, toast } from '../ui'
import { hostRequest } from '../shared/host'
import DockItem from '../dock/DockItem.vue'
import type { DockMenuAction } from '../dock/dock'
import FateRows from './FateRows.vue'
import { adviseFates, knownRewards, rememberHover } from './advice'
import type { CardMark, FateAdvice } from './advice'
import { normalizeFatesWidget, parseFatesHotkeyTarget } from './widget'
import type { FateRead, FatesWidget } from './widget'

const props = defineProps<{ config: FatesWidget }>()
normalizeFatesWidget(props.config)

// While the marks are up, a quick look at the screen this often: they go when
// the Fate window closes, and are read again when cards move (a click into a
// slot). Nothing runs while they're down.
const WATCH_MS = 400
// Two looks without cards in a row before hiding, so one odd frame (a tooltip
// over the cards) doesn't take them down.
const GONE_LOOKS = 2

const advice = shallowRef<FateAdvice | null>(null)
const shown = shallowRef(false)
const status = shallowRef('')
let watchTimer: ReturnType<typeof setTimeout> | undefined
// The cards' layout as the looks see it, marks showing. Set by the first look
// after a read: the read's own capture is taken with the marks down, which
// looks different, and comparing the two re-read the window over and over.
let lastSig: string | null = null
// A changed layout is read again only once it holds still for a look: cards
// slide in when a window opens, and each read takes the marks down briefly.
let pendingSig = ''
let gone = 0

const headline = computed(() => {
  const a = advice.value
  if (!a) return ''
  if (a.window === 'pick') return 'Pick: best Fate to take, and what you could invoke with it'
  return a.rows.length ? 'Click your Fates in this order (C1 is the leftmost)' : 'Invoke: nothing worth invoking'
})

// The capture copies the desktop, overlay included: the marks come down for a
// couple of frames so they aren't read as cards or as a reward's tooltip.
async function clearScreen () {
  if (!shown.value) return
  shown.value = false
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30))))
}

async function read (quiet = false) {
  if (!quiet) status.value = 'Reading the screen…'
  try {
    const wasShown = shown.value
    await clearScreen()
    // The hotkey sweeps the gear rewards' tooltips; refreshes while you click
    // cards into slots don't move your cursor.
    const res = await hostRequest('fate-read', { uiScale: props.config.uiScale, sweep: !quiet, known: knownRewards() }) as FateRead & { sig?: string }
    if (!res.found && wasShown && quiet) { shown.value = true; watch(); return }
    if (!res.found) {
      hide()
      if (!quiet) {
        status.value = 'No Fate window found. Open a Fate pick or Invoke Fates first.'
        toast('No Fate window on screen')
      }
      return
    }
    const learned = rememberHover(res)
    advice.value = adviseFates(res, { values: props.config.values, maxTier: props.config.maxTier, slots: props.config.slots, modValues: props.config.modValues })
    status.value = ''
    if (learned && !quiet) toast(learned)
    shown.value = true
    lastSig = null
    pendingSig = ''
    gone = 0
    watch()
  } catch (err) {
    status.value = `Couldn't read the screen: ${(err as Error).message}`
  }
}

function hide () {
  shown.value = false
  clearTimeout(watchTimer)
}

function watch () {
  clearTimeout(watchTimer)
  watchTimer = setTimeout(() => {
    if (!shown.value) return
    hostRequest('fate-glance', { uiScale: props.config.uiScale })
      .then(({ sig }) => {
        if (!shown.value) return
        // null: the game isn't in front, so the screen says nothing.
        if (sig === '') {
          if (++gone >= GONE_LOOKS) { hide(); return }
        } else if (sig !== null && lastSig === null) {
          gone = 0
          lastSig = sig
        } else if (sig !== null) {
          gone = 0
          if (sig !== lastSig) {
            if (sig === pendingSig) { pendingSig = ''; read(true).catch(() => {}); return }
            pendingSig = sig
          } else {
            pendingSig = ''
          }
        }
        watch()
      })
      .catch(() => { watch() })
  }, WATCH_MS)
}

// Hotkey: read the window, hovering each gear reward for its modifier. The
// marks go by themselves when the window closes.
function onHotkey () {
  read().catch(() => {})
}

function markStyle (m: CardMark) {
  // Above the card's top edge, centred on it.
  const top = m.card.y - m.card.width * 0.72
  return { left: `${m.card.x * 100}%`, top: `${Math.max(0, top) * 100}%` }
}

// Beside the cards, on whichever side has room.
const sideStyle = computed(() => {
  const cards = advice.value?.marks.map(m => m.card) ?? []
  if (!cards.length) return {}
  const right = Math.max(...cards.map(c => c.x + c.width / 2))
  const left = Math.min(...cards.map(c => c.x - c.width / 2))
  const top = Math.min(...cards.map(c => c.y - c.width * 0.7))
  return right < 0.72
    ? { left: `${(right + 0.012) * 100}%`, top: `${top * 100}%` }
    : { right: `${(1 - left + 0.012) * 100}%`, top: `${top * 100}%` }
})

const hotkeys = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  if (parseFatesHotkeyTarget(e.target) === props.config.wmId) onHotkey()
})

onUnmounted(() => {
  hotkeys.abort()
  clearTimeout(watchTimer)
})

const dockMenu = computed<DockMenuAction[]>(() => [
  { label: 'Read the Fate window', icon: 'fas fa-eye', action: () => { read().catch(() => {}) } },
  { label: 'Clear', icon: 'fas fa-broom', disabled: !advice.value, action: () => { advice.value = null; hide() } }
])
</script>

<style module>
.layer { position: fixed; inset: 0; pointer-events: none; z-index: 1000; }
.mark {
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 2px 10px;
  background: var(--w-panel);
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-r-md);
  box-shadow: var(--w-shadow);
  font-family: var(--w-heading, var(--w-body));
  font-size: var(--w-fs-md);
  color: var(--w-fg);
  text-align: center;
  white-space: nowrap;
}
.mark.take { color: var(--w-accent-fg); background: var(--w-up); border-color: var(--w-up); font-weight: 600; }
.mark.no { color: var(--w-dim); }
.why { max-width: 15rem; white-space: normal; font-size: var(--w-fs-xs); font-weight: 400; }
.side {
  position: absolute;
  width: 22rem;
  background: var(--w-panel);
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-r-md);
  box-shadow: var(--w-shadow);
  font-family: var(--w-body);
  color: var(--w-fg);
}
.sideHead { padding: 6px var(--w-pad); font-size: var(--w-fs-sm); color: var(--w-dim); border-bottom: 1px solid var(--w-line); }
.note { padding: 6px var(--w-pad); font-size: var(--w-fs-xs); color: var(--w-warn, var(--w-dim)); }
</style>
