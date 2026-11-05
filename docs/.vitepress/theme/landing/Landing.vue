<script setup>
// The landing page (index.md, layout: landing). Rooftap's landing page in the
// overlay's Hybrid gold: a split hero on a real game frame, one map told as a
// scroll story, the modules by group with their presets, install, FAQ.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { MODULES, MODULE_GROUPS, PRESETS } from '../../../../renderer/src/web/woke/modules.ts'
import { REPO, DOWNLOAD, HERO_FACTS, STORY, INSTALL, FAQ } from './content.js'

const shot = (name) => withBase(`/shots/${name}.webp`)

const toolkit = MODULES.filter(m => m.group !== 'apt')
const groups = MODULE_GROUPS.filter(g => g.id !== 'apt').map(g => ({
  ...g,
  modules: toolkit.filter(m => m.group === g.id)
}))

// Presets: pick one to see which modules it switches on.
const presets = PRESETS.filter(p => p.id !== 'price-check-only')
const preset = ref('everything')
const presetOn = computed(() => {
  const p = PRESETS.find(p => p.id === preset.value)
  return p.on === 'all' ? null : new Set(p.on)
})
const isOn = (id) => presetOn.value == null || presetOn.value.has(id)

// The story: the step nearest the middle of the screen picks the frame.
const current = ref(0)
const stepEls = ref([])
let observer
onMounted(() => {
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) current.value = Number(e.target.dataset.i)
    }
  }, { rootMargin: '-45% 0px -45% 0px' })
  for (const el of stepEls.value) observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="landing">
    <div class="glow" aria-hidden="true"></div>
    <header class="nav">
      <div class="wrap nav-inner">
        <a class="word" :href="withBase('/')"><img :src="withBase('/favicon.png')" alt="" width="24" height="24">Woke PoE Trade</a>
        <nav class="nav-links" aria-label="Page">
          <a href="#modules">Modules</a>
          <a href="#install">Install</a>
          <a :href="withBase('/quick-start')">Help</a>
          <a :href="REPO">GitHub</a>
        </nav>
        <a class="btn sm" :href="DOWNLOAD">Download</a>
      </div>
    </header>

    <main>
      <section class="wrap hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <h1 id="hero-title" class="display">Price check, plan maps and track profit <span>without leaving the game.</span></h1>
          <p class="lede">An overlay for Path of Exile 1, built on Awakened PoE Trade. {{ toolkit.length }} modules sit on one rail at the edge of your screen, and you turn on only the ones you use.</p>
          <div class="cta">
            <a class="btn" :href="DOWNLOAD">Download for Windows</a>
            <!-- target keeps VitePress's router off: the demo is its own page. -->
            <a class="ghost" :href="withBase('/demo/')" target="_self">Try the demo</a>
          </div>
          <p class="facts"><span v-for="f in HERO_FACTS" :key="f">{{ f }}</span></p>
        </div>
        <figure class="frame hero-frame">
          <img :src="shot('hero')" alt="The overlay open in a map: the rail on the left edge and the market tracker" width="1600" height="900">
        </figure>
      </section>

      <section class="section" aria-labelledby="story-title">
        <div class="wrap">
          <h2 id="story-title" class="display title">One map, start to finish</h2>
          <p class="sub">Every picture here is the real overlay drawn over a real game frame.</p>
          <div class="story">
            <ol class="steps">
              <li v-for="(s, i) in STORY" :key="s.id" ref="stepEls" :data-i="i" :class="{ cur: current === i }">
                <h3>{{ s.title }}</h3>
                <p>{{ s.text }}</p>
                <img class="step-shot" :src="shot(s.shot)" :alt="s.alt" width="1600" height="900" loading="lazy">
              </li>
            </ol>
            <div class="story-stage">
              <figure class="frame">
                <img v-for="(s, i) in STORY" :key="s.id" :src="shot(s.shot)" :alt="s.alt" :class="{ on: current === i }" :aria-hidden="current !== i" width="1600" height="900" loading="lazy">
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" class="section" aria-labelledby="modules-title">
        <div class="wrap">
          <h2 id="modules-title" class="display title">Every module is off until you want it</h2>
          <p class="sub">Pick a preset on first run, then switch modules one by one in Setup. A module that's off doesn't load and doesn't poll.</p>
          <div class="presets" role="group" aria-label="Presets">
            <button v-for="p in presets" :key="p.id" type="button" class="preset" :aria-pressed="preset === p.id" @click="preset = p.id">{{ p.label }}</button>
          </div>
          <div class="groups">
            <div v-for="g in groups" :key="g.id" class="group" :data-group="g.id">
              <h3><span class="dot" aria-hidden="true"></span>{{ g.label }}</h3>
              <ul>
                <li v-for="m in g.modules" :key="m.id" :class="{ off: !isOn(m.id) }">
                  <b>{{ m.name }}</b>
                  <span>{{ m.description }}</span>
                </li>
              </ul>
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
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: 48px;
  align-items: center;
  padding-block: 72px 80px;
}
.hero-copy { display: grid; gap: 22px; min-width: 0; }
.hero h1 { font-size: clamp(40px, 5vw, 68px); }
.hero h1 span { color: var(--gold-hi); }
.lede { color: var(--dim); font-size: 18.5px; max-width: 52ch; }
.facts { display: flex; flex-wrap: wrap; gap: 4px 0; font-size: 14px; color: var(--faint); }
.facts span + span::before { content: '·'; margin: 0 12px; color: var(--line-strong); }
.frame {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  background: var(--panel);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 6px rgba(212, 166, 74, 0.04);
  aspect-ratio: 16 / 9;
  max-width: 100%;
}
.frame img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* ---------- sections ---------- */
.section { padding-block: 88px; border-top: 1px solid var(--line); }
.title { font-size: clamp(32px, 4vw, 52px); margin-bottom: 12px; }
.sub { color: var(--dim); font-size: 17px; max-width: 60ch; margin-bottom: 36px; }

