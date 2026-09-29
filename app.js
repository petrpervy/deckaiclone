import { FALLBACK_CARDS } from './lib/cards-fallback.js';
import { ARCHETYPES } from './lib/decks.js';
import { rolesOf } from './lib/roles.js';
import { normalizeCards, normalizeCollection, buildPool, suggest, copyDeckLink, parseDeckLink, DECK_SIZE } from './lib/engine.js';

const $ = (id) => document.getElementById(id);
// Set by the single-file build: no server, so no API calls.
const STATIC = globalThis.DECKFORGE_STATIC === true;
// Gleb's account: loaded automatically unless another tag was saved.
const DEFAULT_TAG = 'Q08YY9QL9';
const state = {
  cards: normalizeCards(null, FALLBACK_CARDS),
  owned: null, // Map<key,{level,evo}>; null = no account loaded, treat all as owned
  player: null,
  locked: [],
  liveDecks: [],
  filter: 'all',
  search: '',
  showMissing: false,
  editOwned: false, // tapping cards marks them as owned instead of picking them
};
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
// Collection marked by hand (no API key needed). Stored as a list of card keys.
function loadManualOwned() {
  try {
    const keys = JSON.parse(store.get('cr-owned') || '[]');
    return Array.isArray(keys) && keys.length ? new Map(keys.map((k) => [k, { level: 0, evo: false }])) : null;
  } catch { return null; }
}
function saveManualOwned() {
  store.set('cr-owned', JSON.stringify(state.owned ? [...state.owned.keys()] : []));
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byKey = () => new Map(state.cards.map((c) => [c.key, c]));
const isOwned = (k) => !state.owned || state.owned.has(k);

async function getJSON(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `Request failed (${res.status})`), { status: res.status });
  return body;
}

function notice(msg, kind = '') {
  const n = $('notice');
  n.hidden = !msg;
  n.className = `notice ${kind}`;
  n.textContent = msg || '';
}

function cardHTML(c, { button = false, extra = '' } = {}) {
  const o = state.owned?.get(c.key);
  const missing = !isOwned(c.key);
  const clickable = button && (!missing || state.editOwned);
  const locked = state.locked.includes(c.key);
  const art = (o?.evo && c.evoIcon) || c.icon;
  const img = art
    ? `<img src="${esc(art)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:${esc(JSON.stringify(c.name))}}))">`
    : `<div class="ph">${esc(c.name)}</div>`;
  const tag = button ? 'button' : 'div';
  const attrs = button ? `type="button" data-key="${esc(c.key)}" ${clickable ? '' : 'disabled'} title="${esc(c.name)}"` : `title="${esc(c.name)}"`;
  return `<${tag} class="card r-${esc(c.rarity)} ${missing ? 'missing' : ''} ${locked ? 'locked' : ''} ${extra}" ${attrs}>
    ${img}<span class="ex">${c.elixir}</span>
    ${o?.level ? `<span class="lv">Lv ${o.level}</span>` : ''}${o?.evo ? '<span class="evo" title="Evolution unlocked">🌀</span>' : ''}
    <div class="nm">${esc(c.name)}</div></${tag}>`;
}

function renderSlots() {
  const m = byKey();
  const html = [];
  for (let i = 0; i < DECK_SIZE; i++) {
    const k = state.locked[i];
    html.push(k ? cardHTML(m.get(k), { button: true }) : '<div class="slot">+</div>');
  }
  $('slots').innerHTML = html.join('');
  $('lockCount').textContent = `${state.locked.length}/${DECK_SIZE}`;
}

function matchesFilter(c) {
  const r = rolesOf(c.key);
  switch (state.filter) {
    case 'win': return r.has('win');
    case 'spell': return c.type === 'spell';
    case 'building': return c.type === 'building';
    case 'air': return r.has('air');
    default: return true;
  }
}

function renderGrid() {
  const q = state.search.trim().toLowerCase();
  const list = state.cards
    .filter((c) => state.showMissing || state.editOwned || isOwned(c.key))
    .filter((c) => !q || c.name.toLowerCase().includes(q))
    .filter(matchesFilter)
    .sort((a, b) => (state.editOwned ? 0 : isOwned(b.key) - isOwned(a.key)) || a.elixir - b.elixir || a.name.localeCompare(b.name));
  $('grid').innerHTML = list.length ? list.map((c) => cardHTML(c, { button: true })).join('') : '<p class="empty">No cards match.</p>';
}

