// Builds the browser demo into the built site (run after `vitepress build`):
// the real overlay (renderer/) at demo/app/, with demo/shim.js loaded first
// as its stand-in for the desktop app, the recorded trade and poe.ninja
// answers (testing/fixtures/http) as demo/http.json, and the game screens.
// Needs renderer's packages installed (cd renderer && npm ci).
//   node scripts/build-demo.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repo = path.resolve(docs, '..')
const site = path.join(docs, '.vitepress/dist')
const out = path.join(site, 'demo')
const BASE = process.env.WOKE_SITE_BASE ?? '/woke-poe-trade/'

if (!fs.existsSync(path.join(site, 'index.html'))) throw new Error('Build the site first: npx vitepress build')

// The overlay, as the app ships it, under the site's demo/app/.
const app = path.join(out, 'app')
execFileSync('npx', ['vite', 'build', `--base=${BASE}demo/app/`, `--outDir=${app}`, '--emptyOutDir'], {
  cwd: path.join(repo, 'renderer'), stdio: 'inherit', shell: process.platform === 'win32'
})
// English only: the other languages' game data is most of the build's size.
for (const e of fs.readdirSync(path.join(app, 'data'), { withFileTypes: true })) {
  if (e.isDirectory() && e.name !== 'en') fs.rmSync(path.join(app, 'data', e.name), { recursive: true, force: true })
}
// The app serves the overlay at /, so its code names images as /images/...;
// here they live under demo/app/.
for (const f of fs.readdirSync(path.join(app, 'assets'))) {
  if (!/\.(js|css)$/.test(f)) continue
  const file = path.join(app, 'assets', f)
  const code = fs.readFileSync(file, 'utf8')
  const fixed = code.replace(/(["'`(])\/images\//g, `$1${BASE}demo/app/images/`)
  if (fixed !== code) fs.writeFileSync(file, fixed)
}
const indexFile = path.join(app, 'index.html')
const html = fs.readFileSync(indexFile, 'utf8')
if (!html.includes('<script type="module"')) throw new Error('demo: the overlay\'s index.html has no module script to load the shim before')
fs.writeFileSync(indexFile, html.replace('<script type="module"', '<script src="../shim.js"></script>\n    <script type="module"'))

// Recorded trade site and poe.ninja answers, by path.
const fixtures = path.join(repo, 'testing/fixtures/http')
const http = {}
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else http[path.relative(fixtures, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8')
  }
}
walk(fixtures)
fs.writeFileSync(path.join(out, 'http.json'), JSON.stringify(http))

// The game screens behind the overlay.
fs.mkdirSync(path.join(out, 'screens'), { recursive: true })
for (const f of fs.readdirSync(path.join(repo, 'testing/fixtures/screens/landing'))) {
  fs.copyFileSync(path.join(repo, 'testing/fixtures/screens/landing', f), path.join(out, 'screens', f))
}
console.log(`demo: built into ${path.relative(docs, out)}`)
