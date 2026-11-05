<script setup>
// The landing page (index.md, layout: landing), in the overlay's Hybrid gold:
// a short hero, then the tool tour (the overlay's rail beside one tool in
// action), a note that every tool is a module, the headline features as
// cards, install, FAQ.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { MODULES, PRESETS } from '../../../../renderer/src/web/woke/modules.ts'
import { REPO, DOWNLOAD, HERO_FACTS, TOUR, FEATURES, MORE, INSTALL, FAQ } from './content.js'

const shot = (name) => withBase(`/shots/${name}.webp`)
const iconOf = (id) => MODULES.find(m => m.id === id)?.icon.fa ?? 'fas fa-circle'

const toolkit = MODULES.filter(m => m.group !== 'apt')

// ---- the tour ----
const stops = TOUR.flatMap(g => g.stops)
const current = ref(0)
const stop = computed(() => stops[current.value])
// Pictures load as they're reached (and the next one ahead), not all at once.
const loaded = ref(new Set([0, 1]))
const railEl = ref(null)
let timer = null

function go (i, user = true) {
  const n = (i + stops.length) % stops.length
  current.value = n
  loaded.value = new Set([...loaded.value, n, (n + 1) % stops.length])
  if (user) stopAuto()
  // Keep the picked tool in view in the rail (it scrolls sideways on a phone).
  const btn = railEl.value?.querySelector(`[data-stop="${stops[n].id}"]`)
  btn?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  if (user) btn?.focus({ preventScroll: true })
}
function stopAuto () { clearInterval(timer); timer = null }
function onRailKey (e) {
  const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
  if (next == null) return
  e.preventDefault()
  go(current.value + next)
}
onMounted(() => {
  // Steps by itself until the visitor picks a tool; never with reduced motion.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timer = setInterval(() => go(current.value + 1, false), 6500)
  }
})
onBeforeUnmount(stopAuto)

// ---- modules note: pick a preset to see what it switches on ----
const presets = PRESETS.filter(p => p.id !== 'price-check-only')
const preset = ref('mapper')
const presetOn = computed(() => {
  const p = PRESETS.find(p => p.id === preset.value)
  return p.on === 'all' ? null : new Set(p.on)
})
const isOn = (id) => presetOn.value == null || presetOn.value.has(id)
</script>

