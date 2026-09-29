// Hand-curated archetype decks. These are a starting prior for the
// suggestion engine; live decks from top ladder players (/api/meta)
// are weighted alongside them when the API is configured.
export const ARCHETYPES = [
  { name: 'Hog 2.6 Cycle', cards: ['hog-rider', 'musketeer', 'ice-golem', 'ice-spirit', 'skeletons', 'cannon', 'fireball', 'the-log'] },
  { name: 'Hog EQ', cards: ['hog-rider', 'earthquake', 'valkyrie', 'firecracker', 'skeletons', 'ice-spirit', 'the-log', 'cannon'] },
  { name: 'Log Bait', cards: ['goblin-barrel', 'princess', 'goblin-gang', 'knight', 'inferno-tower', 'rocket', 'the-log', 'ice-spirit'] },
  { name: 'X-Bow 3.0', cards: ['x-bow', 'tesla', 'archers', 'knight', 'ice-spirit', 'skeletons', 'fireball', 'the-log'] },
  { name: 'Golem Beatdown', cards: ['golem', 'night-witch', 'baby-dragon', 'lumberjack', 'tornado', 'lightning', 'barbarian-barrel', 'mega-minion'] },
  { name: 'LavaLoon', cards: ['lava-hound', 'balloon', 'mega-minion', 'skeleton-dragons', 'guards', 'tombstone', 'fireball', 'zap'] },
  { name: 'PEKKA Bridge Spam', cards: ['pekka', 'battle-ram', 'bandit', 'royal-ghost', 'electro-wizard', 'magic-archer', 'poison', 'zap'] },
  { name: 'Miner Wall Breakers', cards: ['miner', 'wall-breakers', 'poison', 'the-log', 'valkyrie', 'magic-archer', 'bats', 'bomb-tower'] },
  { name: 'Royal Giant Fisherman', cards: ['royal-giant', 'fisherman', 'hunter', 'royal-ghost', 'electro-spirit', 'lightning', 'the-log', 'mother-witch'] },
  { name: 'Mortar Bait', cards: ['mortar', 'miner', 'goblin-gang', 'skeleton-barrel', 'dart-goblin', 'bats', 'spear-goblins', 'the-log'] },
  { name: 'Splashyard', cards: ['graveyard', 'poison', 'ice-wizard', 'baby-dragon', 'tornado', 'barbarian-barrel', 'knight', 'tombstone'] },
  { name: 'Mega Knight Bait', cards: ['mega-knight', 'goblin-barrel', 'princess', 'goblin-gang', 'dart-goblin', 'inferno-dragon', 'the-log', 'zap'] },
  { name: 'Mega Knight Miner', cards: ['mega-knight', 'miner', 'wall-breakers', 'bats', 'skeleton-barrel', 'spear-goblins', 'zap', 'fireball'] },
  { name: 'Giant Double Prince', cards: ['giant', 'prince', 'dark-prince', 'mega-minion', 'electro-wizard', 'bats', 'zap', 'fireball'] },
  { name: 'Balloon Cycle', cards: ['balloon', 'musketeer', 'ice-golem', 'ice-spirit', 'skeletons', 'bomb-tower', 'the-log', 'fireball'] },
  { name: 'Three Musketeers', cards: ['three-musketeers', 'battle-ram', 'elixir-collector', 'ice-golem', 'royal-ghost', 'bandit', 'zap', 'fireball'] },
  { name: 'Goblin Giant Sparky', cards: ['goblin-giant', 'sparky', 'rage', 'mega-minion', 'electro-wizard', 'dark-prince', 'heal-spirit', 'zap'] },
  { name: 'Royal Hogs Recruits', cards: ['royal-recruits', 'royal-hogs', 'flying-machine', 'zappies', 'goblin-cage', 'barbarian-barrel', 'arrows', 'fireball'] },
  { name: 'Goblin Drill Cycle', cards: ['goblin-drill', 'wall-breakers', 'bomber', 'knight', 'tesla', 'skeletons', 'fireball', 'the-log'] },
  { name: 'Elixir Golem', cards: ['elixir-golem', 'battle-healer', 'electro-dragon', 'night-witch', 'heal-spirit', 'barbarian-barrel', 'tornado', 'rage'] },
  { name: 'Electro Giant', cards: ['electro-giant', 'tornado', 'lightning', 'the-log', 'baby-dragon', 'dark-prince', 'cannon-cart', 'electro-spirit'] },
  { name: 'Lumberloon Freeze', cards: ['balloon', 'lumberjack', 'freeze', 'bowler', 'ice-wizard', 'barbarian-barrel', 'tornado', 'ice-golem'] },
  { name: 'Ram Rider Control', cards: ['ram-rider', 'bandit', 'electro-wizard', 'valkyrie', 'musketeer', 'goblin-cage', 'the-log', 'fireball'] },
  // Beginner friendly: mostly commons/rares unlocked early.
  { name: 'Starter Giant', cards: ['giant', 'musketeer', 'mini-pekka', 'valkyrie', 'baby-dragon', 'spear-goblins', 'fireball', 'arrows'] },
  { name: 'Starter Hog', cards: ['hog-rider', 'knight', 'archers', 'minions', 'skeletons', 'cannon', 'fireball', 'arrows'] },
  { name: 'Starter Royal Giant', cards: ['royal-giant', 'knight', 'archers', 'minions', 'goblins', 'skeletons', 'fireball', 'zap'] },
];
