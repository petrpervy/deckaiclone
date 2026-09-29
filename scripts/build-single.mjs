// Bundles the site into one self-contained HTML file (no server, no API calls).
// The result runs in "mark your cards" mode. Usage: node scripts/build-single.mjs [out.html]
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const strip = (js) => js.replace(/^import .*$/gm, '').replace(/^export /gm, '');

const modules = ['lib/cards-fallback.js', 'lib/roles.js', 'lib/decks.js', 'lib/engine.js', 'app.js'];
const js = (await Promise.all(modules.map(read))).map(strip).join('\n');
const html = await read('index.html');
const css = await read('style.css');

const title = html.match(/<title>.*<\/title>/)[0];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script type="module" src="\/app.js"><\/script>/, '');
const out = `${title}\n<style>\n${css}</style>\n${body}\n<script>window.DECKFORGE_STATIC = true;</script>\n<script type="module">\n${js}</script>\n`;

const dest = process.argv[2] || 'dist/deckforge.html';
await writeFile(new URL(dest, root), out);
console.log(`wrote ${dest} (${out.length} bytes)`);
