// Covens of Umbra (3.30) Fates, from the game client (AuguryCards,
// AuguryCardTiers, AuguryRewardOutcomes). Generated; regenerate rather than
// edit by hand. The rewards on a card are rolled per card, so this only lists
// what each reward icon can stand for.

export interface FateInfo {
  id: string
  name: string
  // Coven the Fate belongs to.
  faction: string
  // Savage, Pestilent and Sadist summon a coven boss instead of a hazard.
  boss: boolean
  summary: string
  // What the Fate adds to the boss, per tier (index 0 is tier 1).
  tiers: string[][]
}

export interface RewardIconInfo {
  icon: string
  // Reward texts this icon is used for, shortest first.
  examples: string[]
}

export const FATES: FateInfo[] = [
  {
    id: 'Crowkeeper',
    name: 'Crowkeeper',
    faction: 'Wickerlight',
    boss: false,
    summary: 'Releases novas of crow projectiles',
    tiers: [
      [
        'Empowered Monster will regularly release novas of Crow Projectiles',
        'Players Struck by a Crow will create a slow growing storm around them, which detonates after a delay dealing Physical Damage',
        'Further storms cannot be attached until any attached storms on that target have already detonated',
        'Empowered Monster deals 20% increased Damage against Enemies on Low Life'
      ],
      [
        'Empowered Monster will regularly release novas of Crow Projectiles',
        'Players Struck by a Crow will create a slow growing storm around them, which detonates after a delay dealing Physical Damage',
        'Further storms cannot be attached until any attached storms on that target have already detonated',
        'Empowered Monster deals 30% increased Damage against Enemies on Low Life'
      ],
      [
        'Empowered Monster will regularly release novas of Crow Projectiles',
        'Players Struck by a Crow will create a slow growing storm around them, which detonates after a delay dealing Physical Damage',
        'Further storms cannot be attached until any attached storms on that target have already detonated',
        'Empowered Monster deals 40% increased Damage against Enemies on Low Life',
        'Empowered Monster kills Enemies below 10% of Maximum Life on Hit'
      ]
    ]
  },
  {
    id: 'Sanguine',
    name: 'Sanguine',
    faction: 'Darktongue',
    boss: false,
    summary: 'Creates a deadly ring of boiling blood',
    tiers: [
      [
        'Empowered Monster will have a ring of boiling blood surrounding it, which deals Physical Damage over time',
        'Empowered Monster will regenerate 1% of Life per second'
      ],
      [
        'Empowered Monster will have a ring of boiling blood surrounding it, which deals heavy Physical Damage over time',
        'Empowered Monster will regenerate 1% of Life per second'
      ],
      [
        'Empowered Monster will have a ring of boiling blood surrounding it, which deals heavy Physical Damage over time',
        'Empowered Monster will regenerate 2% of Life per second'
      ]
    ]
  },
  {
    id: 'Incandescent',
    name: 'Incandescent',
    faction: 'Wickerlight',
    boss: false,
    summary: 'Causes continual blackfire detonations',
    tiers: [
      [
        'Empowered Monster will cause continual detonations of blackfire which track nearby Players, dealing Fire Damage',
        'Empowered Monster will Hinder on Spell Hit'
      ],
      [
        'Empowered Monster will cause continual frequent detonations of blackfire which track nearby Players, dealing Fire Damage',
        'Empowered Monster will Hinder on Spell Hit'
      ],
      [
        'Empowered Monster will cause continual extremely frequent detonations of blackfire which track nearby Players, dealing Fire Damage',
        'Empowered Monster will Hinder and Unnerve on Spell Hit'
      ]
    ]
  },
  {
    id: 'Rot',
    name: 'Rot',
    faction: 'Darktongue',
    boss: false,
    summary: 'Cursed broomsticks sweep across the area',
    tiers: [
      [
        'Empowered Monster summons forth cursed broomsticks, which fly in a straight line targeting nearby Players, leaving explosive plaguebursts in their wake which deal Physical Damage and inflict Poison',
        'Empowered Monster will gain 15% of Physical Damage as extra Chaos Damage'
      ],
      [
        'Empowered Monster summons forth cursed broomsticks, which fly in a straight line targeting nearby Players, leaving explosive plaguebursts in their wake which deal Physical Damage and inflict Poison',
        'Empowered Monster will gain 30% of Physical Damage as extra Chaos Damage'
      ],
      [
        'Empowered Monster summons forth cursed broomsticks, which fly in a straight line targeting nearby Players, leaving explosive plaguebursts in their wake which deam Physical Damage and inflict Poison',
        'Empowered Monster will gain 60% of Physical Damage as extra Chaos Damage'
      ]
    ]
  },
  {
    id: 'Dryad',
    name: 'Dryad',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Spawns vengeful vines',
    tiers: [
      [
        'Empowered Monster will cause Vengeful Vines to periodically sprout up by nearby Players',
        'These Vines will then slam to deal Physical Damage on impact',
        'Empowered Monster will leech a percentage of damage dealt as Life'
      ],
      [
        'Empowered Monster will cause Vengeful Vines to periodically sprout up by nearby Players',
        'These Vines will then slam to deal Physical Damage on impact',
        'Empowered Monster will leech a percentage of damage dealt as Life'
      ],
      [
        'Empowered Monster will cause Vengeful Vines to periodically sprout up by nearby Players',
        'These Vines will then slam to deal Physical Damage on impact',
        'Empowered Monster will leech a percentage of damage dealt as Life'
      ]
    ]
  },
  {
    id: 'Deathbringer',
    name: 'Deathbringer',
    faction: 'Darktongue',
    boss: false,
    summary: 'Causes beams of viscera and gore',
    tiers: [
      [
        'Empowered Monster will cause highly Physically damaging beams of viscera and gore, targeting nearby Players locations',
        'Empowered Monster will have 20% increased Maximum Life'
      ],
      [
        'Empowered Monster will cause highly Physically damaging beams of viscera and gore, targeting nearby Players locations',
        'Empowered Monster will have 40% increased Maximum Life'
      ],
      [
        'Empowered Monster will cause highly Physically damaging beams of viscera and gore, targeting nearby Players locations',
        'Empowered Monster will have 60% increased Maximum Life'
      ]
    ]
  },
  {
    id: 'Torchbearer',
    name: 'Torchbearer',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Creates dangerous bonfires of corpses',
    tiers: [
      [
        'Empowered Monster will create corpse bonfires nearby',
        'These bonfires will periodically fire flaming mortars at enemies near them, which deal Fire Damage on impact',
        'Empowered Monster will gain 15% of Physical Damage as extra Fire'
      ],
      [
        'Empowered Monster will create corpse bonfires nearby',
        'These bonfires will periodically fire flaming mortars at enemies near them, which deal Fire Damage on impact',
        'Empowered Monster will gain 45% of Physical Damage as extra Fire'
      ],
      [
        'Empowered Monster will create corpse bonfires nearby',
        'These bonfires will periodically fire flaming mortars at enemies near them, which deal Fire Damage on impact',
        'Empowered Monster will gain 90% of Physical Damage as extra Fire'
      ]
    ]
  },
  {
    id: 'Bloodthirsty',
    name: 'Bloodthirsty',
    faction: 'Darktongue',
    boss: false,
    summary: 'Fires volleys of bone harpoons',
    tiers: [
      [
        'Empowered Monster will fire periodic volleys of bone harpoons, which deal Physical Damage',
        "Empowered Monster's Attacks and Spells have a 50% chance to Impale on Hit"
      ],
      [
        'Empowered Monster will fire periodic volleys of bone harpoons, which deal Physical Damage',
        "Empowered Monster's Attacks and Spells Impale on Hit"
      ],
      [
        'Empowered Monster will fire periodic volleys of bone harpoons, which deal Physical Damage',
        "Empowered Monster's Attacks and Spells Impale on Hit",
        'Empowered Monster gains 40% increased effect of Impale'
      ]
    ]
  },
  {
    id: 'Wildfire',
    name: 'Wildfire',
    faction: 'Wickerlight',
    boss: false,
    summary: 'Creates walls of blackfire',
    tiers: [
      [
        'Empowered Monster will create walls of Blackfire, which deal Fire Damage over time to Enemies within them',
        'Empowered Monster will inflict Flammability on Hit'
      ],
      [
        'Empowered Monster will create walls of Blackfire, which deal Fire Damage over time to Enemies within them',
        'Empowered Monster will inflict Flammability on Hit'
      ],
      [
        'Empowered Monster will create walls of Blackfire, which deal Fire Damage over time to Enemies within them',
        'Empowered Monster will inflict Flammability on Hit'
      ]
    ]
  },
  {
    id: 'Murderous',
    name: 'Murderous',
    faction: 'Wickerlight',
    boss: false,
    summary: 'Summons malignant crows',
    tiers: [
      [
        'Empowered Monster will continually spawn malignant crows, which linger until an enemy walks too close, at which point they will detonate to deal Physical Damage in an area',
        'Empowered Monster will [Blind] on Hit'
      ],
      [
        'Empowered Monster will continually spawn malignant crows, which linger until an enemy walks too close, at which point they will detonate to deal Physical Damage in an area',
        'Empowered Monster will [Blind] on Hit',
        'Empowered Monster will deal 20% increased Damage against [Blind|Blinded] Enemies'
      ],
      [
        'Empowered Monster will continually spawn malignant crows, which linger until an enemy walks too close, at which point they will detonate to deal Physical Damage in an area',
        'Empowered Monster will [Blind] on Hit',
        'Empowered Monster will deal 40% increased Damage against [Blind|Blinded] Enemies'
      ]
    ]
  },
  {
    id: 'Gravewalker',
    name: 'Gravewalker',
    faction: 'Darktongue',
    boss: false,
    summary: 'Creates fissures of bloated corpses',
    tiers: [
      [
        'Empowered Monster creates fissures which sprout bloated corpses, detonating to deal Fire Damage and inflict [Corpserot|Corpserot] on Hit'
      ],
      [
        'Empowered Monster creates fissures which sprout bloated corpses, detonating to deal Fire Damage and inflict [Corpserot|Corpserot] on Hit'
      ],
      [
        'Empowered Monster creates fissures which sprout bloated corpses, detonating to deal Fire Damage and inflict [Corpserot|Corpserot] on Hit'
      ]
    ]
  },
  {
    id: 'Houndmaster',
    name: 'Houndmaster',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Creates spectral wolves which explode into ice',
    tiers: [
      [
        'Empowered Monster summons Spectral Wolves which leap in, howl, and then explode to deal Cold Damage',
        'Howls from these Wolves will inflict Brittle on nearby Enemies',
        'Empowered Monster has 200% increased Critical Strike Chance'
      ],
      [
        'Empowered Monster summons Spectral Wolves which leap in, howl, and then explode to deal Cold Damage',
        'Howls from these Wolves will inflict Brittle on nearby Enemies',
        'Empowered Monster has 300% increased Critical Strike Chance'
      ],
      [
        'Empowered Monster summons Spectral Wolves which leap in, howl, and then explode to deal Cold Damage',
        'Howls from these Wolves will inflict Brittle on nearby Enemies',
        'Empowered Monster has 400% increased Critical Strike Chance and +40% to Critical Strike Multiplier'
      ]
    ]
  },
  {
    id: 'BlackFrost',
    name: 'Black Frost',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Fires mortars of ice, which then cause erupting ice spikes',
    tiers: [
      [
        'Empowered Monster fires a icy chunk mortar. Then, a cascade of ice spikes proceed to where the mortar landed, dealing Cold Damage, with the final spike dealing extra Damage',
        'Empowered Monster gains 15% of Physical Damage as extra Cold'
      ],
      [
        'Empowered Monster fires a icy chunk mortar. Then, a cascade of ice spikes proceed to where the mortar landed, dealing Cold Damage, with the final spike dealing extra Damage',
        'Empowered Monster gains 45% of Physical Damage as extra Cold'
      ],
      [
        'Empowered Monster fires a icy chunk mortar. Then, a cascade of ice spikes proceed to where the mortar landed, dealing Cold Damage, with the final spike dealing extra Damage',
        'Empowered Monster gains 90% of Physical Damage as extra Cold'
      ]
    ]
  },
  {
    id: 'Conjurer',
    name: 'Conjurer',
    faction: 'Wickerlight',
    boss: false,
    summary: 'Creates portals, which release violent energies',
    tiers: [
      [
        'Empowered Monster creates two portals nearby. The first of these releases a beam of violent energy towards the second, dealing repeated Physical Damage and Chaos Damage',
        'After a short time, both portals vanish',
        'Empowered Monster has 20% chance to inflict [Withered] for 2 seconds on Hit'
      ],
      [
        'Empowered Monster creates two portals nearby. The first of these releases a beam of violent energy towards the second, dealing repeated Physical Damage and Chaos Damage',
        'After a short time, both portals vanish',
        'Empowered Monster has 50% chance to inflict [Withered] for 2 seconds on Hit'
      ],
      [
        'Empowered Monster creates two portals nearby. The first of these releases a beam of violent energy towards the second, dealing repeated Physical Damage and Chaos Damage',
        'After a short time, both portals vanish',
        'Empowered Monster inflicts [Withered] for 2 seconds on Hit'
      ]
    ]
  },
  {
    id: 'Golemancer',
    name: 'Golemancer',
    faction: 'Darktongue',
    boss: false,
    summary: 'Spawns fleshy simulacrums of blood and gore',
    tiers: [
      [
        'Empowered Monster rips fleshy simulacra of blood and gore into being regularly',
        'These then target the Player, slamming and inflicting Bleed before vanishing',
        'Empowered Monster has 20% increased Area of Effect'
      ],
      [
        'Empowered Monster rips fleshy simulacra of blood and gore into being regularly',
        'These then target the Player, slamming and inflicting Bleed before vanishing',
        'Empowered Monster has 30% increased Area of Effect'
      ],
      [
        'Empowered Monster rips fleshy simulacra of blood and gore into being regularly',
        'These then target the Player, slamming and inflicting Bleed before vanishing',
        'Empowered Monster has 50% increased Area of Effect'
      ]
    ]
  },
  {
    id: 'Doomsayer',
    name: 'Doomsayer',
    faction: 'Wickerlight',
    boss: false,
    summary: 'Creates massive explosive blasts of blackfire',
    tiers: [
      [
        'Empowered Monster infrequently creates massive rings of blackfire, which detonate after a long delay, dealing Fire Damage and Igniting Enemies',
        'Empowered Monster gains 50% additional Fire Resistance'
      ],
      [
        'Empowered Monster infrequently creates massive rings of blackfire, which detonate after a long delay, dealing Fire Damage and Igniting Enemies',
        'Empowered Monster gains 75% additional Fire Resistance'
      ],
      [
        'Empowered Monster infrequently creates massive rings of blackfire, which detonate after a long delay, dealing Fire Damage and Igniting Enemies',
        'Empowered Monster gains 75% additional Fire Resistance',
        'Empowered Monster Penetrates 8% Fire Resistance'
      ]
    ]
  },
  {
    id: 'Avalanche',
    name: 'Avalanche',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Fires rapid icy darts',
    tiers: [
      [
        'Empowered Monster infrequently fires a large icy dart. Then, secondary smaller rapid darts will fire at whatever target or location was struck by the initial larger dart',
        'All of these darts deal Cold Damage on Hit',
        'Empowered Monster has 15% increased Attack, Cast and Movement Speed'
      ],
      [
        'Empowered Monster infrequently fires a large icy dart. Then, secondary smaller rapid darts will fire at whatever target or location was struck by the initial larger dart',
        'All of these darts deal Cold Damage on Hit',
        'Empowered Monster has 20% increased Attack, Cast and Movement Speed'
      ],
      [
        'Empowered Monster infrequently fires a large icy dart. Then, secondary smaller rapid darts will fire at whatever target or location was struck by the initial larger dart',
        'All of these darts deal Cold Damage on Hit',
        'Empowered Monster has 30% increased Attack, Cast and Movement Speed'
      ]
    ]
  },
  {
    id: 'Butcher',
    name: 'Butcher',
    faction: 'Darktongue',
    boss: false,
    summary: 'Flings projectiles which open sores in the earth on hit',
    tiers: [
      [
        'Empowered Monster flings returning Projectiles of bone which Pierce all targets',
        'Any target struck will cause a sore to open in the earth beneath them, which pours forth blood dealing repeated Physical Damage to Enemies in the area',
        'Empowered Monster will deal 10% increased Damage'
      ],
      [
        'Empowered Monster flings returning Projectiles of bone which Pierce all targets',
        'Any target struck will cause a sore to open in the earth beneath them, which pours forth blood dealing repeated Physical Damage to Enemies in the area',
        'Empowered Monster will deal 15% increased Damage'
      ],
      [
        'Empowered Monster flings returning Projectiles of bone which Pierce all targets',
        'Any target struck will cause a sore to open in the earth beneath them, which pours forth blood dealing repeated Physical Damage to Enemies in the area',
        'Empowered Monster will deal 30% increased Damage'
      ]
    ]
  },
  {
    id: 'Alchemist',
    name: 'Alchemist',
    faction: 'Darktongue',
    boss: false,
    summary: 'Creates boiling cauldrons of blood',
    tiers: [
      [
        'Empowered Monster spawns cauldrons of boiling blood, which tip over to deal repeated Physical Damage to those beneath them',
        'Empowered Monster has 50% chance to Poison on Hit'
      ],
      [
        'Empowered Monster spawns cauldrons of boiling blood, which tip over to deal repeated Physical Damage to those beneath them',
        'Empowered Monster Poisons on Hit'
      ],
      [
        'Empowered Monster spawns cauldrons of boiling blood, which tip over to deal repeated Physical Damage to those beneath them',
        'Empowered Monster Poisons on Hit',
        'All Damage from Hits from Empowered Monster can Poison'
      ]
    ]
  },
  {
    id: 'Stormcaller',
    name: 'Stormcaller',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Creates leylines of lightning',
    tiers: [
      [
        'Empowered Monster generates random leylines of electrical energy, which call down bolts of lightning after a short duration, dealing Lightning Damage',
        'Empowered Monster has 50% chance to Shock on Hit'
      ],
      [
        'Empowered Monster generates random leylines of electrical energy, which call down bolts of lightning after a short duration, dealing Lightning Damage',
        'Empowered Monster Shocks on Hit'
      ],
      [
        'Empowered Monster generates random leylines of electrical energy, which call down bolts of lightning after a short duration, dealing Lightning Damage',
        'Empowered Monster Shocks on Hit',
        'All Damage from Hits from Empowered Monster can Shock'
      ]
    ]
  },
  {
    id: 'Tempest',
    name: 'Tempest',
    faction: 'Dreadmaiden',
    boss: false,
    summary: 'Creates volatile orbs of lightning',
    tiers: [
      [
        'Volatile orbs of Lightning come into being nearby Empowered Monster',
        'These orbs fire increasingly more frequent bolts of Lightning to locations near them, dealing repeated Lightning Damage, then explode',
        'Empowered Monster inflicts Conductivity on Hit'
      ],
      [
        'Volatile orbs of Lightning come into being nearby Empowered Monster',
        'These orbs fire increasingly more frequent bolts of Lightning to locations near them, dealing repeated Lightning Damage, then explode',
        'Empowered Monster inflicts Conductivity on Hit'
      ],
      [
        'Volatile orbs of Lightning come into being nearby Empowered Monster',
        'These orbs fire increasingly more frequent bolts of Lightning to locations near them, dealing repeated Lightning Damage, then explode',
        'Empowered Monster inflicts Conductivity on Hit'
      ]
    ]
  },
  {
    id: 'BloodMoon',
    name: 'Blood Moon',
    faction: 'Darktongue',
    boss: false,
    summary: 'Creates coagulated orbs of blood',
    tiers: [
      [
        'Coagulated orbs of Blood rise from the earth near Empowered Monster',
        'These orbs then slam down, creating pools of boiling blood which deal Physical Damage over time',
        'Empowered Monster has 50% chance to inflict Bleeding on Hit with Attacks'
      ],
      [
        'Coagulated orbs of Blood rise from the earth near Empowered Monster',
        'These orbs then slam down, creating pools of boiling blood which deal Physical Damage over time',
        'Empowered Monster inflicts Bleeding on Hit with Attacks'
      ],
      [
        'Coagulated orbs of Blood rise from the earth near Empowered Monster',
        'These orbs then slam down, creating pools of boiling blood which deal Physical Damage over time',
        'Empowered Monster inflicts Bleeding on Hit with Attacks',
        'Bleeding inflicted by Empowered Monster has 40% increased duration'
      ]
    ]
  },
  {
    id: 'Savage',
    name: 'Savage',
    faction: 'Wickerlight',
    boss: true,
    summary: 'Spawns an additional Boss from Campaign Areas without an Atlas equivalent',
    tiers: [
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ],
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ],
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ]
    ]
  },
  {
    id: 'Pestilent',
    name: 'Pestilent',
    faction: 'Darktongue',
    boss: true,
    summary: 'Spawns an additional Boss from Campaign Areas without an Atlas equivalent',
    tiers: [
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ],
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ],
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ]
    ]
  },
  {
    id: 'Sadist',
    name: 'Sadist',
    faction: 'Dreadmaiden',
    boss: true,
    summary: 'Spawns an additional Boss from Campaign Areas without an Atlas equivalent',
    tiers: [
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ],
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ],
      [
        'Empowered Monster will spawn a companion Boss which will be pulled from a pool of Campaign Bosses that do not have Atlas Boss equivalents',
        'Spawned companion Boss will also be affected by any other Fates played, and can drop Viscera associated with it'
      ]
    ]
  }
]

