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

## Setup (one time, about 5 minutes)

1. Go to <https://developer.clashroyale.com>, create an account, and create an API key.
   In **Allowed IP addresses**, enter `45.79.218.79`. That's the [RoyaleAPI proxy](https://docs.royaleapi.com/proxy), which lets serverless hosts without a fixed IP use the API.
2. In Vercel → Project → Settings → Environment Variables, add `CR_API_KEY` = your key, then redeploy.
3. Open the site, paste your tag (e.g. `#2PP`), and press **Load my cards**.

Without a key the site runs in **demo mode**: every card counts as unlocked and there's no card art.

Optional: set `CR_API_BASE` to use a different proxy, or `https://api.clashroyale.com/v1` if your server has a static IP.

## Local development

```bash
CR_API_KEY=... npm run dev   # http://localhost:3000
npm test                     # engine unit tests
```

Not affiliated with or endorsed by Supercell.
