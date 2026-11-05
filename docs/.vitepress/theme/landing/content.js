// The landing page's words. Module names, descriptions and presets come from
// the app itself (renderer/src/web/woke/modules.ts), so they can't drift.

export const REPO = 'https://github.com/guybnd/woke-poe-trade'
export const DOWNLOAD = `${REPO}/releases/latest`

export const HERO_FACTS = ['Free', 'MIT licence', 'Windows 10+', 'Updates itself']

// One map, start to finish. `shot` is a screenshot in public/shots/, taken by
// testing/e2e/landing-shots.spec.ts (the real overlay over a real game frame).
export const STORY = [
  {
    id: 'maps',
    title: 'Before you run it',
    text: 'Map scan reads the map tooltip and marks the mods your build can\'t run. Press Alt+R while you reroll and it flashes when the map turns runnable.',
    shot: 'story-maps',
    alt: 'Map mods: the overlay reads a T16 map and marks a dangerous mod'
  },
  {
    id: 'essence',
    title: 'While you map',
    text: 'Essence scan reads the monolith on screen and tells you whether it is worth corrupting.',
    shot: 'story-essence',
    alt: 'Essence scan: the overlay reads an essence monolith and lists each essence'
  },
  {
    id: 'price',
    title: 'When it drops',
    text: 'Ctrl+D on an item prices it from the trade site, as in Awakened PoE Trade, with low and current roll presets.',
    shot: 'story-price',
    alt: 'Price check of a rare ring with similar listings'
  },
  {
    id: 'loot',
    title: 'When the filter is wrong',
    text: 'Hover the item and change its NeverSink rule on the spot. The filter reloads in game.',
    shot: 'story-loot',
    alt: 'Loot filter editor showing the rule that styles the hovered item'
  }
]

export const INSTALL = [
  { title: 'Download the installer', text: 'One .exe from the latest release. After that it updates itself.' },
  { title: 'Pick a preset', text: 'The setup wizard finds your game folder and asks how you play: mapper, leveling, trader or just price check.' },
  { title: 'Play', text: 'Ctrl+D prices the item under the cursor. Shift+Space opens the overlay. The rail on the left edge holds everything else.' }
]

export const FAQ = [
  {
    q: 'Is it allowed?',
    a: 'It works the way Awakened PoE Trade does: it reads the item you copy, the game\'s log file and the screen. The trade site is only searched when you press a key, and prices come from poe.ninja. It never reads or changes the game\'s memory, and never plays for you. No third-party tool is approved by GGG, so use your own judgement.'
  },
  {
    q: 'How is it different from Awakened PoE Trade?',
    a: 'Price check and item info are Awakened PoE Trade\'s own code, kept as they are. Everything else is a module added on top, and each one can be switched off.'
  },
  {
    q: 'Will it slow my game down?',
    a: 'Modules that are off don\'t load and don\'t poll anything. Settings, Performance shows what each module costs, and every change is checked against startup and memory budgets.'
  },
  {
    q: 'Path of Exile 2?',
    a: 'No. Everything here is built and tested for Path of Exile 1.'
  },
  {
    q: 'Something isn\'t working',
    a: 'The help pages cover the common problems. If it\'s still broken, open an issue on GitHub and say what you pressed and what happened.'
  }
]
