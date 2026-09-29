// Hand-maintained role tags used to keep suggested decks playable
// (a win condition, spells, and anti-air). Keys are card slugs.
const WIN = ['hog-rider', 'giant', 'royal-giant', 'golem', 'balloon', 'lava-hound', 'x-bow', 'mortar',
  'graveyard', 'miner', 'goblin-barrel', 'ram-rider', 'battle-ram', 'royal-hogs', 'wall-breakers',
  'goblin-giant', 'electro-giant', 'elixir-golem', 'skeleton-barrel', 'three-musketeers', 'goblin-drill',
  'giant-skeleton', 'royal-recruits', 'sparky', 'pekka', 'mega-knight', 'prince', 'goblin-machine',
  'rune-giant', 'suspicious-bush', 'goblinstein', 'boss-bandit'];
const SMALL_SPELL = ['zap', 'the-log', 'arrows', 'barbarian-barrel', 'giant-snowball', 'tornado',
  'royal-delivery', 'goblin-curse', 'vines'];
const BIG_SPELL = ['fireball', 'poison', 'rocket', 'lightning', 'earthquake', 'void'];
const AIR = ['archers', 'minions', 'musketeer', 'baby-dragon', 'wizard', 'witch', 'spear-goblins',
  'minion-horde', 'ice-wizard', 'princess', 'mega-minion', 'dart-goblin', 'electro-wizard', 'hunter',
  'executioner', 'bats', 'zappies', 'flying-machine', 'magic-archer', 'electro-dragon', 'firecracker',
  'inferno-dragon', 'night-witch', 'archer-queen', 'phoenix', 'mother-witch', 'skeleton-dragons', 'tesla',
  'inferno-tower', 'goblin-hut', 'electro-spirit', 'fire-spirit', 'ice-spirit', 'three-musketeers',
  'goblin-gang', 'rascals', 'little-prince', 'spirit-empress', 'furnace'];
const BUILDING = ['cannon', 'tesla', 'inferno-tower', 'bomb-tower', 'goblin-cage', 'tombstone', 'furnace',
  'goblin-hut', 'barbarian-hut', 'elixir-collector'];

export const ROLES = {};
const tag = (list, role) => list.forEach((k) => { (ROLES[k] ||= new Set()).add(role); });
tag(WIN, 'win'); tag(SMALL_SPELL, 'smallSpell'); tag(BIG_SPELL, 'bigSpell');
tag(AIR, 'air'); tag(BUILDING, 'building');

export const rolesOf = (key) => ROLES[key] || new Set();