export const REWARD_ICONS: RewardIconInfo[] = [
  {
    icon: 'UniqueWeapon',
    examples: [
      'Unique Weapon',
      'Valuable Unique Weapon'
    ]
  },
  {
    icon: 'UniqueArmour',
    examples: [
      'Unique Armour',
      'Valuable Unique Armour'
    ]
  },
  {
    icon: 'UniqueJewellery',
    examples: [
      'Unique Jewellery Item',
      'Valuable Unique Jewellery Item'
    ]
  },
  {
    icon: 'UniqueJewel',
    examples: [
      'Unique Jewel'
    ]
  },
  {
    icon: 'UniqueFlask',
    examples: [
      'Unique Flask'
    ]
  },
  {
    icon: 'UniqueAuguryItem',
    examples: [
      'Corpse Rose',
      'Ordered Fate',
      "Doedre's Tongue"
    ]
  },
  {
    icon: 'Gems',
    examples: [
      'Skill Gem',
      'Support Gem',
      'Gem with Quality'
    ]
  },
  {
    icon: 'ExceptionalGems',
    examples: [
      'Exceptional Gem'
    ]
  },
  {
    icon: 'IncreasedRarityAffectedMonster',
    examples: [
      'increased Item Rarity',
      'highly increased Item Rarity',
      'greatly increased Item Rarity'
    ]
  },
  {
    icon: 'Currency',
    examples: [
      'Currency Items',
      'Valuable Currency Items'
    ]
  },
  {
    icon: 'Viscera',
    examples: [
      'a Viscera Item'
    ]
  },
  {
    icon: 'Threads',
    examples: [
      'Threads',
      'many additional Threads'
    ]
  },
  {
    icon: 'Divination',
    examples: [
      'Stacked Decks',
      'many additional Stacked Decks'
    ]
  },
  {
    icon: 'Gold',
    examples: [
      'Gold',
      'hoards of Gold'
    ]
  },
  {
    icon: 'Maps',
    examples: [
      'Map',
      'Rare Map',
      'many additional Maps'
    ]
  },
  {
    icon: 'RareWeapon',
    examples: [
      'Melee Weapons',
      'Rare Melee Weapons',
      'many additional Rare Melee Weapons'
    ]
  },
  {
    icon: 'RareRanged',
    examples: [
      'Ranged Weapons or Quivers',
      'Rare Ranged Weapons or Quivers',
      'many additional Rare Ranged Weapons or Quivers'
    ]
  },
  {
    icon: 'RareArmour',
    examples: [
      'Armour items with Strength requirements',
      'Armour items with Dexterity requirements',
      'Armour items with Intelligence requirements'
    ]
  },
  {
    icon: 'RareJewellery',
    examples: [
      'Jewellery items',
      'Rare Jewellery items',
      'many additional Rare Jewellery items'
    ]
  },
  {
    icon: 'Boots',
    examples: [
      'Rare Boots\nBoots dropped by Empowered Monster will have a Speed modifier',
      'Rare Boots\nBoots dropped by Empowered Monster will have no Defence modifiers',
      'Rare Boots\nBoots dropped by Empowered Monster will have a Resistance modifier'
    ]
  },
  {
    icon: 'Helmet',
    examples: [
      'Rare Helmets\nHelmets dropped by Empowered Monster will have a Drop modifier',
      'Rare Helmets\nHelmets dropped by Empowered Monster will have a Defence modifier',
      'Rare Helmets\nHelmets dropped by Empowered Monster will have no Defence modifiers'
    ]
  },
  {
    icon: 'BodyArmour',
    examples: [
      'Rare Body Armours\nBody Armours dropped by Empowered Monster will have a Life modifier',
      'Rare Body Armours\nBody Armours dropped by Empowered Monster will have a Chaos modifier',
      'Rare Body Armours\nBody Armours dropped by Empowered Monster will have no Life modifiers'
    ]
  },
  {
    icon: 'Gloves',
    examples: [
      'Rare Gloves\nGloves dropped by Empowered Monster will have an Attack modifier',
      'Rare Gloves\nGloves dropped by Empowered Monster will have a Defence modifier',
      'Rare Gloves\nGloves dropped by Empowered Monster will have no Defence modifiers'
    ]
  },
  {
    icon: 'Shield',
    examples: [
      'Rare Shields\nShields dropped by Empowered Monster will have a Life modifier',
      'Rare Shields\nShields dropped by Empowered Monster will have no Life modifiers',
      'Rare Shields\nShields dropped by Empowered Monster will have a Resistance modifier'
    ]
  },
  {
    icon: 'Quiver',
    examples: [
      'Rare Quivers\nQuivers dropped by Empowered Monster will have an Elemental modifier',
      'Rare Quivers\nQuivers dropped by Empowered Monster will have no Elemental modifiers',
      'a chance to drop additional Quivers\nQuivers dropped by Empowered Monster will have an Elemental modifier'
    ]
  },
  {
    icon: 'Ring',
    examples: [
      'Rare Rings\nRings dropped by Empowered Monster will have a Mana modifier',
      'Rare Rings\nRings dropped by Empowered Monster will have a Speed modifier',
      'a chance to drop additional Rings\nRings dropped by Empowered Monster will have a Mana modifier'
    ]
  },
  {
    icon: 'Amulet',
    examples: [
      'Rare Amulets\nAmulets dropped by Empowered Monster will have a Damage modifier',
      'Rare Amulets\nAmulets dropped by Empowered Monster will have an Attribute modifier',
      'a chance to drop additional Amulets\nAmulets dropped by Empowered Monster will have a Damage modifier'
    ]
  },
  {
    icon: 'Belt',
    examples: [
      'Rare Belts\nBelts dropped by Empowered Monster will have a Defence modifier',
      'Rare Belts\nBelts dropped by Empowered Monster will have an Elemental modifier',
      'a chance to drop additional Belts\nBelts dropped by Empowered Monster will have a Defence modifier'
    ]
  },
  {
    icon: 'Axe',
    examples: [
      'Rare Axes\nAxes dropped by Empowered Monster will have a Speed modifier',
      'Rare Axes\nAxes dropped by Empowered Monster will have a Physical modifier',
      'a chance to drop additional Axes\nAxes dropped by Empowered Monster will have a Speed modifier'
    ]
  },
  {
    icon: 'Bow',
    examples: [
      'Rare Bows\nBows dropped by Empowered Monster will have a Speed modifier',
      'Rare Bows\nBows dropped by Empowered Monster will have a Critical modifier',
      'a chance to drop additional Bows\nBows dropped by Empowered Monster will have a Speed modifier'
    ]
  },
  {
    icon: 'Claw',
    examples: [
      'Rare Claws\nClaws dropped by Empowered Monster will have a Speed modifier',
      'Rare Claws\nClaws dropped by Empowered Monster will have a Critical modifier',
      'Rare Claws\nClaws dropped by Empowered Monster will have no Physical modifiers'
    ]
  },
  {
    icon: 'Dagger',
    examples: [
      'Rare Daggers\nDaggers dropped by Empowered Monster will have a Speed modifier',
      'Rare Daggers\nDaggers dropped by Empowered Monster will have a Critical modifier',
      'Rare Rune Daggers\nRune Daggers dropped by Empowered Monster will have no Attack modifiers'
    ]
  },
  {
    icon: 'FishingRod',
    examples: [
      'Rare Fishing Rod\nFishing Rods dropped by Empowered Monster will have an Angling modifier'
    ]
  },
  {
    icon: 'Mace',
    examples: [
      'Rare Maces\nMaces dropped by Empowered Monster will have a Speed modifier',
      'a chance to drop additional Maces\nMaces dropped by Empowered Monster will have a Speed modifier',
      'a chance to drop additional Maces\nMaces dropped by Empowered Monster will have a Physical modifier'
    ]
  },
  {
    icon: 'Sceptre',
    examples: [
      'Rare Sceptres\nSceptres dropped by Empowered Monster will have a Gem modifier',
      'Rare Sceptres\nSceptres dropped by Empowered Monster will have no Physical modifiers',
      'a chance to drop additional Sceptres\nSceptres dropped by Empowered Monster will have a Gem modifier'
    ]
  },
  {
    icon: 'Staff',
    examples: [
      'Rare Staves\nStaves dropped by Empowered Monster will have a Gem modifier',
      'Rare Staves\nStaves dropped by Empowered Monster will have a Mana modifier',
      'Rare Staves\nStaves dropped by Empowered Monster will have no Attack modifiers'
    ]
  },
  {
    icon: 'Wand',
    examples: [
      'Rare Wands\nWands dropped by Empowered Monster will have a Gem modifier',
      'Rare Wands\nWands dropped by Empowered Monster will have a Mana modifier',
      'Rare Wands\nWands dropped by Empowered Monster will have no Attack modifiers'
    ]
  },
  {
    icon: 'Sword',
    examples: [
      'Rare Swords\nSwords dropped by Empowered Monster will have a Speed modifier',
      'Rare Swords\nSwords dropped by Empowered Monster will have a Critical modifier',
      'Rare Swords\nSwords dropped by Empowered Monster will have no Physical modifiers'
    ]
  }
]
