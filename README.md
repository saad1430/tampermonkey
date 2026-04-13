# Movie/TV Shows Links Aggregator

> A Tampermonkey userscript that surfaces streaming links, torrent options, trailers, and metadata for any movie or TV show — right from your Google/Bing search results, IMDb, Trakt, or YTS pages.

**Current version:** `1.7.7` &nbsp;|&nbsp; **Author:** [Saad1430](https://github.com/saad1430) &nbsp;|&nbsp; **License:** MIT

---

## What does it do?

When you search for a movie or TV show on Google or Bing, the script automatically detects it and adds a card to your results with everything you need in one place:

- **TMDb & IMDb IDs** — click to copy either one instantly
- **Streaming links** — a curated list of working players, updated regularly. CineSrc.st also supports direct download, shown inline next to its watch link
- **Frontend links** — full-featured movie sites (Cineby, CinemaOS, ShuttleTV, Hexa, and more)
- **Torrent links** — direct magnet links from YTS (movies), plus shortcuts to 1337x, EZTV, TPB, and others
- **Stremio deep-link** — opens the title directly in your Stremio app
- **Trakt links** — jump straight to the title on app.trakt.tv
- **Watch Trailer** — plays the official YouTube trailer in a popup, no new tab needed
- **Content rating** — fetches the MPAA/TV certification (e.g. PG-13, TV-MA)

For **TV shows** specifically, you also get episode controls — pick any season and episode and all the player links update automatically.

---

## Where does it work?

| Site | What happens |
|---|---|
| Google Search | Auto-detects movie/TV searches and injects the info card |
| Bing Search | Same as Google |
| DuckDuckGo | Same as Google (not implemented yet) |
| Brave Search | Same as Google (not implemented yet) |
| IMDb title pages | Adds a **▶ Play** button next to the watchlist button (or use **Shift+P**) |
| Trakt pages | Adds a play icon to the actions bar / hooks Trakt’s **Watch** action to open the overlay (or use **Shift+P**) |
| YTS movie pages | Adds a **Play** button next to the download button |

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser (Chrome, Firefox, Edge, Safari)
2. Open [`movies-tv-series.user.js`](https://github.com/saad1430/tampermonkey/raw/main/movies-tv-series.user.js) — Tampermonkey will prompt you to install it
3. Click **Install**
4. On first run, you'll be asked for **TMDb API key(s)** — get one free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
5. Paste your key (or multiple keys, comma-separated) and hit OK — you're done


> You can add multiple API keys (comma-separated) in the settings panel under the **TMDb API keys** section. The script rotates between them automatically, which helps avoid hitting TMDb's rate limits.

The script includes `@updateURL` and `@downloadURL` headers pointing to this repo, so Tampermonkey can check for and apply updates automatically.
---

## Settings

Press **Shift+R** on any supported page to open the settings panel.

You can also click the **⚙** floating button that appears in the bottom-right corner.

Most settings apply **instantly** (the current info card re-renders on save), so you usually don’t need to refresh the page.

### Available toggles

| Setting | What it does |
|---|---|
| Auto-detect Movies/TV | Automatically shows the card when a media search is detected |
| Google / Bing / IMDb / Trakt / YTS support | Turn the script on or off per site |
| Streaming links | The main list of watch links |
| Frontend links | Cineby, CinemaOS, ShuttleTV, Hexa, etc. |
| Torrent sites | 1337x, EZTV, LimeTorrents, TPB, etc. |
| Open links in new tab | All links in the info card open in a new tab (on by default) |
| YTS Direct Magnets | Pulls live magnet links directly from YTS (movies only) |
| "Open in Stremio" link | Deep link to open in your Stremio app |
| Trakt link | Adds a direct app.trakt.tv link under the IMDb ID |
| Trakt search results link | Adds a Trakt search link as a separate toggle from the direct link |
| Allow changing episode number | Shows season/episode selectors for TV shows |
| Watch trailer button | Plays the official trailer in an in-page popup |
| Autoplay trailer | Auto-starts the trailer when opened (mind your volume) |
| Change result button | Lets you pick a different TMDb result if the first one is wrong |
| Certification | Displays the content rating (e.g. PG-13, TV-MA) |
| Transparency/Glassy mode | Makes modals and panels use a frosted-glass look |
| Theme | Switch between **TMDb**, **IMDb**, **Trakt**, or a **Custom** colour scheme |
| Notifications | Toast notifications for actions and status |

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Shift+R` | Open/close settings panel |
| `Shift+P` | Toggle the streaming links overlay (on IMDb and Trakt pages) |

---

## How the auto-detect works

On Google and Bing, the script scans the page for signs that you're searching for a movie or TV show — things like JSON-LD schema data, links to IMDb/TMDb/Rotten Tomatoes, and knowledge panel keywords. If it finds a match, the info card appears automatically. If it doesn't auto-detect, a **"Search Movie/TV Info"** button will appear at the top of results that you can click manually.

---

## For TV shows: changing episodes

When the info card is showing for a TV show, click **"Play another episode"** to reveal season and episode dropdowns. Once you pick your episode and hit **"Update player links"**, all the streaming links in the card update to point directly to that episode. The script validates your choice against the TMDb season data first so you won't get broken links.

Torrent shortcuts that support it (like **Knaben** and **EXT**) will also show an episode-specific search link (e.g. `S03E03`) and update it when you change episodes.

---

## Notes on streaming links

The script constructs links to third-party streaming sites — it does not host any content itself. Some sites may not have every title. Availability varies by region. Use in accordance with the laws in your country.

For **torrents**, YTS magnet links are fetched live and include quality, file size, codec, audio channel info, and seeder/peer counts so you can make an informed choice before downloading.

---

## Troubleshooting

**The card didn't appear automatically**
→ Click the "Search Movie/TV Info" button at the top of results. You can also try adding more specific terms to your search (e.g. the year or "movie").

**"No API key" prompt keeps appearing**
→ Open settings with Shift+R, scroll to the API keys field, and paste your key there.

**Trailer says "No trailer found"**
→ TMDb doesn't have a trailer listed for that title. Check the TMDb page directly.

**Links aren't updating when I change episodes**
→ Make sure "Allow changing episode" is enabled in settings.

**Play button not showing on IMDb**
→ IMDb sometimes changes their page layout. Try pressing **Shift+P** as a fallback — it triggers the overlay directly.
  > If that happens, please open an issue in the repo or talk to me directly at [discord](https://discord.gg/sTVCTf8Qtd)

---

## Other scripts in this repo

This repo also contains a few personal-use scripts:

- `bing-search-automation.user.js` — Automates randomized Bing searches (for rewards points)
- `twitch-drop-claim.user.js` — Auto-claims Twitch drops on the inventory page
- `swiftuploads-download-automation.user.js` — Download automation for SwiftUploads
- `yts-enhancer.user.js` — Extra enhancements for YTS pages

These are personal backups and not actively maintained or documented.

---

## Contributing

Pull requests are welcome. If you're fixing a bug or updating a streaming site, please keep the userscript `@version` bumped and describe your changes clearly in the PR.

---

## Special Thanks

[FMHY](https://fmhy.net)

---

## License

This project is licensed under the **MIT License**.