// Deck suggestion engine. Pure functions, shared by the browser and tests.
import { rolesOf } from './roles.js';

export const DECK_SIZE = 8;

// Clash Royale API reports levels relative to rarity; convert to the
// in-game number players see (common 1, rare 3, epic 6, legendary 9, champion 11).
const START_LEVEL = { common: 1, rare: 3, epic: 6, legendary: 9, champion: 11 };

export function slugify(name) {
  return String(name).toLowerCase().replace(/[.'’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function typeFromId(id) {
  const prefix = Math.floor(Number(id) / 1e6);
  return prefix === 27 ? 'building' : prefix === 28 ? 'spell' : 'troop';
}

export function displayLevel(card) {
  const start = START_LEVEL[String(card.rarity || '').toLowerCase()] ?? 1;
  return (card.level ?? 1) + start - 1;
}

// Merge the live /v1/cards list (if any) with the bundled fallback list.
// Card identity is the numeric id; the fallback provides stable slugs.
export function normalizeCards(apiItems, fallback) {
  const byId = new Map(fallback.map((c) => [c.id, { ...c, type: typeFromId(c.id) }]));
  if (Array.isArray(apiItems) && apiItems.length) {
    const live = new Map();
    for (const it of apiItems) {
      const base = byId.get(it.id) || {};
      live.set(it.id, {
        id: it.id,
        key: base.key || slugify(it.name),
        name: it.name,
        elixir: it.elixirCost ?? base.elixir ?? 0,
        rarity: String(it.rarity || base.rarity || 'common').toLowerCase(),
        type: typeFromId(it.id),
        icon: it.iconUrls?.medium || null,
        evoIcon: it.iconUrls?.evolutionMedium || null,
      });
    }
    return [...live.values()];
  }
  return [...byId.values()];
}

// playerCards: the `cards` array from /v1/players/{tag}.
// Returns Map<key, { level, evo }>.
export function normalizeCollection(playerCards, cards) {
  const keyById = new Map(cards.map((c) => [c.id, c.key]));
  const owned = new Map();
  for (const pc of playerCards || []) {
    const key = keyById.get(pc.id) || slugify(pc.name);
    owned.set(key, { level: displayLevel(pc), evo: (pc.evolutionLevel ?? 0) > 0 });
  }
  return owned;
}

// Live decks come from top players' currentDeck (arrays of card ids).
export function buildPool(archetypes, liveDecks, cards) {
  const keyById = new Map(cards.map((c) => [c.id, c.key]));
  const nameByKey = new Map(cards.map((c) => [c.key, c.name]));
  const seen = new Map();
  const pool = [];
  for (const a of archetypes) {
    const entry = { name: a.name, cards: a.cards, weight: 3, players: 0, source: 'archetype' };
    seen.set([...a.cards].sort().join(','), entry);
    pool.push(entry);
  }
  for (const d of liveDecks || []) {
    const keys = d.map((id) => keyById.get(id)).filter(Boolean);
    if (keys.length !== DECK_SIZE) continue;
    const sig = [...keys].sort().join(',');
    const existing = seen.get(sig);
    if (existing) { existing.weight += 1; existing.players += 1; continue; }
    const win = keys.find((k) => rolesOf(k).has('win'));
    const entry = { name: `${nameByKey.get(win || keys[0])} (top-player list)`, cards: keys, weight: 1, players: 1, source: 'top-players' };
    seen.set(sig, entry);
    pool.push(entry);
  }
  return pool;
}

export function buildSynergy(pool) {
  const freq = new Map();
  const co = new Map();
  for (const d of pool) {
    for (const a of d.cards) freq.set(a, (freq.get(a) || 0) + d.weight);
    for (let i = 0; i < d.cards.length; i++) {
      for (let j = i + 1; j < d.cards.length; j++) {
        const k = pairKey(d.cards[i], d.cards[j]);
        co.set(k, (co.get(k) || 0) + d.weight);
      }
    }
  }
  return (a, b) => {
    const c = co.get(pairKey(a, b));
    return c ? c / Math.sqrt(freq.get(a) * freq.get(b)) : 0;
  };
}

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function deckStats(keys, cardByKey) {
  let win = 0, spells = 0, small = 0, air = 0, buildings = 0, elixir = 0;
  for (const k of keys) {
    const r = rolesOf(k);
    const card = cardByKey.get(k);
    if (r.has('win')) win++;
    if (r.has('smallSpell') || r.has('bigSpell') || card?.type === 'spell') spells++;
    if (r.has('smallSpell')) small++;
    if (r.has('air')) air++;
    if (card?.type === 'building') buildings++;
    elixir += card?.elixir ?? 0;
  }
  return { win, spells, small, air, buildings, avgElixir: keys.length ? elixir / keys.length : 0 };
}

export function suggest({ cards, owned, locked = [], pool, count = 5 }) {
  const cardByKey = new Map(cards.map((c) => [c.key, c]));
  const syn = buildSynergy(pool);
  const has = (k) => cardByKey.has(k) && (!owned || owned.has(k));
  const level = (k) => (owned ? owned.get(k)?.level ?? 0 : 0);
  const available = cards.filter((c) => has(c.key)).map((c) => c.key);

  // Reference level: mean of the player's 8 best cards.
  const top = owned ? [...owned.values()].map((v) => v.level).sort((a, b) => b - a).slice(0, 8) : [];
  const refLevel = top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0;

  locked = locked.filter((k) => cardByKey.has(k)).slice(0, DECK_SIZE);
  const synWith = (k, deck) => deck.reduce((s, d) => s + syn(k, d), 0);

  function roleNeed(k, deck) {
    const st = deckStats(deck, cardByKey);
    const r = rolesOf(k);
    const t = cardByKey.get(k)?.type;
    let b = 0;
    if (r.has('win')) b += st.win === 0 ? 0.6 : st.win >= 2 ? -0.8 : -0.1;
    const isSpell = t === 'spell';
    if (isSpell) b += st.spells === 0 ? 0.5 : st.spells === 1 ? 0.25 : -0.6;
    if (r.has('smallSpell') && st.small === 0) b += 0.3;
    if (r.has('air')) b += st.air < 2 ? 0.35 : 0;
    if (t === 'building' && st.buildings >= 1) b -= 0.6;
    return b;
  }

  function cardScore(k, deck) {
    const lvl = owned ? (level(k) - refLevel) * 0.08 : 0;
    const evo = owned?.get(k)?.evo ? 0.05 : 0;
    return synWith(k, deck) + roleNeed(k, deck) + lvl + evo;
  }

  function greedyFill(deck) {
    deck = [...deck];
    while (deck.length < DECK_SIZE) {
      let best = null, bestScore = -Infinity;
      for (const k of available) {
        if (deck.includes(k)) continue;
        const s = cardScore(k, deck);
        if (s > bestScore) { bestScore = s; best = k; }
      }
      if (!best) break;
      deck.push(best);
    }
    return deck;
  }

  function substitute(k, deck) {
    const orig = cardByKey.get(k);
    const r = rolesOf(k);
    let best = null, bestScore = -Infinity;
    for (const c of available) {
      if (deck.includes(c)) continue;
      const cc = cardByKey.get(c);
      if (orig && Math.abs(cc.elixir - orig.elixir) > 1) continue;
      const rc = rolesOf(c);
      const shared = [...r].some((x) => rc.has(x)) || (r.size === 0 && orig && cc.type === orig.type);
      if (!shared) continue;
      const s = cardScore(c, deck) + syn(c, k);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    return best;
  }

  const candidates = [];
  const lockedSet = new Set(locked);
  const byHits = pool
    .map((d) => ({ d, hit: d.cards.filter((k) => lockedSet.has(k)).length }))
    .sort((a, b) => b.hit - a.hit || b.d.weight - a.d.weight);
  // Templates that share a card with the picks, plus popular ones to adapt.
  const templates = [...byHits.filter((x) => x.hit > 0).slice(0, 60), ...byHits.filter((x) => x.hit === 0).slice(0, 30)];

  // How interchangeable two cards are (same job, similar cost).
  function similarity(a, b) {
    const ca = cardByKey.get(a), cb = cardByKey.get(b);
    if (!ca || !cb) return 0;
    const ra = rolesOf(a), rb = rolesOf(b);
    let s = [...ra].filter((x) => rb.has(x)).length * 2;
    if (ca.type === cb.type) s += 1;
    return s - Math.abs(ca.elixir - cb.elixir) * 0.5;
  }

  for (const { d } of templates) {
    let deck = [...locked];
    let rest = d.cards.filter((k) => !lockedSet.has(k));
    // Each pick not in the template displaces the template card it most resembles.
    for (const k of locked) {
      if (d.cards.includes(k) || rest.length + deck.length <= DECK_SIZE) continue;
      let worst = 0;
      for (let i = 1; i < rest.length; i++) if (similarity(k, rest[i]) > similarity(k, rest[worst])) worst = i;
      rest.splice(worst, 1);
    }
    const swaps = [];
    for (const k of rest) {
      if (deck.length >= DECK_SIZE) break;
      if (has(k)) { deck.push(k); continue; }
      const sub = substitute(k, deck);
      if (sub) { deck.push(sub); swaps.push([k, sub]); }
    }
    deck = greedyFill(deck);
    if (deck.length === DECK_SIZE) candidates.push({ keys: deck, template: d, swaps });
  }
  const g = greedyFill(locked);
  if (g.length === DECK_SIZE) candidates.push({ keys: g, template: null, swaps: [] });

  const results = [];
  const seen = new Set();
  for (const c of candidates) {
    const sig = [...c.keys].sort().join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);
    results.push(scoreDeck(c));
  }
  results.sort((a, b) => b.score - a.score);
  // Keep the list varied: skip decks that differ from a better one by a single card.
  const picked = [];
  for (const r of results) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.cards.filter((k) => r.cards.includes(k)).length >= DECK_SIZE - 1)) continue;
    picked.push(r);
  }
  return picked;

  function scoreDeck({ keys, template, swaps }) {
    let pairSum = 0, pairs = 0;
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { pairSum += syn(keys[i], keys[j]); pairs++; }
    const synergy = pairSum / pairs;
    const st = deckStats(keys, cardByKey);
    let score = synergy * 100;
    const reasons = [];
    if (st.win === 0) { score -= 40; reasons.push('No clear win condition'); }
    if (st.win > 2) score -= 10 * (st.win - 2);
    if (st.spells === 0) { score -= 30; reasons.push('No spells'); } else if (st.spells <= 3) score += 8;
    if (st.spells > 0 && st.small === 0) { score -= 12; reasons.push('No cheap spell (Log, Zap, Arrows…)'); }
    if (st.air === 0) { score -= 30; reasons.push('Weak vs air'); } else if (st.air >= 2) score += 8;
    if (st.buildings > 2) score -= 10;
    const drift = Math.max(0, Math.abs(st.avgElixir - 3.5) - 0.8);
    score -= drift * 25;

    const levels = owned ? keys.map(level) : [];
    const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : null;
    if (avgLevel != null) score += (avgLevel - refLevel) * 3;

    // Closest known deck, used for naming and to reward proven lists.
    let match = null, matchN = 0;
    for (const d of pool) {
      const n = d.cards.filter((k) => keys.includes(k)).length;
      if (n > matchN || (n === matchN && match && d.weight > match.weight)) { match = d; matchN = n; }
    }
    if (matchN === DECK_SIZE) score += 6 + Math.min(10, match.weight);
    else if (matchN >= 6) score += 3;

    const base = matchN >= 5 ? match : template;
    const name = base?.name
      ? (matchN === DECK_SIZE ? base.name : `${base.name} (your version)`)
      : locked.length ? `Built around ${cardByKey.get(locked[0])?.name}` : 'Custom deck';

    if (matchN === DECK_SIZE && match.players) reasons.unshift(`Played by ${match.players} top player${match.players > 1 ? 's' : ''} right now`);
    else if (matchN === DECK_SIZE) reasons.unshift('Proven archetype, exact list');
    for (const [from, to] of swaps) reasons.push(`${cardByKey.get(to)?.name} replaces ${cardByKey.get(from)?.name ?? from} (not unlocked)`);

    return {
      name,
      cards: keys,
      avgElixir: Math.round(st.avgElixir * 10) / 10,
      avgLevel: avgLevel == null ? null : Math.round(avgLevel * 10) / 10,
      synergy: Math.round(synergy * 100),
      score: Math.round(score * 10) / 10,
      reasons,
    };
  }
}

export function copyDeckLink(ids) {
  return `https://link.clashroyale.com/en/?clashroyale://copyDeck?deck=${ids.join(';')}&l=Royals`;
}

// Pull card ids out of a deck link shared from the game (Share deck > Copy link).
export function parseDeckLink(text) {
  const ids = String(text).match(/\b2[678]\d{6}\b/g) || [];
  return [...new Set(ids.map(Number))].slice(0, DECK_SIZE);
}
