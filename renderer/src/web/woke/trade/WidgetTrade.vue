<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <!-- While you play: an icon with a badge for open offers that peeks when
         one arrives (A1); resting on it opens the offers with buttons (B1). -->
    <DockItem ref="dockRef" id="trade" title="Trades" :show="shown.length > 0"
      :badge="sellCount || null" :tone="anyInArea ? 'up' : 'accent'" :led="book.afk ? 'warn' : null" :wm-id="config.wmId"
      card-width="23rem" interactive @open-change="onCard">
      <template #card>
        <div v-if="book.afk" class="text-xs" style="padding: 2px var(--w-pad); color: var(--w-warn);">You're AFK: buyers get your autoreply.</div>
        <OfferRow v-for="o in shown" :key="o.id" :offer="o" :expanded="o.id === expandedId" :now="now"
          :step-key="o.id === frontId ? config.stepHotkey : null" :value="valueText(o)" :delta="deltaOf(o)" :art="artFor(o)"
          @expand="expand(o)" @reply="reply(o, $event)" @traded="traded(o)" @dismiss="dismissOffer(o)" />
        <div class="w-faint text-xs" style="padding: 4px var(--w-pad) 6px;">
          <template v-if="config.stepHotkey"><WKbd :keys="config.stepHotkey" /> next step for the top offer</template>
          <template v-else>Set a "next step" key in Settings → Trade assistant to answer without the mouse.</template>
        </div>
      </template>
    </DockItem>

    <WPanel ref="panel" :title="config.wmTitle || 'Trades'" icon="divine" width="26rem" max-height="70vh" :hotkey="config.stepHotkey">
      <template v-if="log.error.value" #banner>
        <WBanner>Couldn't read the sales log: {{ log.error.value }}
          <template #actions><WButton size="sm" @click="log.load(true)">Retry</WButton></template>
        </WBanner>
      </template>
      <template #tabs>
        <WTabs v-model="config.tab" :options="tabOptions" />
      </template>

      <template v-if="config.tab === 'offers'">
        <WEmpty v-if="!shown.length" :art="{ currency: 'divine' }">
          No open offers. Trade whispers you get (and send) show up here and in the trade icon while you play.
        </WEmpty>
        <OfferRow v-for="o in shown" :key="o.id" :offer="o" :expanded="o.id === expandedId" :now="now"
          :step-key="o.id === frontId ? config.stepHotkey : null" :value="valueText(o)" :delta="deltaOf(o)" :art="artFor(o)"
          @expand="expand(o)" @reply="reply(o, $event)" @traded="traded(o)" @dismiss="dismissOffer(o)" />
      </template>

      <template v-else>
        <div :class="$style.totals">
          <div><span class="w-dim">Today</span> <b class="w-num" :class="net(today) >= 0 ? 'w-up' : 'w-down'">{{ signed(net(today)) }}</b></div>
          <div class="w-dim text-xs">
            League: sold <span class="w-num">{{ money(league.sold) }}</span> ({{ league.sales }}) · spent <span class="w-num">{{ money(league.spent) }}</span> ({{ league.buys }})
            <span v-if="league.unpriced" :title="'No poe.ninja price when they happened, so they are left out of the sums'"> · {{ league.unpriced }} unpriced</span>
          </div>
        </div>
        <WSkeleton v-if="!log.loaded.value && !log.error.value" :rows="4" />
        <WEmpty v-else-if="!leagueTrades.length" :art="{ currency: 'chaos' }">
          Nothing traded this league yet. A trade is logged when the trade window completes with a buyer from your offers.
        </WEmpty>
        <div v-else :class="$style.log">
          <div v-for="t in leagueTrades.slice(0, 200)" :key="t.id" class="w-row" :class="$style.logRow" @contextmenu="logMenu($event, t)">
            <span class="w-faint w-num">{{ timeOf(t.at) }}</span>
            <span class="w-trunc">{{ offerLabel({ item: t.item, qty: t.qty, bulk: t.qty !== 1 }) }}</span>
            <span class="w-dim w-trunc text-xs">{{ t.dir === 'sell' ? t.who : `from ${t.who}` }}</span>
            <span class="w-num text-right whitespace-nowrap" :class="t.dir === 'sell' ? 'w-up' : 'w-down'">{{ t.dir === 'sell' ? '+' : '−' }}{{ priceLabel(t.price) }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <span>{{ config.tab === 'offers' ? 'Replies send one chat line per click' : 'Right-click a trade to remove it' }}</span>
      </template>
    </WPanel>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '@/web/overlay/interfaces'
import { TRADE_TYPE } from './widget'
import type { TradeWidget } from './widget'

export default {
  widget: {
    type: TRADE_TYPE,
    instances: 'multi',
    trNameKey: 'Trade assistant'
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { computed, inject, nextTick, onUnmounted, reactive, shallowRef, watch } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { AppConfig } from '@/web/Config'
import type { WidgetManager } from '@/web/overlay/interfaces'
import Widget from '@/web/overlay/Widget.vue'
import { WPanel, WTabs, WEmpty, WButton, WBanner, WSkeleton, WKbd, openMenu, toast } from '../ui'
import { gameIcon } from '../ui/game-icons'
import DockItem from '../dock/DockItem.vue'
import { hideWhilePlaying } from '../dock/dock'
import { usePriceIndex } from '../market/price-index'
import { priceResolver } from '../boss-runs/calc'
import { useLeagues } from '@/web/background/Leagues'
import { logTail } from '../campaign/log-tail'
import { onGameLog } from '../shared/game-log'
import OfferRow from './OfferRow.vue'
import { applyEvent, dismiss, front, markSent, markTraded, newBook, prune, queue, recordFor, skip } from './book'
import type { Offer, TradeBook, TradeRecord } from './book'
import { DEFAULT_REPLIES, parseHotkeyTarget, replyText } from './widget'
import type { ReplyId } from './widget'
import { offerLabel, parseTradeLine, priceLabel } from './whispers'
import { bulkDelta, formatValue, priceChaos } from './value'
import { tradeTotals, tradesInRange, useTradeLog } from './log-store'

const props = defineProps<{
  config: TradeWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.wmTitle = 'Trades'
  props.config.anchor = { pos: 'tr', x: 98, y: 15 }
  props.config.stepHotkey ??= null
  props.config.busyHotkey ??= null
  props.config.skipHotkey ??= null
  props.config.replies ??= { ...DEFAULT_REPLIES }
  props.config.ping ??= true
  props.config.trackBuying ??= true
  props.config.tab ??= 'offers'
  wm.show(props.config.wmId)
}
props.config.replies ??= { ...DEFAULT_REPLIES }
props.config.tab ??= 'offers'
hideWhilePlaying(props.config)

const book = reactive<TradeBook>(newBook())
const log = useTradeLog()
log.load()

// --- Prices ---
const prices = usePriceIndex()
const divine = computed(() => prices.snapshot.value?.divine ?? null)
const px = computed(() => {
  const r = priceResolver(prices.snapshot.value?.items ?? [])
  return { price: (name: string) => name === 'Chaos Orb' ? 1 : r.price(name) }
})
function valueText (o: Offer): string | null {
  const c = priceChaos(o.price, px.value)
  if (c == null) return null
  const text = formatValue(c, divine.value)
  // "120 div" next to a price of "120 div" says nothing.
  return text === priceLabel(o.price) ? null : text
}
function deltaOf (o: Offer): number | null {
  return bulkDelta(o, px.value)
}
// Item art: bulk currency by name; uniques by their name without the base.
function artFor (o: Offer): string | null {
  if (o.bulk) return gameIcon(o.item)
  const words = o.item.replace(/^level \d+ \d+% /, '').split(' ')
  for (let n = words.length; n >= 1 && n >= words.length - 3; n--) {
    const name = words.slice(0, n).join(' ')
    const art = gameIcon(name, 'UNIQUE') ?? gameIcon(name, 'GEM')
    if (art) return art
  }
  return null
}

// --- Offers ---
const shown = computed(() => {
  const open = queue(book).filter(o => props.config.trackBuying !== false || o.dir === 'sell')
  const closed = book.offers.filter(o => o.closed && o.closed !== 'expired').sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
  return [...open, ...closed]
})
const frontOffer = computed(() => shown.value.find(o => !o.closed) ?? null)
const frontId = computed(() => frontOffer.value?.id ?? null)
const sellCount = computed(() => shown.value.filter(o => !o.closed && o.dir === 'sell').length)
const anyInArea = computed(() => shown.value.some(o => !o.closed && o.inArea))

// The front offer is open; another one opens when clicked.
const picked = shallowRef<string | null>(null)
const expandedId = computed(() => {
  const p = picked.value && shown.value.find(o => o.id === picked.value && !o.closed)
  return p ? p.id : frontId.value
})
function expand (o: Offer) {
  picked.value = expandedId.value === o.id && o.id !== frontId.value ? null : o.id
}

const now = shallowRef(Date.now())
// Ticks only while there are offers to age (the perf checks count wakeups
// while you play).
let clock: ReturnType<typeof setInterval> | undefined
watch(() => book.offers.length > 0, (any) => {
  clearInterval(clock)
  clock = undefined
  if (any) {
    clock = setInterval(() => {
      now.value = Date.now()
      prune(book, now.value)
    }, 1000)
  }
}, { immediate: true })

// --- Client.txt ---
const dockRef = shallowRef<InstanceType<typeof DockItem> | null>(null)
const panel = shallowRef<InstanceType<typeof WPanel> | null>(null)
const seenAtStart = new Set<string>()

function handle (line: string, live: boolean) {
  const ev = parseTradeLine(line, Date.now(), AppConfig().language)
  if (!ev) return
  // Live lines use this computer's clock, so offers age the same way
  // whatever the log's clock says. Trades keep the log's time: it names
  // them, so reading the same lines again after a restart finds the same trade.
  const lineAt = ev.at
  if (live) ev.at = Date.now()
  if (ev.kind === 'whisper-out' && ev.offer && props.config.trackBuying === false) return
  const res = applyEvent(book, ev)
  if (res.finished) logTrade(res.finished, lineAt, false)
  if (res.added && live) announce(res.added)
  now.value = Date.now()
}

function announce (o: Offer) {
  if (o.dir !== 'sell') return
  if (props.config.ping !== false) ping()
  nextTick(() => dockRef.value?.peek(`${o.who}: ${offerLabel(o)} · ${priceLabel(o.price)}`))
}

// Lines handled live before the start-up read came back: that read (it
// retries for a few seconds while the log watcher starts) can hold them too.
let replayed = false
const seenLive = new Set<string>()

onGameLog((lines) => {
  for (const { line } of lines) {
    if (seenAtStart.has(line)) continue
    if (!replayed) seenLive.add(line)
    handle(line, true)
  }
})

// After a restart, pick up offers from the last half hour of Client.txt.
logTail().then(tail => {
  const since = Date.now() - 30 * 60_000
  const until = Date.now() + 60_000
  for (const line of tail.lines) {
    if (seenLive.has(line)) continue
    const ev = parseTradeLine(line, 0, AppConfig().language)
    if (!ev || ev.at < since || ev.at > until) continue
    // The same line may also arrive live if it was written as the app
    // started: count it once.
    seenAtStart.add(line)
    handle(line, false)
  }
  prune(book, Date.now())
}).catch(() => {}).finally(() => {
  replayed = true
  seenLive.clear()
})

function ping () {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    // Each context holds an audio thread until it's closed.
    osc.onended = () => { ctx.close().catch(() => {}) }
  } catch {}
}

// --- Replies ---
function send (text: string) {
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'paste-in-chat', text, immediate: true }
  })
}