/* ---------- story ---------- */
.story { display: grid; grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr); gap: 40px; align-items: start; }
.steps { display: grid; gap: 14px; padding-block: 8vh 30vh; }
.steps li {
  padding: 22px 24px;
  border-radius: 18px;
  border: 1px solid transparent;
  color: var(--dim);
  transition: background 200ms ease, border-color 200ms ease;
}
.steps li.cur { background: var(--panel); border-color: var(--line-strong); }
.steps h3 { font: 700 22px/1.2 var(--font-display); letter-spacing: -0.025em; color: var(--fg); margin-bottom: 6px; }
.steps li.cur h3 { color: var(--gold-hi); }
.step-shot { display: none; }
.story-stage { position: sticky; top: max(96px, calc(50vh - 240px)); }
.story-stage img { position: absolute; inset: 0; opacity: 0; transition: opacity 350ms ease; }
.story-stage img.on { opacity: 1; }
.story-stage img:first-child { position: relative; }

/* ---------- modules ---------- */
.presets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
.preset {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--fg);
  font: 600 14.5px var(--font-body);
  cursor: pointer;
}
.preset:hover { background: var(--panel-2); }
.preset[aria-pressed='true'] { background: var(--gold); border-color: var(--gold); color: var(--gold-fg); }
.groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
.group { border-radius: 20px; background: var(--panel); border: 1px solid var(--line); padding: 22px; }
.group h3 { display: flex; align-items: center; gap: 10px; font: 700 19px var(--font-display); letter-spacing: -0.02em; margin-bottom: 14px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--hue); box-shadow: 0 0 10px var(--hue); }
.group[data-group='economy'] { --hue: #d4a64a; }
.group[data-group='mapping'] { --hue: #d0743c; }
.group[data-group='campaign'] { --hue: #6c9fc7; }
.group[data-group='builds'] { --hue: #6cc77a; }
.group ul { display: grid; gap: 12px; }
.group li { font-size: 14.5px; color: var(--dim); transition: opacity 200ms ease; }
.group li b { display: block; color: var(--fg); font-weight: 600; font-size: 15px; }
.group li.off { opacity: 0.32; }
.apt { margin-top: 22px; color: var(--dim); font-size: 15px; }

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

@media (max-width: 860px) {
  .hero, .story { grid-template-columns: minmax(0, 1fr); }
  .hero { padding-block: 44px 56px; gap: 36px; }
  .nav-links { display: none; }
  .story-stage { display: none; }
  .steps { padding-block: 0; }
  .steps li { background: var(--panel); border-color: var(--line); }
  .steps li h3 { color: var(--fg); }
  .step-shot { display: block; width: 100%; height: auto; margin-top: 14px; border-radius: 12px; border: 1px solid var(--line-strong); }
  .section { padding-block: 64px; }
}
@media (prefers-reduced-motion: reduce) {
  .landing * { transition: none !important; }
}
</style>
