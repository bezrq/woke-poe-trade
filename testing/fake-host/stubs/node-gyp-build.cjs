// uiohook-napi's native binding, replaced by the fake game's input.
// The real uiohook-napi JS runs on top of this, so hooks behave as in the app.
// CommonJS, because uiohook-napi calls require('node-gyp-build')(dir).
const { game } = require('../game')

let handler = null

const TOGGLE = ['tap', 'down', 'up']

const lib = {
  start (h) { handler = h },
  stop () { handler = null },
  keyTap (key, toggle) { game.onKey(key, TOGGLE[toggle] ?? 'tap') }
}

function nodeGypBuild (_dir) { return lib }
nodeGypBuild.fakeHook = {
  emit (e) { if (handler) handler(e) }
}
module.exports = nodeGypBuild