function toggleOwned(key) {
  if (state.player) return notice('Your cards come from your player tag right now, so they can\'t be edited here.');
  if (!state.owned) state.owned = new Map();
  if (state.owned.has(key)) state.owned.delete(key);
  else state.owned.set(key, { level: 0, evo: false });
  if (!state.owned.size) state.owned = null;
  state.locked = state.locked.filter(isOwned);
  saveManualOwned();
  renderOwnedBar(); renderSlots(); renderGrid();
}

function renderOwnedBar() {
  const n = state.owned ? state.owned.size : 0;
  $('ownedCount').textContent = state.player ? `${n} cards loaded from your tag`
    : n ? `${n}/${state.cards.length} cards marked as yours` : 'No cards marked yet, so every card counts as yours';
  $('editOwnedBtn').textContent = state.editOwned ? '✅ Done' : '✏️ Mark cards I have';
  $('editOwnedBtn').hidden = !!state.player;
  $('bulkOwned').hidden = !state.editOwned;
  $('grid').classList.toggle('editing', state.editOwned);
}

function toggleLock(key) {
  if (state.editOwned) return toggleOwned(key);
  if (!isOwned(key)) return;
  const i = state.locked.indexOf(key);
  if (i >= 0) state.locked.splice(i, 1);
  else if (state.locked.length < DECK_SIZE) state.locked.push(key);
  else return notice('You already picked 8 cards. Remove one first, or hit Suggest.');
  notice('');
  renderSlots();
  renderGrid();
}

function renderPlayer() {
  const p = state.player;
  $('player').hidden = !p;
  if (!p) return;
  $('player').innerHTML = `<b>${esc(p.name)}</b><span class="stat">${esc(p.tag)}</span>
    <span class="stat">🏆 ${p.trophies}</span><span class="stat">${esc(p.arena || '')}</span>
    <span class="stat">${p.cards.length}/${state.cards.length} cards unlocked</span>
    ${p.currentDeck?.length === 8 ? '<button class="btn ghost small" id="useCurrent" type="button">Start from my current deck</button>' : ''}`;
  $('useCurrent')?.addEventListener('click', () => {
    const keyById = new Map(state.cards.map((c) => [c.id, c.key]));
    state.locked = p.currentDeck.map((id) => keyById.get(id)).filter(Boolean);
    renderSlots(); renderGrid();
  });
}