<template>
  <div class="landing">
    <div class="glow" aria-hidden="true"></div>
    <header class="nav">
      <div class="wrap nav-inner">
        <a class="word" :href="withBase('/')"><img :src="withBase('/favicon.png')" alt="" width="24" height="24">Woke PoE Trade</a>
        <nav class="nav-links" aria-label="Page">
          <a href="#tour">Tour</a>
          <a href="#features">Features</a>
          <a href="#install">Install</a>
          <a :href="withBase('/quick-start')">Help</a>
          <a :href="REPO">GitHub</a>
        </nav>
        <a class="btn sm" :href="DOWNLOAD">Download</a>
      </div>
    </header>

    <main>
      <section class="wrap hero" aria-labelledby="hero-title">
        <h1 id="hero-title" class="display">Price check, plan maps and track profit <span>without leaving the game.</span></h1>
        <p class="lede">An overlay for Path of Exile 1, built on Awakened PoE Trade. {{ toolkit.length }} tools on one rail at the edge of your screen.</p>
        <div class="cta">
          <a class="btn" :href="DOWNLOAD">Download for Windows</a>
          <!-- target keeps VitePress's router off: the demo is its own page. -->
          <a class="ghost" :href="withBase('/demo/')" target="_self">Try it in your browser</a>
        </div>
        <p class="facts"><span v-for="f in HERO_FACTS" :key="f">{{ f }}</span></p>
      </section>

      <section id="tour" class="wrap tour-wrap" aria-label="Tool tour">
        <div class="tour" @pointerdown="stopAuto">
          <nav ref="railEl" class="rail" aria-label="Tools" @keydown="onRailKey">
            <template v-for="g in TOUR" :key="g.group">
              <span class="rail-group">{{ g.group }}</span>
              <button v-for="s in g.stops" :key="s.id" type="button" :data-stop="s.id"
                :aria-current="stop.id === s.id" :tabindex="stop.id === s.id ? 0 : -1"
                @click="go(stops.indexOf(s))">
                <span class="ic" aria-hidden="true"><i :class="iconOf(s.module)"></i></span>{{ s.label }}
              </button>
            </template>
          </nav>
          <figure class="stage">
            <template v-for="(s, i) in stops" :key="s.id">
              <img v-if="loaded.has(i)" :src="shot(s.shot)" :alt="s.alt" :class="{ on: current === i }" :aria-hidden="current !== i" width="1600" height="900">
            </template>
            <figcaption class="cap" aria-live="polite">
              <b>{{ stop.title }}</b>
              <span>{{ stop.text }}</span>
            </figcaption>
            <div class="arrows">
              <button type="button" aria-label="Previous tool" @click="go(current - 1)"><i class="fas fa-chevron-left"></i></button>
              <button type="button" aria-label="Next tool" @click="go(current + 1)"><i class="fas fa-chevron-right"></i></button>
            </div>
          </figure>
        </div>
        <p class="tour-note">Every picture is the real overlay over a real game frame.</p>
      </section>

      <section id="features" class="section" aria-labelledby="features-title">
        <div class="wrap">
          <div class="modnote">
            <div class="modnote-copy">
              <strong>Every tool is a module.</strong>
              <span>Switch off what you don't play: it leaves the rail, frees its hotkeys and stops loading. Pick how you play:</span>
            </div>
            <div class="presets" role="group" aria-label="Presets">
              <button v-for="p in presets" :key="p.id" type="button" class="preset" :aria-pressed="preset === p.id" @click="preset = p.id">{{ p.label }}</button>
            </div>
            <ul class="toggles" aria-label="Modules in this preset">
              <li v-for="m in toolkit" :key="m.id" :class="{ off: !isOn(m.id) }"><span class="sw" aria-hidden="true"></span>{{ m.name }}<span class="sr">{{ isOn(m.id) ? ' (on)' : ' (off)' }}</span></li>
            </ul>
          </div>

          <h2 id="features-title" class="display title">What it does</h2>
          <div class="bento">
            <article v-for="(f, i) in FEATURES" :key="f.title" class="card" :class="i < 4 ? 'big' : 'mid'">
              <img :src="shot(f.shot)" :alt="f.alt" width="1600" height="900" loading="lazy">
              <div class="card-text">
                <span class="n">{{ String(i + 1).padStart(2, '0') }}</span>
                <h3>{{ f.title }}</h3>
                <p>{{ f.text }}</p>
                <ul v-if="f.points"><li v-for="pt in f.points" :key="pt">{{ pt }}</li></ul>
              </div>
            </article>
            <div class="more">
              <b>And more</b>
              <span v-for="m in MORE" :key="m" class="chip">{{ m }}</span>
            </div>
          </div>
          <p class="apt">Plus everything from Awakened PoE Trade: price check, item info, wiki and poedb lookups, Craft of Exile, and heist gem reading.</p>
        </div>
      </section>

      <section id="install" class="section" aria-labelledby="install-title">
        <div class="wrap">
          <h2 id="install-title" class="display title">Running in a minute</h2>
          <ol class="install">
            <li v-for="(s, i) in INSTALL" :key="s.title">
              <span class="n">Step {{ i + 1 }}</span>
              <h3>{{ s.title }}</h3>
              <p>{{ s.text }}</p>
            </li>
          </ol>
          <div class="cta">
            <a class="btn" :href="DOWNLOAD">Download for Windows</a>
            <a class="ghost" :href="withBase('/quick-start')">Read the quick start</a>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="faq-title">
        <div class="wrap">
          <h2 id="faq-title" class="display title">Questions</h2>
          <div class="faq">
            <details v-for="(f, i) in FAQ" :key="f.q" :open="i === 0">
              <summary>{{ f.q }}</summary>
              <p>{{ f.a }}</p>
            </details>
          </div>
        </div>
      </section>
    </main>

    <footer class="foot">
      <div class="wrap foot-inner">
        <span>Built on <a href="https://github.com/SnosMe/awakened-poe-trade">Awakened PoE Trade</a> by SnosMe. Not affiliated with or endorsed by Grinding Gear Games.</span>
        <span class="foot-links"><a :href="REPO">GitHub</a><a :href="withBase('/faq')">FAQ</a><a :href="`${REPO}/blob/master/LICENSE`">MIT licence</a></span>
      </div>
    </footer>
  </div>
