import { cr, send, ApiError } from './_cr.js';

export default async function handler(req, res) {
  try {
    const data = await cr('/cards');
    send(res, 200, { items: [...(data.items || []), ...(data.supportItems || [])].filter((c) => c.id < 29000000) }, 86400);
  } catch (e) {
    send(res, e instanceof ApiError ? e.status : 500, { error: e.message });
  }
}
