// Local dev server: serves the static site and runs api/*.js like Vercel does.
// Usage: CR_API_KEY=... node dev-server.js  (then open http://localhost:3000)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
    try {
      const { default: handler } = await import(`./api/${name}.js`);
      req.query = Object.fromEntries(url.searchParams);
      res.status = (code) => { res.statusCode = code; return res; };
      res.send = (body) => res.end(body);
      return await handler(req, res);
    } catch {
      res.statusCode = 404; return res.end('{"error":"not found"}');
    }
  }
  const path = normalize(join(root, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!path.startsWith(root) || path.includes('/api/') || path.includes('/tests/')) { res.statusCode = 404; return res.end(); }
  try {
    const body = await readFile(path);
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end('not found'); }
}).listen(process.env.PORT || 3000, () => console.log(`DeckForge on http://localhost:${process.env.PORT || 3000}`));