</template>

<style>
@import '@fontsource-variable/bricolage-grotesque/index.css';
@import '@fontsource-variable/geist/index.css';
/* The overlay's own icon font, for the rail. */
@import '../../../../renderer/node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css';
@import '../../../../renderer/node_modules/@fortawesome/fontawesome-free/css/solid.min.css';
</style>

<style scoped>
/* Hybrid gold on warm black, the overlay's own palette (renderer/src/web/woke/ui/theme.css). */
.landing {
  --bg: #0d0b09;
  --panel: #15120f;
  --panel-2: #1d1a16;
  --panel-3: #29241d;
  --line: rgba(212, 166, 74, 0.16);
  --line-strong: rgba(212, 166, 74, 0.38);
  --fg: #efe8db;
  --dim: #bdb3a3;
  --faint: #8a7f70;
  --gold: #d4a64a;
  --gold-hi: #f0c66e;
  --gold-fg: #17130c;
  --font-display: 'Bricolage Grotesque Variable', 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Geist Variable', 'Segoe UI', system-ui, sans-serif;
  --measure: 1180px;
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font: 16px/1.6 var(--font-body);
  overflow-x: clip;
  isolation: isolate;
  color-scheme: dark;
}
.landing a { color: inherit; }
/* :where() keeps the reset at zero specificity, so the classes below win. */
:where(.landing) :where(h1, h2, h3, p, ol, ul, figure) { margin: 0; padding: 0; }
:where(.landing) :where(ol, ul) { list-style: none; }
.glow {
  position: absolute;
  z-index: -1;
  top: -360px;
  right: -200px;
  width: min(1100px, 120vw);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(138, 75, 28, 0.55), transparent);
  pointer-events: none;
}
.wrap {
  max-width: var(--measure);
  margin: 0 auto;
  padding-left: max(20px, env(safe-area-inset-left, 0px));
  padding-right: max(20px, env(safe-area-inset-right, 0px));
}
.display {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.98;
  text-wrap: balance;
}