function runSuggest() {
  const pool = buildPool(ARCHETYPES, state.liveDecks, state.cards);
  const results = suggest({ cards: state.cards, owned: state.owned, locked: state.locked, pool, count: 5 });
  const m = byKey();
  $('resultsPanel').hidden = false;
  if (!results.length) {
    $('results').innerHTML = '<p class="empty">Not enough unlocked cards to build a full deck.</p>';
    return;
  }
  $('results').innerHTML = results.map((r, i) => {
    const ids = r.cards.map((k) => m.get(k).id);
    return `<article class="result">
      <div class="result-head"><h3>${i + 1}. ${esc(r.name)}</h3>
        <div class="meta"><span class="el">💧 ${r.avgElixir} avg</span>${r.avgLevel ? `<span>Avg level ${r.avgLevel}</span>` : ''}<span>Synergy ${r.synergy}</span></div></div>
      <div class="deck">${r.cards.map((k) => cardHTML(m.get(k))).join('')}</div>
      ${r.reasons.length ? `<ul class="reasons">${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <div class="actions">
        <a class="btn primary small" href="${esc(copyDeckLink(ids))}" target="_blank" rel="noopener">Copy to Clash Royale</a>
        <button class="btn ghost small" type="button" data-use="${esc(r.cards.join(','))}">Edit this deck</button>
      </div></article>`;
  }).join('');
  $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadPlayer(raw) {
  const tag = String(raw || '').trim().replace(/^#/, '');
  if (!tag) return notice('Enter your player tag. You can find it under your name on your profile in the game.');
  $('loadBtn').disabled = true;
  $('loadBtn').textContent = 'Loading…';
  try {
    const p = await getJSON(`/api/player?tag=${encodeURIComponent(tag)}`);
    state.player = p;
    state.owned = normalizeCollection(p.cards, state.cards);
    state.locked = state.locked.filter(isOwned);
    store.set('cr-tag', tag);
    notice('');
  } catch (e) {
    notice(e.message, 'error');
  } finally {
    $('loadBtn').disabled = false;
    $('loadBtn').textContent = 'Load my cards';
  }
  renderPlayer(); renderOwnedBar(); renderSlots(); renderGrid();
}

async function boot() {
  const saved = store.get('cr-tag') || DEFAULT_TAG;
  $('tagInput').value = `#${saved}`;
  state.owned = loadManualOwned();
  renderOwnedBar(); renderSlots(); renderGrid();

  if (STATIC) { $('tagForm').hidden = true; return; }
  let keyMissing = false;
  try {
    const { items } = await getJSON('/api/cards');
    state.cards = normalizeCards(items, FALLBACK_CARDS);
  } catch (e) {
    keyMissing = e.status === 503;
    notice(keyMissing
      ? 'No Clash Royale API key is set up, so loading by tag is off. Tap "Mark cards I have" below instead.'
      : `Could not load the live card list (${e.message}). Using the built-in list.`);
  }
  renderSlots(); renderGrid();

  getJSON('/api/meta').then((m) => { state.liveDecks = m.decks || []; }).catch(() => {});
  if (keyMissing) return;
  loadPlayer(saved);
}

$('tagForm').addEventListener('submit', (e) => { e.preventDefault(); loadPlayer($('tagInput').value); });
$('grid').addEventListener('click', (e) => { const b = e.target.closest('[data-key]'); if (b) toggleLock(b.dataset.key); });
$('slots').addEventListener('click', (e) => { const b = e.target.closest('[data-key]'); if (b) toggleLock(b.dataset.key); });
$('results').addEventListener('click', (e) => {
  const b = e.target.closest('[data-use]');
  if (!b) return;
  state.locked = b.dataset.use.split(',');
  renderSlots(); renderGrid();
  $('slots').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
$('clearBtn').addEventListener('click', () => { state.locked = []; renderSlots(); renderGrid(); });
$('suggestBtn').addEventListener('click', runSuggest);
$('editOwnedBtn').addEventListener('click', () => {
  state.editOwned = !state.editOwned;
  notice(state.editOwned ? 'Tap every card you have unlocked. Greyed-out cards are ones you don\'t have.' : '');
  renderOwnedBar(); renderGrid();
});
$('bulkOwned').addEventListener('click', (e) => {
  const b = e.target.closest('[data-bulk]');
  if (!b) return;
  const r = b.dataset.bulk;
  if (r === 'none') state.owned = null;
  else {
    if (!state.owned) state.owned = new Map();
    for (const c of state.cards) if (r === 'all' || c.rarity === r) state.owned.set(c.key, { level: 0, evo: false });
  }
  saveManualOwned(); renderOwnedBar(); renderSlots(); renderGrid();
});
$('deckLinkForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const ids = parseDeckLink($('deckLinkInput').value);
  const keyById = new Map(state.cards.map((c) => [c.id, c.key]));
  const keys = ids.map((id) => keyById.get(id)).filter(Boolean);
  if (!keys.length) return notice('No cards found in that link. In Clash, open a deck, tap Share, then Copy link, and paste it here.', 'error');
  // A deck you play is a deck you own: add its cards to a hand-marked collection.
  if (!state.player) {
    if (state.owned) { for (const k of keys) state.owned.set(k, { level: 0, evo: false }); saveManualOwned(); }
  }
  state.locked = keys.filter(isOwned);
  $('deckLinkInput').value = '';
  notice(`Loaded ${keys.length} cards from your deck link.`);
  renderOwnedBar(); renderSlots(); renderGrid();
});
$('search').addEventListener('input', (e) => { state.search = e.target.value; renderGrid(); });
$('showMissing').addEventListener('change', (e) => { state.showMissing = e.target.checked; renderGrid(); });
$('chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  state.filter = b.dataset.f;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
  renderGrid();
});

boot();
