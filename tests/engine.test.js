import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_CARDS } from '../lib/cards-fallback.js';
import { ARCHETYPES } from '../lib/decks.js';
import { normalizeCards, normalizeCollection, buildPool, suggest, displayLevel, slugify, parseDeckLink } from '../lib/engine.js';

const cards = normalizeCards(null, FALLBACK_CARDS);
const keys = new Set(cards.map((c) => c.key));
const pool = buildPool(ARCHETYPES, [], cards);

test('every archetype is 8 known, distinct cards', () => {
  for (const a of ARCHETYPES) {
    assert.equal(new Set(a.cards).size, 8, a.name);
    for (const k of a.cards) assert.ok(keys.has(k), `${a.name}: unknown card ${k}`);
  }
});

test('levels convert from API-relative to in-game numbers', () => {
  assert.equal(displayLevel({ level: 14, rarity: 'common' }), 14);
  assert.equal(displayLevel({ level: 12, rarity: 'rare' }), 14);
  assert.equal(displayLevel({ level: 9, rarity: 'epic' }), 14);
  assert.equal(displayLevel({ level: 6, rarity: 'legendary' }), 14);
  assert.equal(displayLevel({ level: 4, rarity: 'champion' }), 14);
});

test('slugify matches bundled keys', () => {
  assert.equal(slugify('Mini P.E.K.K.A'), 'mini-pekka');
  assert.equal(slugify('The Log'), 'the-log');
  assert.equal(slugify('X-Bow'), 'x-bow');
});

test('suggestions keep locked cards and are full decks', () => {
  const res = suggest({ cards, owned: null, locked: ['hog-rider', 'musketeer'], pool });
  assert.ok(res.length > 0);
  for (const r of res) {
    assert.equal(r.cards.length, 8);
    assert.equal(new Set(r.cards).size, 8);
    assert.ok(r.cards.includes('hog-rider') && r.cards.includes('musketeer'));
  }
  assert.equal(res[0].name, 'Hog 2.6 Cycle');
});

test('suggestions only use owned cards', () => {
  const ownedKeys = ['hog-rider', 'knight', 'archers', 'minions', 'skeletons', 'cannon', 'fireball', 'arrows',
    'giant', 'musketeer', 'goblins', 'spear-goblins', 'bomber', 'zap', 'valkyrie', 'mini-pekka', 'baby-dragon'];
  const playerCards = ownedKeys.map((k) => {
    const c = cards.find((x) => x.key === k);
    return { id: c.id, name: c.name, level: 5, rarity: c.rarity };
  });
  const owned = normalizeCollection(playerCards, cards);
  const res = suggest({ cards, owned, locked: ['hog-rider'], pool });
  assert.ok(res.length > 0);
  for (const r of res) for (const k of r.cards) assert.ok(owned.has(k), `unowned ${k} in ${r.name}`);
});

test('decks with no locked cards still include a win condition and a spell', () => {
  const [top] = suggest({ cards, owned: null, locked: [], pool });
  assert.equal(top.cards.length, 8);
  assert.ok(!top.reasons.includes('No clear win condition'));
  assert.ok(!top.reasons.includes('No spells'));
});

test('live top-player decks feed the pool and are credited', () => {
  const ids = (ks) => ks.map((k) => cards.find((c) => c.key === k).id);
  const live = Array(5).fill(ids(['golem', 'night-witch', 'baby-dragon', 'lumberjack', 'tornado', 'lightning', 'barbarian-barrel', 'mega-minion']));
  const p = buildPool(ARCHETYPES, live, cards);
  const [top] = suggest({ cards, owned: null, locked: ['golem'], pool: p });
  assert.equal(top.name, 'Golem Beatdown');
  assert.equal(top.reasons[0], 'Played by 5 top players right now');
});

test('deck links shared from the game are parsed into card ids', () => {
  const link = 'https://link.clashroyale.com/en/?clashroyale://copyDeck?deck=26000021;26000014;26000038;26000030;26000010;27000000;28000000;28000011&l=Royals&tt=159000000&slots=0;0;0;0;0;0;0;0';
  assert.deepEqual(parseDeckLink(link), [26000021, 26000014, 26000038, 26000030, 26000010, 27000000, 28000000, 28000011]);
  assert.deepEqual(parseDeckLink('hello'), []);
});