// The app drops a chat line typed while the previous one is still going
// out (it guards the clipboard), so presses closer than this are ignored
// rather than moving the offer on without a message sent.
const MIN_GAP_MS = 500
let lastSentAt = 0

function reply (o: Offer, id: ReplyId) {
  if (Date.now() - lastSentAt < MIN_GAP_MS) return
  const text = replyText(props.config.replies ?? DEFAULT_REPLIES, o, id)
  if (!text) {
    toast('That reply has no text. Set it in Settings → Trade assistant.', { anchor: panel.value?.$el })
    return
  }
  lastSentAt = Date.now()
  send(text)
  markSent(book, o, id, Date.now())
  if (picked.value === o.id && o.closed) picked.value = null
}

function traded (o: Offer) {
  const t = markTraded(o, Date.now())
  if (t) logTrade(t, Date.now(), true)
}

function dismissOffer (o: Offer) {
  dismiss(o, Date.now())
  toast(`Removed ${o.who}'s offer`, {
    anchor: panel.value?.$el,
    undo: () => { o.closed = null; o.closedAt = null }
  })
}

function logTrade (o: Offer, at: number, manual: boolean) {
  const chaos = priceChaos(o.price, px.value)
  const rec = recordFor(o, at, chaos, divine.value, manual)
  // Filed under the league the toolkit follows, like farming sessions.
  if (leagueId.value) rec.league = leagueId.value
  log.add(rec).catch((err: Error) => toast(`Couldn't save the trade: ${err.message}`))
}

