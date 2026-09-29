# DeckForge: a Clash Royale deck suggester for your own cards

Pick the cards you want to play (0–8). DeckForge fills in the rest using **only cards you have unlocked**, and it favours your highest-level cards. Suggestions come from two sources: decks that top players are using right now, and a list of proven archetypes.

## How it works

| Piece | What it does |
|---|---|
| `api/player.js` | Loads your profile by player tag from the **official Clash Royale API**: every card you own, its level, evolutions, and your current deck. |
| `api/cards.js` | Loads the live card list, including art and any new cards. |
| `api/meta.js` | A live deck database: fetches the current decks of the top ~80 Path of Legends players. The result is cached for 6 hours. |
| `lib/decks.js` | About 26 hand-curated archetypes, used as a starting point (a "prior") for suggestions. |
| `lib/engine.js` | The suggestion engine. It adapts known decks around the cards you picked, swaps out cards you haven't unlocked for similar ones you have, and scores each deck on card synergy, having a win condition, cheap and big spells, anti-air, average elixir and your card levels. |

There is no Supercell login. The only way to "connect" an account is by **player tag**, because profile data is public. It's the same approach DeckShop, RoyaleAPI and Deck AI use.

## Using it without an API key

The game can't send your collection to a website, so without a key you tell the site what you have:

1. Tap **✏️ Mark cards I have**, use the quick-add buttons (e.g. "All commons"), and tap the rest. Your browser remembers the list.
2. Optional: in Clash, open a deck → **Share** → **Copy link**, then paste the link into the box under your picks. Its cards fill your picks and are added to your collection.
3. Press **Suggest decks**, then **Copy to Clash Royale** to open the deck in the game.

Card levels and card art only show up once an API key is set (below).

## Loading your cards by player tag (optional, about 5 minutes)

1. Go to <https://developer.clashroyale.com>, create an account, and create an API key.
   In **Allowed IP addresses**, enter `45.79.218.79`. That's the [RoyaleAPI proxy](https://docs.royaleapi.com/proxy), which lets serverless hosts without a fixed IP use the API.
2. In Vercel → Project → Settings → Environment Variables, add `CR_API_KEY` = your key, then redeploy.
3. Open the site, paste your tag (e.g. `#2PP`), and press **Load my cards**.

Without a key, loading by tag is off and the site falls back to marking cards by hand (above).

Optional: set `CR_API_BASE` to use a different proxy, or `https://api.clashroyale.com/v1` if your server has a static IP.

## Single-file version

`node scripts/build-single.mjs` writes `dist/deckforge.html`, a self-contained page with no server and no API calls. It runs in mark-your-cards mode and can be hosted anywhere static.

## Local development

```bash
CR_API_KEY=... npm run dev   # http://localhost:3000
npm test                     # engine unit tests
```

Not affiliated with or endorsed by Supercell.
