// Real-Electron smoke test: starts the actual built app (not the fake host),
// the same files laid out the way the installer lays them out, and checks the
// things the browser-based tests can't see:
//   - the overlay window loads our page and the app mounts
//   - <webview> still works (trade site, trade searches, poelab use it)
//   - how many processes Electron runs and how much memory they take
//
// Linux only (reads /proc); CI runs it under xvfb-run. Needs main built with
// `node build/script.mjs --prod`, the overlay built (`renderer: npx vite build`)
// and the Electron binary installed in main/node_modules.
//
//   xvfb-run -a node electron/smoke.mjs
//
// Writes perf-results/electron.json and electron.md. Process count over the
// budget fails; memory is reported (it varies by machine) and warns at +25%.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const mainDir = path.join(root, 'main')
const outDir = path.join(here, '../perf-results')
const budgets = JSON.parse(fs.readFileSync(path.join(here, 'budgets.json'), 'utf8'))

const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'woke-electron-'))
const appDir = path.join(stage, 'app')
const dataDir = path.join(stage, 'config')

// Same layout as electron-builder.yml `files`: package.json + main.js +
// vision.js + the overlay build, all at the app root.
fs.mkdirSync(appDir, { recursive: true })
const pkg = JSON.parse(fs.readFileSync(path.join(mainDir, 'package.json'), 'utf8'))
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
  name: pkg.name, productName: pkg.productName, version: pkg.version, main: 'probe.cjs'
}))
for (const f of ['main.js', 'vision.js']) fs.copyFileSync(path.join(mainDir, 'dist', f), path.join(appDir, f))
fs.cpSync(path.join(root, 'renderer/dist'), appDir, { recursive: true })
fs.copyFileSync(path.join(here, 'probe.cjs'), path.join(appDir, 'probe.cjs'))
// The native modules (uiohook-napi, electron-overlay-window) ship in node_modules.
fs.symlinkSync(path.join(mainDir, 'node_modules'), path.join(appDir, 'node_modules'), 'dir')
// Skip the first-run setup window so we measure the app as players run it.
fs.mkdirSync(path.join(dataDir, 'woke-poe-trade/apt-data'), { recursive: true })
fs.writeFileSync(path.join(dataDir, 'woke-poe-trade/apt-data/woke-app.json'), JSON.stringify({ wizardShown: true }))

const electronBin = path.join(mainDir, 'node_modules/electron/dist/electron')
const resultFile = path.join(stage, 'result.json')
const args = ['--ozone-platform=x11', appDir]
// CI runners (and containers) can't use Chromium's sandbox.
if (process.env.CI || process.getuid?.() === 0) args.unshift('--no-sandbox')

const child = spawn(electronBin, args, {
  env: { ...process.env, XDG_CONFIG_HOME: dataDir, HOME: stage, WOKE_SMOKE_RESULT: resultFile, ELECTRON_ENABLE_LOGGING: '' },
  stdio: ['ignore', 'pipe', 'pipe']
})
let log = ''
child.stdout.on('data', d => { log += d })
child.stderr.on('data', d => { log += d })

// Memory: proportional set size of every Electron process, sampled once the
// app has settled (the probe signals that by writing <result>.settled).
function descendants (pid) {
  const all = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d)).map(Number)
  const parent = new Map()
  for (const p of all) {
    try { parent.set(p, Number(fs.readFileSync(`/proc/${p}/stat`, 'utf8').split(') ')[1].split(' ')[1])) } catch {}
  }
  const out = [pid]
  for (let i = 0; i < out.length; i++) for (const [p, pp] of parent) if (pp === out[i]) out.push(p)
  return out
}
function memOf (pid) {
  try {
    const s = fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8')
    const kb = (re) => [...s.matchAll(re)].reduce((a, m) => a + Number(m[1]), 0)
    return { pss: kb(/^Pss:\s+(\d+)/gm), priv: kb(/^Private_(?:Clean|Dirty):\s+(\d+)/gm) }
  } catch { return null }
}

const deadline = Date.now() + 90_000
let mem = null
while (Date.now() < deadline) {
  await new Promise(r => setTimeout(r, 500))
  if (child.exitCode != null) break
  if (!mem && fs.existsSync(resultFile + '.settled')) {
    const procs = descendants(child.pid).map(memOf).filter(Boolean)
    mem = {
      processes: procs.length,
      pssMB: Math.round(procs.reduce((a, p) => a + p.pss, 0) / 1024),
      privateMB: Math.round(procs.reduce((a, p) => a + p.priv, 0) / 1024)
    }
    fs.writeFileSync(resultFile + '.measured', '')
  }
  if (fs.existsSync(resultFile)) break
}
child.kill()

const failures = []
const warnings = []
const result = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, 'utf8')) : null
if (!result) failures.push('The app never reported back (crashed or hung). Log:\n' + log.slice(-3000))
else {
  if (!result.overlayLoaded) failures.push(`Overlay page didn't load (url: ${result.overlayUrl})`)
  if (!result.appMounted) failures.push('Overlay page loaded but the app did not mount')
  if (!result.webviewWorks) failures.push(`<webview> didn't load a page: ${result.webviewError ?? ''}`)
  if (result.hotkeysReady === false) failures.push('Hotkeys never registered')
}
if (mem) {
  if (mem.processes > budgets.processes) failures.push(`${mem.processes} Electron processes, budget ${budgets.processes}`)
  if (mem.pssMB > budgets.pssMB * 1.25) warnings.push(`Memory ${mem.pssMB} MB, budget ${budgets.pssMB} MB (+25% allowed)`)
} else if (result) failures.push('Could not measure memory')

const rows = [
  ['Overlay page loaded', result?.overlayLoaded ? 'yes' : 'no'],
  ['App mounted', result?.appMounted ? 'yes' : 'no'],
  ['<webview> loads a page', result?.webviewWorks ? 'yes' : 'no'],
  ['Electron processes', mem?.processes ?? '?', budgets.processes],
  ['Memory, all processes (PSS)', mem ? `${mem.pssMB} MB` : '?', `${budgets.pssMB} MB`],
  ['Memory, private to the app', mem ? `${mem.privateMB} MB` : '?'],
  ['Main process JS heap', result ? `${result.mainHeapMB} MB` : '?'],
  ...(result?.metrics ?? []).map(m => [`  ${m.type}${m.name ? ` (${m.name})` : ''} working set`, `${m.workingSetMB} MB`])
]
const md = ['## Real Electron app (Linux, xvfb)', '', '| Measure | This run | Budget |', '| --- | --- | --- |',
  ...rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2] ?? ''} |`), '',
  ...failures.map(f => `❌ ${f}`), ...warnings.map(w => `⚠️ ${w}`)].join('\n')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'electron.json'), JSON.stringify({ result, mem, failures, warnings }, null, 2))
fs.writeFileSync(path.join(outDir, 'electron.md'), md + '\n')
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
console.log(md)
fs.rmSync(stage, { recursive: true, force: true })
process.exit(failures.length ? 1 : 0)
