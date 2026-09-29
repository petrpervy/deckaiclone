import { cr, send, normalizeTag, ApiError } from './_cr.js';

export default async function handler(req, res) {
  const tag = normalizeTag(req.query.tag);
  if (!tag) return send(res, 400, { error: 'That does not look like a player tag (e.g. #2PP).' });
  try {
    const p = await cr(`/players/%23${tag}`);
    send(res, 200, {
      tag: p.tag, name: p.name, expLevel: p.expLevel, trophies: p.trophies, arena: p.arena?.name,
      cards: (p.cards || []).map((c) => ({
        id: c.id, name: c.name, level: c.level, maxLevel: c.maxLevel, rarity: c.rarity,
        evolutionLevel: c.evolutionLevel || 0, count: c.count,
      })),
      currentDeck: (p.currentDeck || []).map((c) => c.id),
    }, 60);
  } catch (e) {
    send(res, e instanceof ApiError ? e.status : 500, { error: e.message });
  }
}
