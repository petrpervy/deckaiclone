// Server-side helper for the official Clash Royale API.
// Defaults to the RoyaleAPI proxy so the key can be locked to one IP
// (45.79.218.79) even though Vercel functions have no static IP.
const BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function cr(path) {
  const key = process.env.CR_API_KEY;
  if (!key) throw new ApiError(503, 'Server is missing CR_API_KEY. See README for setup.');
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!res.ok) {
    let reason = '';
    try { reason = (await res.json()).reason || ''; } catch {}
    const msg = res.status === 404 ? 'Player not found. Check the tag.'
      : res.status === 403 ? `API key rejected (${reason || 'accessDenied'}). Is IP 45.79.218.79 whitelisted?`
      : `Clash Royale API error ${res.status} ${reason}`.trim();
    throw new ApiError(res.status, msg);
  }
  return res.json();
}

export function send(res, status, body, cacheSeconds = 0) {
  res.setHeader('Content-Type', 'application/json');
  if (cacheSeconds) res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`);
  res.status(status).send(JSON.stringify(body));
}

export function normalizeTag(tag) {
  const t = String(tag || '').toUpperCase().replace(/^#/, '').replace(/O/g, '0').trim();
  return /^[0289PYLQGRJCUV]{3,12}$/.test(t) ? t : null;
}