/* ---------- nav ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-block: 10px;
  background: color-mix(in oklab, var(--bg) 78%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.word {
  display: flex;
  align-items: center;
  gap: 10px;
  font: 800 21px var(--font-display);
  letter-spacing: -0.04em;
  text-decoration: none;
}
.nav-links { display: flex; gap: 4px; }
.nav-links a {
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 15px;
  color: var(--dim);
  text-decoration: none;
}
.nav-links a:hover, .nav-links a:focus-visible { background: var(--panel-2); color: var(--fg); }

/* ---------- buttons ---------- */
.btn, .ghost {
  display: inline-flex;
  align-items: center;
  height: 46px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: transform 150ms ease, background 150ms ease;
}
.btn { background: var(--gold); color: var(--gold-fg) !important; }
.btn:hover { background: var(--gold-hi); }
.btn.sm { height: 38px; padding: 0 18px; font-size: 14px; }
.ghost { background: var(--panel-3); color: var(--fg); }
.ghost:hover { background: #352e25; }
.btn:active, .ghost:active { transform: scale(0.97); }
.landing :focus-visible { outline: 3px solid var(--gold-hi); outline-offset: 3px; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; }

/* ---------- hero ---------- */
.hero {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 20px;
  padding-block: 64px 40px;
}
.hero h1 { font-size: clamp(38px, 5.4vw, 72px); max-width: 20ch; }
.hero h1 span { color: var(--gold-hi); }
.lede { color: var(--dim); font-size: 18.5px; max-width: 54ch; }
.hero .cta { justify-content: center; }
.facts { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 0; font-size: 14px; color: var(--faint); }
.facts span + span::before { content: '·'; margin: 0 12px; color: var(--line-strong); }

/* ---------- tour ---------- */
.tour-wrap { padding-bottom: 72px; }
.tour {
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  background: var(--panel);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 6px rgba(212, 166, 74, 0.04);
}
.rail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  background: #110f0c;
  border-right: 1px solid var(--line);
  overflow-y: auto;
  scrollbar-width: thin;
  /* No height of its own: the picture sets the row, and the rail scrolls. */
  contain: size;
}
.rail-group {
  padding: 12px 10px 4px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
}
.rail-group:first-child { padding-top: 4px; }
.rail button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--dim);
  font: 500 14.5px var(--font-body);
  text-align: left;
  cursor: pointer;
  flex: none;
}
.rail button:hover { background: var(--panel-2); color: var(--fg); }
.rail button[aria-current='true'] { background: rgba(212, 166, 74, 0.13); color: var(--fg); }
.ic {
  width: 28px;
  height: 28px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--faint);
}
.rail button[aria-current='true'] .ic { border-color: var(--gold); color: var(--gold-hi); }
.stage { position: relative; aspect-ratio: 16 / 9; min-width: 0; background: #0a0907; }
.stage img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 350ms ease; }
.stage img.on { opacity: 1; }
.cap {
  position: absolute;
  left: 18px;
  bottom: 18px;
  max-width: min(520px, calc(100% - 140px));
  display: grid;
  gap: 4px;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid var(--line-strong);
  background: rgba(13, 11, 9, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.cap b { font: 700 21px/1.2 var(--font-display); letter-spacing: -0.025em; color: var(--fg); }
.cap span { color: var(--dim); font-size: 15px; }
.arrows { position: absolute; right: 18px; bottom: 18px; display: flex; gap: 8px; }
.arrows button {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: rgba(13, 11, 9, 0.88);
  color: var(--fg);
  cursor: pointer;
}
.arrows button:hover { background: var(--panel-3); }
.tour-note { margin-top: 14px; text-align: center; color: var(--faint); font-size: 14px; }

/* ---------- modules note ---------- */
.modnote {
  display: grid;
  gap: 14px;
  padding: 20px 22px;
  margin-bottom: 56px;
  border-radius: 18px;
  border: 1px dashed var(--line-strong);
  background: var(--panel);
}
.modnote-copy { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; color: var(--dim); }
.modnote-copy strong { font: 700 19px var(--font-display); letter-spacing: -0.02em; color: var(--fg); }
.presets { display: flex; flex-wrap: wrap; gap: 8px; }
.preset {
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--fg);
  font: 600 14px var(--font-body);
  cursor: pointer;
}
.preset:hover { background: var(--panel-2); }
.preset[aria-pressed='true'] { background: var(--gold); border-color: var(--gold); color: var(--gold-fg); }
.toggles { display: flex; flex-wrap: wrap; gap: 8px; }
.toggles li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 6px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 13.5px;
  color: var(--fg);
  transition: opacity 200ms ease;
}
.sw { position: relative; width: 26px; height: 15px; border-radius: 999px; background: var(--gold); transition: background 200ms ease; }
.sw::after { content: ''; position: absolute; top: 2px; left: 13px; width: 11px; height: 11px; border-radius: 50%; background: var(--gold-fg); transition: left 200ms ease; }
.toggles li.off { color: var(--faint); }
.toggles li.off .sw { background: #3a332b; }
.toggles li.off .sw::after { left: 2px; background: var(--faint); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---------- features ---------- */
.bento { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; margin-top: 28px; }
.card {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--panel);
}
.card.big { grid-column: span 3; }
.card.mid { grid-column: span 2; }
.card img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-bottom: 1px solid var(--line); }
.card-text { display: grid; gap: 6px; align-content: start; padding: 18px 20px 22px; }
.card .n { font-size: 13px; font-weight: 600; color: var(--gold); letter-spacing: 0.06em; }
.card h3 { font: 700 21px/1.2 var(--font-display); letter-spacing: -0.025em; }
.card.mid h3 { font-size: 18.5px; }
.card p { color: var(--dim); font-size: 15px; }
.card ul { display: grid; gap: 4px; margin-top: 6px; }
.card li { position: relative; padding-left: 16px; color: var(--dim); font-size: 14.5px; }
.card li::before { content: ''; position: absolute; left: 2px; top: 0.62em; width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }
.more {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--panel);
}
.more b { font: 700 18px var(--font-display); margin-right: 6px; }
.chip { padding: 4px 12px; border-radius: 999px; border: 1px solid var(--line); color: var(--dim); font-size: 14px; }
.apt { margin-top: 22px; color: var(--dim); font-size: 15px; }

