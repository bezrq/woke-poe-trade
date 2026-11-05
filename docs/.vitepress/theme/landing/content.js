// The landing page's words. Module names, descriptions and presets come from
// the app itself (renderer/src/web/woke/modules.ts), so they can't drift.

export const REPO = 'https://github.com/guybnd/woke-poe-trade'
export const DOWNLOAD = `${REPO}/releases/latest`

export const HERO_FACTS = ['Free', 'MIT licence', 'Windows 10+', 'Updates itself']

// The tool tour: one stop per tool, grouped as on the overlay's rail. `module`
// picks the rail icon (renderer/src/web/woke/modules.ts); `shot` is a
// screenshot in public/shots/, taken by testing/e2e/landing-shots.spec.ts
// (the real overlay over a real game frame).
export const TOUR = [
  {
    group: 'Trade',
    stops: [
      { id: 'price', module: 'apt-price-check', label: 'Price check', title: 'Is it worth anything? Ctrl+D says.', text: 'Prices the item under your cursor from the trade site, with low and current roll presets in one click.', shot: 'story-price', alt: 'Price check of a rare ring with similar listings' },
      { id: 'market', module: 'market', label: 'Market tracker', title: 'Pact of Lycia up 3,838% this week', text: 'Every poe.ninja price, kept as history on your PC. Hover a row for the item and its week.', shot: 'tour-market', alt: 'Market tracker watchlist with the Pact of Lycia tooltip and its price graph' },
      { id: 'scarab', module: 'scarab-flip', label: 'Scarab flip', title: '37 scarabs worth vendoring today', text: 'Whether the 3-to-1 recipe pays for each scarab, with volume, odds and the rare ones going cheap.', shot: 'tour-scarab', alt: 'Scarab flip list: scarabs with profit per recipe and daily volume' },
      { id: 'trade', module: 'trade', label: 'Trades', title: 'A Headhunter buyer is waiting', text: 'Whispers become cards with the stash spot. One key invites, trades, thanks and kicks.', shot: 'tour-trade', alt: 'Trade card in the hideout: two buyers with the item, price and stash position' }
    ]
  },
  {
    group: 'Where you are',
    stops: [
      { id: 'boss', module: 'boss-runs', label: 'Boss arena', title: 'In Uber Atziri\'s arena: the drops, priced', text: 'An icon shows up only where it matters. Hover it for the loot table at today\'s prices.', shot: 'tour-boss', alt: 'Boss runs card over the arena: Uber Atziri drops with chances and prices' },
      { id: 'campaign', module: 'campaign', label: 'Campaign', title: 'Act 2, Southern Forest: what next', text: 'The campaign icon follows your zone and level, with the next steps and your run timer.', shot: 'tour-campaign', alt: 'Campaign card: the current zone, level and the next three steps' }
    ]
  },
  {
    group: 'Maps and loot',
    stops: [
      { id: 'map-mods', module: 'map-mods', label: 'Map regex', title: 'Never roll reflect again', text: 'Pick the mods you avoid and want; it writes the stash regex and checks every map you price.', shot: 'tour-map-mods', alt: 'Map mod checker: avoid, careful and want mods and the regex it builds' },
      { id: 'map-scan', module: 'map-scan', label: 'Map scan', title: 'Alt+S: this map says CARE', text: 'Reads the map tooltip on screen and marks what your build can\'t run.', shot: 'story-maps', alt: 'Map scan reading a T16 map and marking a dangerous mod' },
      { id: 'essence', module: 'essence-scan', label: 'Essence scan', title: 'Corrupt this one', text: 'Reads the monolith and tells you whether it is worth corrupting.', shot: 'story-essence', alt: 'Essence scan listing each essence of a monolith' },
      { id: 'filter', module: 'loot-filter', label: 'Loot filter', title: 'Fix your filter mid-map', text: 'Hover the item, change its NeverSink rule on the spot, and it reloads in game.', shot: 'story-loot', alt: 'Loot filter editor showing the rule for the hovered item' },
      { id: 'filter-prices', module: 'loot-filter', label: 'Filter by price', title: 'Your filter hides a Headhunter', text: 'Prices re-tier the filter, and a safety net shows anything valuable it would hide.', shot: 'tour-filter-prices', alt: 'Loot filter prices tab: a hidden Headhunter caught by the safety net' }
    ]
  },
  {
    group: 'Builds and farming',
    stops: [
      { id: 'pob', module: 'pob-builds', label: 'PoB builds', title: 'Your Path of Building, in the game', text: 'Gear, gems by level and links, with the regex to find them in a vendor.', shot: 'tour-pob', alt: 'PoB builds: the gear tab of a build with the links regex' },
      { id: 'boss-runs', module: 'boss-runs', label: 'Boss runs', title: 'Uber Atziri loses 17c an hour', text: 'Every boss costed: entry, drops, profit per run and per hour, and how lucky you need to be.', shot: 'tour-boss-runs', alt: 'Boss runs window: Uber Atziri entry cost, drops and profit per hour' },
      { id: 'regex', module: 'regex-library', label: 'Regex library', title: 'Stash searches in one click', text: 'Your saved strings and the classics, typed into the stash search for you.', shot: 'tour-regex', alt: 'Regex library with saved stash search strings' }
    ]
  }
]

