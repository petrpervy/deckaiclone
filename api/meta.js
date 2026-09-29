// Current decks of top Path of Legends / ladder players: a live deck database
// straight from the official API. Cached at the edge for 6 hours.
import { cr, send, ApiError } from './_cr.js';

const PLAYERS = 80;

async function topPlayerTags() {
  const attempts = [
    `/locations/global/pathoflegend/players?limit=${PLAYERS}`,
    `/locations/global/rankings/players?limit=${PLAYERS}`,
  ];
  for (const path of attempts) {
    try {
      const data = await cr(path);
      if (data.items?.length) return { tags: data.items.map((p) => p.tag), source: path.split('?')[0] };
    } catch (e) {
      if (e.status === 403 && /whitelist|key/i.test(e.message)) throw e;
    }
  }
  return { tags: [], source: null };
}

export default async function handler(req, res) {
  try {
    const { tags, source } = await topPlayerTags();
    const decks = [];
    for (let i = 0; i < tags.length; i += 10) {
      const batch = await Promise.allSettled(tags.slice(i, i + 10).map((t) => cr(`/players/${encodeURIComponent(t)}`)));
      for (const r of batch) {
        const deck = r.status === 'fulfilled' ? (r.value.currentDeck || []).map((c) => c.id) : [];
        if (deck.length === 8) decks.push(deck);
      }
    }
    send(res, 200, { decks, source, updated: new Date().toISOString() }, decks.length ? 21600 : 0);
  } catch (e) {
    send(res, e instanceof ApiError ? e.status : 500, { error: e.message, decks: [] });
  }
}