// --- Hotkeys (C1): one key walks the front offer through its steps ---
const hotkeys = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
  const parsed = parseHotkeyTarget(e.target)
  if (!parsed || parsed.wmId !== props.config.wmId) return
  const o = front(book)
  if (!o || (o.dir === 'buy' && props.config.trackBuying === false)) return
  if (parsed.what === 'skip') {
    skip(o, Date.now())
    const next = front(book)
    if (next && next !== o) dockRef.value?.peek(`Next: ${next.who}, ${offerLabel(next)}`, 2500)
    return
  }
  if (parsed.what === 'busy') {
    if (o.dir === 'sell') reply(o, 'busy')
    return
  }
  const steps = o.dir === 'sell' ? ['invite', 'trade', 'thanks', 'kick'] as const : ['hideout', 'thanks'] as const
  const step = steps[o.step]
  if (step) reply(o, step)
})

function onCard (open: boolean) {
  if (open) now.value = Date.now()
}

onUnmounted(() => {
  hotkeys.abort()
  clearInterval(clock)
})

// --- Log tab ---
const leagues = useLeagues()
const leagueId = computed(() => leagues.selectedId.value ?? '')
const leagueTrades = computed(() => {
  const all = log.trades.value
  // Before the league is known (or with nothing in it yet), show everything.
  const mine = tradesInRange(all, 'league', leagueId.value, now.value)
  return mine.length ? mine : all
})
const today = computed(() => tradeTotals(tradesInRange(leagueTrades.value, 'today', leagueId.value, now.value)))
const league = computed(() => tradeTotals(leagueTrades.value))
const net = (t: { sold: number, spent: number }) => t.sold - t.spent
function money (chaos: number): string {
  return formatValue(chaos, divine.value) || '0 c'
}
function signed (chaos: number): string {
  return `${chaos >= 0 ? '+' : '−'}${money(Math.abs(chaos))}`
}
function timeOf (ts: number): string {
  const d = new Date(ts)
  const sameDay = new Date().toDateString() === d.toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const tabOptions = computed(() => [
  { value: 'offers', label: 'Offers', count: shown.value.filter(o => !o.closed).length },
  { value: 'log', label: 'Log' }
])

function logMenu (e: MouseEvent, t: TradeRecord) {
  openMenu(e, [{
    label: 'Remove from the log',
    icon: 'fas fa-trash',
    danger: true,
    action: () => {
      log.remove(t).catch(() => {})
      toast('Removed from the log', { anchor: panel.value?.$el, undo: () => { log.add(t).catch(() => {}) } })
    }
  }])
}
</script>

<style module>
.totals { display: flex; flex-direction: column; gap: 2px; padding: 6px var(--w-pad); border-bottom: 1px solid var(--w-line); }
.log { display: flex; flex-direction: column; }
.logRow { display: grid; grid-template-columns: 3.2rem minmax(0, 1fr) minmax(0, 7rem) auto; gap: 6px; align-items: center; padding: 0 var(--w-pad); }
</style>