// The headline features, in order: the first four get big cards.
export const FEATURES = [
  { title: 'A smarter price check', text: 'Awakened PoE Trade\'s price check, with more around it.', points: ['Low and current roll presets in one click', 'poe.ninja next to the trade site', 'Price history on every item', 'Your PoB build\'s view of the item'], shot: 'story-price', alt: 'Price check of a rare ring' },
  { title: 'Icons that know where you are', text: 'Nothing sits on your screen. An icon appears when there\'s something to know here, and the card opens on hover.', points: ['Boss arena: the drops, priced', 'Campaign zone: next steps and timer', 'Hideout: buyers waiting'], shot: 'tour-boss', alt: 'Boss runs card in the Uber Atziri arena' },
  { title: 'Market watch', text: 'poe.ninja over the whole league, kept on your PC.', points: ['Movers since this morning, and your watchlist', 'Scarab flip: what the 3-to-1 recipe pays', 'Search every price with Alt+P'], shot: 'tour-scarab', alt: 'Scarab flip list' },
  { title: 'Filter editor in the game', text: 'Change your NeverSink filter without alt-tabbing.', points: ['Hover an item, see the rule that styles it', 'Restyle, re-tier or hide it', 'Saves and reloads in game'], shot: 'story-loot', alt: 'Loot filter editor' },
  { title: 'A filter that follows prices', text: 'Re-tier from today\'s poe.ninja prices, with a safety net for valuables it would hide.', shot: 'tour-filter-prices', alt: 'Loot filter prices tab' },
  { title: 'PoB in the game', text: 'Your Path of Building folder: gear, gem links and the vendor regex to find them.', shot: 'tour-pob', alt: 'PoB build detail' },
  { title: 'Boss runner economy', text: 'Profit per run and per hour for every boss, from community drop rates and your own kills.', shot: 'tour-boss-runs', alt: 'Boss runs window' },
  { title: 'Map regex maker', text: 'Pick mods to avoid and want; get a stash regex in the poe.re style.', shot: 'tour-map-mods', alt: 'Map mod checker' },
  { title: 'Shortcuts', text: 'A regex clipboard, today\'s labyrinth, the challenge guide and a wiki lookup, a key away.', shot: 'tour-regex', alt: 'Regex library' },
  { title: 'Campaign tracker and timers', text: 'What to do in each zone, with act splits and personal bests.', shot: 'tour-campaign', alt: 'Campaign card' }
]

export const MORE = ['Map scan and essence scan read the screen', 'Farming profit per hour', 'Session analytics', 'League-start investments', 'Lab gems', 'Atlas strategies', 'Trade searches', 'League mechanics']

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