/* ---------- sections ---------- */
.section { padding-block: 88px; border-top: 1px solid var(--line); }
.title { font-size: clamp(32px, 4vw, 52px); margin-bottom: 12px; }

/* ---------- install ---------- */
.install { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-block: 28px 32px; }
.install li { border-radius: 20px; background: var(--panel); border: 1px solid var(--line); padding: 22px; display: grid; gap: 6px; align-content: start; }
.install .n { font-size: 13px; font-weight: 600; color: var(--gold); letter-spacing: 0.04em; }
.install h3 { font: 700 20px var(--font-display); letter-spacing: -0.02em; }
.install p { color: var(--dim); font-size: 15px; }

/* ---------- faq ---------- */
.faq { display: grid; gap: 10px; max-width: 780px; margin-top: 28px; }
.faq details { border-radius: 16px; background: var(--panel); border: 1px solid var(--line); padding: 16px 20px; }
.faq summary { cursor: pointer; font-weight: 600; font-size: 16.5px; }
.faq p { color: var(--dim); margin-top: 10px; max-width: 68ch; }

/* ---------- footer ---------- */
.foot { border-top: 1px solid var(--line); padding-block: 32px; color: var(--faint); font-size: 14px; }
.foot-inner { display: flex; flex-wrap: wrap; gap: 12px 24px; justify-content: space-between; }
.foot-links { display: flex; gap: 18px; }

@media (max-width: 960px) {
  .card.big, .card.mid { grid-column: span 3; }
}
@media (max-width: 860px) {
  .hero { padding-block: 44px 32px; }
  .nav-links { display: none; }
  /* The rail becomes a row of tools you swipe, above the picture. */
  .tour { grid-template-columns: minmax(0, 1fr); }
  .rail { contain: none; flex-direction: row; overflow-x: auto; overflow-y: hidden; border-right: 0; border-bottom: 1px solid var(--line); }
  .rail-group { display: none; }
  .cap { position: static; max-width: none; border-radius: 0; border-width: 1px 0 0; backdrop-filter: none; }
  .arrows { display: none; }
  .stage { aspect-ratio: auto; display: grid; }
  .stage img { inset: 0 0 auto 0; height: auto; aspect-ratio: 16 / 9; }
  .stage::before { content: ''; display: block; aspect-ratio: 16 / 9; }
  .section { padding-block: 64px; }
}
@media (max-width: 640px) {
  .card.big, .card.mid { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) {
  .landing * { transition: none !important; }
}
</style>
