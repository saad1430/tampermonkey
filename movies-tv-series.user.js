// ==UserScript==
// @name         Movie/TV Shows Links enhancer
// @namespace    http://tampermonkey.net/
// @version      1.4.6
// @description  Shows TMDb/IMDb IDs, optional streaming/torrent links, and includes a Shift+R settings panel to toggle features.
// @author       Saad1430
// @match        https://www.google.com/search*
// @match        https://www.bing.com/search*
// @match        https://www.imdb.com/title/*
// @match        https://imdb.com/title/*
// @match        https://trakt.tv/movies/*
// @match        https://trakt.tv/shows/*
// @match        https://app.trakt.tv/movies/*
// @match        https://app.trakt.tv/shows/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(async function () {
  'use strict';

  /* ----------------------------------------------------
   * Settings (persisted) + Styles
   * -------------------------------------------------- */
  const DEFAULT_SETTINGS = {
    autoDetectOnSERP: true,          // auto-run on media-like SERP
    enableOnGooglePage: true,        // enable features on Google search pages
    enableOnBingPage: true,          // enable features on Bing search pages
    enableOnImdbPage: true,          // enable features on IMDb title pages
    enableOnTraktPage: true,         // enable features on Trakt title pages
    enableNotifications: true,       // toast notifications
    enableStreamingLinks: true,      // the big list of watch links
    enableFrontendLinks: true,       // cineby/flixer/velora/etc
    enableTorrentSiteShortcuts: true,// 1337x, EZTV, etc
    enableYtsTorrents: true,         // live torrents from YTS (movies only)
    enableStremioLink: true,         // stremio:// deep link
    enableTraktLink: true,           // show Trakt search link under IMDb
    enableEpisodeSelection: true,    // allow changing episode number when playing TV
    enableTrailerButton: true,       // show Watch trailer button
    enableTrailerAutoPlay: false,    // auto-play trailer when opened
    enableChangeResultButton: true,  // show Change result button when multiple TMDb results
    showCertifications: true,        // fetch + display MPAA/TV rating
  };


  /* ----------------------------------------------------
  * Announcements (What's New)
  * -------------------------------------------------- */

  const ANNOUNCEMENT_VERSION = "1.4.6";
  const ANNOUNCEMENT_MESSAGE = `
    <h2 style="margin:0 0 10px 0;">What's New in v${ANNOUNCEMENT_VERSION}</h2>
    <ul style="margin-left:20px; line-height:1.5;">
      <li>Added YTS language display in torrent links</li>
      <li>Improved torrent UI formatting</li>
      <li>Playing trailer now try to close all the other overlays</li>
      <li>Added announcement system to display "What's New" once per update</li>
    </ul>
  `;

  function maybeShowAnnouncement() {
    const seenVersion = GM_getValue("announcement_seen_version", null);
    if (seenVersion === ANNOUNCEMENT_VERSION) return; // already seen

    // Show modal
    showAnnouncementModal(ANNOUNCEMENT_MESSAGE + `<p style="opacity:0.7;">(This message will only appear once. If you want to see it again, refer to settings panel and click show latest announcement)</p>`);

    // Mark as seen
    GM_setValue("announcement_seen_version", ANNOUNCEMENT_VERSION);
  }

  function showAnnouncementModal(messageHTML) {
    // Remove if already present
    document.querySelector('.tmdb-announcement-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'tmdb-announcement-overlay';
    overlay.innerHTML = `
    <div class="tmdb-announcement-box">
      <button class="tmdb-announcement-close">✕</button>
      <div class="tmdb-announcement-content">${messageHTML}</div>
    </div>
  `;

    document.body.appendChild(overlay);

    overlay.querySelector('.tmdb-announcement-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  /* ----------------------------------------------------
  * Load/Save Settings
  * -------------------------------------------------- */

  function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(GM_getValue('tmdb_settings', '{}')) || {}) }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings(s) { GM_setValue('tmdb_settings', JSON.stringify(s)); }

  let SETTINGS = loadSettings();
  maybeShowAnnouncement();

  /* ----------------------------------------------------
  * Styles
  * -------------------------------------------------- */

  GM_addStyle(`
    .tmdb-settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center}
    .tmdb-settings{width:min(560px,94vw);max-height:88vh;overflow:auto;background:#0b1a2b;color:#e9f1f7;border:1px solid #1bb8d9;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
    .tmdb-settings header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(27,184,217,.35)}
    .tmdb-settings header h2{margin:0;font-size:18px}
    .tmdb-settings .body{padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .tmdb-settings .body .full{grid-column:1/-1}
    .tmdb-settings label{display:flex;gap:8px;align-items:center;padding:8px 10px;background:#0f2640;border:1px solid rgba(255,255,255,.06);border-radius:8px}
    .tmdb-settings .row{display:flex;gap:8px;align-items:center}
    .tmdb-settings input[type="text"], .tmdb-settings textarea{width:100%;background:#071221;color:#e9f1f7;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:8px}
    .tmdb-settings footer{display:flex;gap:8px;justify-content:flex-end;padding:14px 16px;border-top:1px solid rgba(27,184,217,.35)}
    .tmdb-btn{cursor:pointer;border:none;border-radius:8px;padding:8px 12px;font-weight:600}
    .tmdb-btn.primary{background:#1bb8d9;color:#062538}
    .tmdb-btn.ghost{background:transparent;color:#1bb8d9;border:1px solid #1bb8d9}

    .tmdb-notification{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(3,37,65,.95);color:#1bb8d9;padding:12px 16px;border-radius:8px;z-index:999998;box-shadow:0 6px 20px rgba(0,0,0,.35);opacity:0;transition:opacity .2s ease}
    .tmdb-notification.show{opacity:1}

    .tmdb-info-card{padding:10px;background:rgba(3,37,65,0.1);border-left:5px solid #1bb8d9;margin-bottom:12px;font-family:Arial;user-select:none;position:relative}
    .tmdb-info-card .tmdb-title{font-size:18px;font-weight:bold}
    .tmdb-info-card .tmdb-toggle{position:absolute;top:10px;right:10px;padding:4px 10px;background:#1bb8d9;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer}
    .tmdb-copy{cursor:pointer}

  /* nicer selects for season/episode controls */
  #tmdb-play-controls select{background:#071221;color:#e9f1f7;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:6px 8px;font-weight:600}
  #tmdb-play-controls button{vertical-align:middle}
  .tmdb-play-controls select{background:#071221;color:#e9f1f7;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:6px 8px;font-weight:600}
  .tmdb-play-controls button{vertical-align:middle}

    #tmdb-button{margin:10px 0;padding:8px 12px;background:rgb(3,37,65);color:#1bb8d9;border:1px solid #1bb8d9;border-radius:4px;cursor:pointer;font-weight:bold;user-select:none}
    #tmdb-button:hover{background:#1bb8d9;color:rgb(3,37,65);border-color:rgb(3,37,65)}
  /* floating settings button */
  #tmdb-fab-settings{position:fixed;right:14px;bottom:14px;width:44px;height:44px;border-radius:50%;background:#1bb8d9;color:#062538;border:none;box-shadow:0 6px 18px rgba(0,0,0,.35);z-index:1000000;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px}
  #tmdb-fab-settings:hover{transform:scale(1.05)}
  /* trailer button + modal */
  .tmdb-trailer-btn{margin-left:8px}
  .tmdb-trailer-modal{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000001;display:flex;align-items:center;justify-content:center}
  /* make modal ~85% of screen width and height managed automatically via aspect-ratio
    cap height to 85vh to keep it visible on small screens */
  .tmdb-trailer-content{width:80vw;max-width:1900px;aspect-ratio:16/9;height:auto;max-height:95vh;background:#000;border-radius:8px;overflow:hidden;position:relative}
  .tmdb-trailer-content iframe{width:100%;height:100%;border:0;background:#000}
  .tmdb-trailer-close{position:absolute;right:8px;top:8px;z-index:10;background:rgba(255,255,255,.06);border:none;color:#fff;border-radius:6px;padding:6px 8px;cursor:pointer}
  .tmdb-announcement-overlay {position: fixed;inset: 0;background: rgba(0,0,0,0.75);z-index: 9999999;display: flex;align-items: center;justify-content: center;}
  .tmdb-announcement-box {background: rgb(3,37,65);color: #e9f1f7;border-radius: 12px;padding: 20px 24px;width: min(90vw, 450px);box-shadow: 0 0 30px rgba(0,0,0,0.5);position: relative;animation: fadeIn 0.25s ease-out;}
  .tmdb-announcement-close {position: absolute;right: 10px;top: 8px;background: rgba(255,255,255,0.1);border: none;color: #fff;border-radius: 4px;padding: 4px 8px;cursor: pointer;}
  .tmdb-announcement-content {margin-top: 10px;font-size: 15px;}
  @keyframes fadeIn {from { opacity: 0; transform: scale(0.95); }to { opacity: 1; transform: scale(1); }}
  `);

  /* ----------------------------------------------------
   * API Keys setup (unchanged behavior)
   * -------------------------------------------------- */
  let apiKeys = GM_getValue('tmdb_api_keys', null);
  if (!apiKeys) {
    const keysInput = prompt("To get your API key visit https://www.themoviedb.org/settings/api. Enter your TMDb API keys, separated by commas:");
    if (keysInput) {
      apiKeys = keysInput.split(',').map(k => k.trim());
      GM_setValue('tmdb_api_keys', JSON.stringify(apiKeys));
      showNotification("API keys setup successfully. You can manage them via Shift+R → Settings.", 6000);
    } else {
      showNotification("No API keys entered. Script cannot continue.");
      return;
    }
  } else { apiKeys = JSON.parse(apiKeys); }

  let currentKeyIndex = 0;

  /* ----------------------------------------------------
   * Env & Query Helpers (kept from original)
   * -------------------------------------------------- */
  const hostname = location.hostname;
  const isGoogle = hostname.includes('google.');
  const isBing = hostname.includes('bing.com');
  const isDuckDuckGo = hostname.includes('duckduckgo.com');
  const isImdb = hostname.includes('imdb.com');
  const isTrakt = hostname.includes('trakt.tv');
  const isNewTrakt = hostname.includes('app.trakt.tv');

  function isSearch() {
    if (isGoogle || isBing || isDuckDuckGo) return true;
  }

  function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    if (isGoogle) return params.get('q');
    if (isBing) return params.get('q');
    if (isDuckDuckGo) return params.get('q');
    return null;
  }

  function getInsertionPoint() {
    if (isGoogle) return document.getElementById('search');
    if (isBing) return document.querySelector('#b_results');
    if (isDuckDuckGo) return document.querySelector('.results--main');
    return document.body;
  }

  const parent = getInsertionPoint();
  let cleanedQuery = null;

  if (isSearch()) {
    if (!parent) return;
    const queryRaw = getSearchQuery();
    if (!queryRaw) return;
    cleanedQuery = queryRaw.replace(/(watch|online|cast|movie|movies|tv|stream|showtimes|series|episodes|trakt|tmdb|imdb)/gi, '').replace(/\s+/g, ' ').trim();
  }

  /* ----------------------------------------------------
   * Notifications (respect setting)
   * -------------------------------------------------- */
  const notificationQueue = [];
  let notificationActive = false;

  function showNotification(message, duration = 3000) {
    if (!SETTINGS.enableNotifications) return;
    notificationQueue.push({ message, duration });
    if (!notificationActive) processQueue();
  }
  function processQueue() {
    if (notificationQueue.length === 0) { notificationActive = false; return; }
    notificationActive = true;
    const { message, duration } = notificationQueue.shift();
    const el = document.createElement('div');
    el.className = 'tmdb-notification';
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); processQueue(); }, 220); }, duration);
  }

  /* ----------------------------------------------------
   * Settings Panel (Shift+R)
   * -------------------------------------------------- */
  function openSettingsPanel() {
    if (document.querySelector('.tmdb-settings-overlay')) { closeSettingsPanel(); return; }

    const keysStr = JSON.parse(GM_getValue('tmdb_api_keys') || '[]').join(', ');

    const overlay = document.createElement('div');
    overlay.className = 'tmdb-settings-overlay';
    overlay.innerHTML = `
      <div class="tmdb-settings" role="dialog" aria-modal="true">
        <header>
          <h2>Movies/TV Shows Script Settings</h2>
          <button class="tmdb-btn ghost" id="tmdb-close">✕</button>
        </header>
        <div class="body">
          ${checkbox('autoDetectOnSERP', 'Auto-detect Movies/TV Shows', SETTINGS.autoDetectOnSERP)}
          ${checkbox('enableOnGooglePage', 'Enable on Google site', SETTINGS.enableOnGooglePage)}
          ${checkbox('enableOnBingPage', 'Enable on Bing site', SETTINGS.enableOnBingPage)}
          ${checkbox('enableOnImdbPage', 'Enable on IMDB site', SETTINGS.enableOnImdbPage)}
          ${checkbox('enableOnTraktPage', 'Enable on Trakt site', SETTINGS.enableOnTraktPage)}
          ${checkbox('enableNotifications', 'Enable notifications', SETTINGS.enableNotifications)}
          ${checkbox('enableStreamingLinks', 'Show streaming links', SETTINGS.enableStreamingLinks)}
          ${checkbox('enableFrontendLinks', 'Show frontend links', SETTINGS.enableFrontendLinks)}
          ${checkbox('enableTorrentSiteShortcuts', 'Show torrent sites', SETTINGS.enableTorrentSiteShortcuts)}
          ${checkbox('enableYtsTorrents', 'Fetch YTS torrents for movies', SETTINGS.enableYtsTorrents)}
          ${checkbox('enableStremioLink', 'Show “Open in Stremio” link', SETTINGS.enableStremioLink)}
          ${checkbox('enableTraktLink', 'Show Trakt link', SETTINGS.enableTraktLink)}
          ${checkbox('enableEpisodeSelection', 'Allow changing episode number when playing TV', SETTINGS.enableEpisodeSelection)}
          ${checkbox('enableTrailerButton', 'Show "Watch trailer" button', SETTINGS.enableTrailerButton)}
          ${checkbox('enableTrailerAutoPlay', 'Autoplay Trailer (beware of volume)<a href="https://www.mrfdev.com/enhancer-for-youtube" target="_blank">[for constant volumes use this extension]</a>', SETTINGS.enableTrailerAutoPlay)}
          ${checkbox('enableChangeResultButton', 'Show "Change result" button', SETTINGS.enableChangeResultButton)}
          ${checkbox('showCertifications', 'Show certification', SETTINGS.showCertifications)}

          <div class="full">
            <label class="full" style="flex-direction:column;align-items:flex-start">
              <span style="opacity:.85;margin-bottom:6px">TMDb API Keys (comma separated)</span>
              <textarea id="tmdb-keys" rows="3" placeholder="key1, key2, key3">${keysStr}</textarea>
            </label>
          </div>
        </div>
        <footer>
          <div class="full">
            <button class="tmdb-btn ghost" id="tmdb-show-announcement">
              Show latest announcement
            </button>
          </div>
          <button class="tmdb-btn primary" id="tmdb-save">Save & Apply</button>
        </footer>
      </div>`;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSettingsPanel(); });
    document.body.appendChild(overlay);

    document.getElementById('tmdb-close').onclick = closeSettingsPanel;
    document.getElementById('tmdb-save').onclick = () => {
      const next = { ...SETTINGS };
      Object.keys(DEFAULT_SETTINGS).forEach(k => {
        const el = overlay.querySelector(`#cb-${k}`);
        if (el) next[k] = !!el.checked;
      });
      const newKeysRaw = overlay.querySelector('#tmdb-keys').value.trim();
      if (newKeysRaw.length) {
        const arr = newKeysRaw.split(',').map(s => s.trim()).filter(Boolean);
        GM_setValue('tmdb_api_keys', JSON.stringify(arr));
        apiKeys = arr; currentKeyIndex = 0;
      }
      SETTINGS = next; saveSettings(SETTINGS);
      showNotification('Settings saved. They apply immediately for new actions; reload to re-run auto-detect.', 7000);
      closeSettingsPanel();
    };

    document.getElementById("tmdb-show-announcement").onclick = () => {
      closeSettingsPanel(); // close settings to avoid stacking modals
      showAnnouncementModal(ANNOUNCEMENT_MESSAGE);
    };
  }
  function closeSettingsPanel() {
    const ov = document.querySelector('.tmdb-settings-overlay');
    if (ov) ov.remove();
  }
  function checkbox(id, label, checked) {
    return `<label><input id="cb-${id}" type="checkbox" ${checked ? 'checked' : ''}> ${label}</label>`;
  }

  // Hotkey + touch long-press
  document.addEventListener('keydown', (e) => { if (e.shiftKey && e.key.toLowerCase() === 'r') openSettingsPanel(); });
  let touchTimer; document.addEventListener('touchstart', () => { touchTimer = setTimeout(openSettingsPanel, 1500); });
  document.addEventListener('touchend', () => clearTimeout(touchTimer));

  /* ----------------------------------------------------
   * Smart media detection (original logic retained)
   * -------------------------------------------------- */
  let isMedia = false;
  if (isGoogle && SETTINGS.enableOnGooglePage) {
    const rhsBlock = document.querySelector('#rhs');
    if (rhsBlock && /IMDb|TV series|Movie|Episodes|Run time/i.test(rhsBlock.innerText)) isMedia = true;
  } else if (isBing && SETTINGS.enableOnBingPage) {
    const bingBlock = document.querySelector('.b_entityTP') || document.querySelector('.b_vList');
    if (bingBlock) {
      const links = bingBlock.querySelectorAll('a[href*="imdb.com"], a');
      const foundMediaLink = Array.from(links).some(a => /imdb\.com|TV series|Movie|Episode|Run time|Rating|Release date/i.test(a.href + a.textContent));
      if (foundMediaLink) isMedia = true;
    }
    if (!isMedia && bingBlock?.innerText && /TV series|Movie|Episode/i.test(bingBlock.innerText)) isMedia = true;
  }

  /* ----------------------------------------------------
   * UI: Info Box Renderer (kept, now conditional by settings)
   * -------------------------------------------------- */
  function renderInfoBox(data, torrents = null, imdb = null, specifiedSeason = null, specifiedEpisode = null, ytsLanguage = null) {
    const tmdbID = data.id;
    const title = data.title || data.name || 'Unknown Title';
    const date = data.release_date || data.first_air_date || 'Unknown Date';
    const Type = data.media_type || 'Unknown';

    let vidType = '';
    let vidType1337 = '';
    let ET_cat = '1';
    let query = '';
    let smashQuery = '';
    let multiQuery = '';
    let html = '';
    let eztv = '';
    let imdb_link = '';
    // use specified season/episode if provided (e.g. Trakt preview links), otherwise default to 1
    let season_number = specifiedSeason ? Number(specifiedSeason) : 1;
    let episode_number = specifiedEpisode ? Number(specifiedEpisode) : 1;
    let torrentLinks = [];

    if (imdb) imdb_link = `https://www.imdb.com/title/${imdb}`;

    if (Type === 'movie') {
      vidType = 'movie';
      vidType1337 = 'Movies';
      if (SETTINGS.enableYtsTorrents && torrents) {
        torrentLinks = buildTorrentLinks(torrents, title);
        if (torrentLinks?.length) {
          html = `<div style="margin-top:6px;"><strong>Torrents:</strong><br/>`;
          torrentLinks.forEach(link => {
            html += `<a href="${link.magnet}" rel="noopener" style="color:#1bb8d9;font-weight:bold;">${link.quality} (${link.size}) - ${link.type} ${link.video} (Audio Channel: ${link.audio})${ytsLanguage ? ` - Lang: [${ytsLanguage.toUpperCase()}]` : ""} - Seeders:${link.seeds} Peers:${link.peers}</a><br/>`;
          });
          html += `</div>`;
        }
      }
    } else if (Type === 'tv') {
      vidType = 'tv'; vidType1337 = 'TV'; ET_cat = '2'; query = `/${season_number}/${episode_number}`; smashQuery = `?s=${season_number}&e=${episode_number}`; multiQuery = `&s=${season_number}&e=${episode_number}`;
      if (SETTINGS.enableTorrentSiteShortcuts && imdb) {
        eztv = `<a href="https://eztvx.to/search/${imdb}" target="_blank" style="color:#1bb8d9;font-weight:bold;">EZTVx.to ↗</a> - <a href="https://eztv1.xyz/search/${imdb}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Mirror 1 ↗</a> - <a href="https://eztv.yt/search/${imdb}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Mirror 2 ↗</a><br/>`;
      }
    } else {
      showNotification('No Results found!'); hideButton(); return;
    }

    const container = document.createElement('div');
    container.className = 'tmdb-info-card';
    container.innerHTML = `
      <button class="tmdb-toggle" id="toggle-details-btn">Hide Details</button>
      <div class="tmdb-title">${title} (${date})</div>
      <div id="tmdb-details">
        <div>
          <strong>TMDb ID:</strong>
          <span style="color:#1bb8d9;background-color:rgb(3,37,65);" class="tmdb-copy" id="tmdb-id" title="Click to copy">${tmdbID}</span>
          <a href="https://themoviedb.org/${vidType}/${tmdbID}" target="_blank" style="color:#1bb8d9;font-weight:bold;">(TMDb ↗)</a>
        </div>
        <div>
          <strong>IMDb ID:</strong>
          <span style="color:black;background-color:rgb(226,182,22);" class="tmdb-copy" id="imdb-id" title="Click to copy">${imdb || ''}</span>
          ${imdb ? `<a href="https://www.imdb.com/title/${imdb}" target="_blank" style="color:rgb(226,182,22);font-weight:bold;">(IMDb ↗)</a>
                    <a href="https://www.imdb.com/title/${imdb}/parentalguide" target="_blank" style="color:rgb(226,182,22);font-weight:bold;">(Parental Guide ↗)</a>
                    ${SETTINGS.enableTraktLink ? `<a href="https://trakt.tv/search/imdb/${imdb}" target="_blank" style="color:#ff6f00;font-weight:bold;margin-left:6px;">(Trakt ↗)</a>` : ''}` : ''}
        </div>
        ${SETTINGS.enableStremioLink && imdb ? `<div style="margin-top:6px;"><a href="stremio://detail/${vidType}/${imdb}" style="color:#1bb8d9;font-weight:bold;">Open in Stremio ↗</a></div>` : ''}

        ${SETTINGS.enableStreamingLinks ? `
        <div style="margin-top:6px;">
          <a href="https://player.videasy.net/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VidEasy.net (fastest) ↗</a><br/>
          <a href="https://www.vidking.net/embed/${vidType}/${tmdbID}${query}?color=e50914" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VidKing.net ↗</a><br/>
          <a href="https://vidsrc.to/embed/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VidSrc.to ↗</a><br/>
          <a href="https://multiembed.mov/?video_id=${tmdbID}&tmdb=1${multiQuery}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on MultiEmbed.mov ↗</a><br/>
          <a href="https://spencerdevs.xyz/${vidType}/${tmdbID}?theme=ff0000${multiQuery}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on spencerdevs.xyz ↗</a><br/>
          <a href="https://111movies.com/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on 111Movies.com ↗</a><br/>
          <a href="https://vidora.su/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on Vidora.su ↗</a><br/>
          <a href="https://vidfast.pro/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VidFast.pro ↗</a><br/>
          <a href="https://player.smashy.stream/${vidType}/${tmdbID}${smashQuery}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on Smashy.stream ↗</a><br/>
        </div>` : ''}

        ${SETTINGS.enableFrontendLinks ? `
        <div style="margin-top:6px;">
          <strong>Watch on frontends:</strong><br/>
          <a href="https://www.cineby.gd/${vidType}/${tmdbID}${query}?play=true" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on Cineby.gd</a>
          <a href="https://www.cineby.gd/${vidType}/${tmdbID}" target="_blank" style="color:#1bb8d9;font-weight:bold;">(More Info)</a><br/>
          <a href="https://flixer.sh/watch/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on Flixer.sh ↗</a>
          <a href="https://flixer.sh/?${vidType}=${title}&id=${tmdbID}" target="_blank" style="color:#1bb8d9;font-weight:bold;">(More Info)</a><br/>
          <a href="https://veloratv.ru/watch/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VeloraTV.ru ↗</a><br/>
          <a href="https://xprime.tv/watch/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on xprime.tv ↗</a><br/>
        </div>` : ''}

        ${html}

        ${SETTINGS.enableTorrentSiteShortcuts ? `
        <div style="margin-top:6px;">
          <strong>Search on Torrent Sites:</strong><br/>
          <a href="https://1337x.to/category-search/${title}/${vidType1337}/1/" target="_blank" style="color:#1bb8d9;font-weight:bold;">1337x.to ↗</a> -
          <a href="https://1337x.to/category-search/${title}/${vidType1337}/1/" target="_blank" style="color:#1bb8d9;font-weight:bold;">Mirror 1 ↗</a> -
          <a href="https://x1337x.cc/category-search/${title}/${vidType1337}/1/" target="_blank" style="color:#1bb8d9;font-weight:bold;">Mirror 2 ↗</a><br/>
          ${eztv}
          <a href="https://www.limetorrents.lol/search/${vidType1337}/${title}" target="_blank" style="color:#1bb8d9;font-weight:bold;">LimeTorrents.lol ↗</a><br/>
          <a href="https://thepiratebay.org/search.php?q=${title}&video=on&search=Pirate+Search&page=0" target="_blank" style="color:#1bb8d9;font-weight:bold;">ThePirateBay.org ↗</a><br/>
          <a href="https://extratorrent.st/search/?new=1&search=${title}&s_cat=${ET_cat}" target="_blank" style="color:#1bb8d9;font-weight:bold;">ExtraTorrent.st ↗</a><br/>
          <a href="https://rutor.is/search/${title}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Rutor.is ↗</a><br/>
        </div>` : ''}
      </div>`;

    parent.prepend(container);
    hideButton();

    const toggleBtn = container.querySelector('#toggle-details-btn');
    const detailsDiv = container.querySelector('#tmdb-details');
    const tmdb_id = container.querySelector('#tmdb-id');
    const imdb_id = container.querySelector('#imdb-id');

    const isHidden = sessionStorage.getItem('tmdbToggleHidden') === 'true';
    detailsDiv.style.display = isHidden ? 'none' : 'block';
    toggleBtn.textContent = isHidden ? 'Show Details' : 'Hide Details';
    // sync FAB visibility with details visibility
    try { const fab = document.getElementById('tmdb-fab-settings'); if (fab) fab.style.display = isHidden ? 'none' : 'flex'; } catch (e) { }

    toggleBtn.addEventListener('click', () => {
      const currentlyHidden = detailsDiv.style.display === 'none';
      detailsDiv.style.display = currentlyHidden ? 'block' : 'none';
      toggleBtn.textContent = currentlyHidden ? 'Hide Details' : 'Show Details';
      showNotification(currentlyHidden ? 'Details will be shown until you hide them.' : 'Details will be hidden until you show them.');
      sessionStorage.setItem('tmdbToggleHidden', (!currentlyHidden).toString());
      try { const fab = document.getElementById('tmdb-fab-settings'); if (fab) fab.style.display = detailsDiv.style.display === 'none' ? 'none' : 'flex'; } catch (e) { }
    });

    tmdb_id?.addEventListener('click', () => { GM_setClipboard(tmdbID, 'text'); showNotification('TMDB id copied to clipboard'); });
    imdb_id?.addEventListener('click', () => { if (imdb) { GM_setClipboard(imdb, 'text'); showNotification('IMDB id copied to clipboard'); } });

    // add a Watch Trailer button next to the TMDb link (fetches videos endpoint and shows modal)
    try {
      const tmdbLink = container.querySelector(`#tmdb-details a[href*="themoviedb.org/${vidType}/${tmdbID}"]`);
      if (tmdbLink && SETTINGS.enableTrailerButton) {
        const trailerBtn = document.createElement('button');
        trailerBtn.className = 'tmdb-btn ghost tmdb-trailer-btn';
        trailerBtn.textContent = 'Watch trailer';
        trailerBtn.type = 'button';
        tmdbLink.parentNode.insertBefore(trailerBtn, tmdbLink.nextSibling);

        trailerBtn.addEventListener('click', async () => {
          // prevent multiple overlays
          document.querySelector('.tmdb-overlay')?.remove();
          if (document.querySelector('.tmdb-trailer-modal')) return;
          trailerBtn.disabled = true; trailerBtn.textContent = 'Loading...';
          try {
            const kind = (Type === 'tv') ? 'tv' : 'movie';
            const cacheKey = `${kind}:${tmdbID}`;
            // if cached (including negative cache), use it
            if (trailerCache.has(cacheKey)) {
              const cached = trailerCache.get(cacheKey);
              if (!cached) { showNotification('No trailer found'); trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer'; return; }
              showTrailerModal(cached.key);
              trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer';
              return;
            }

            const apiKey = getNextApiKey();
            const resp = await fetch(`https://api.themoviedb.org/3/${kind}/${tmdbID}/videos?api_key=${apiKey}`);
            const vids = await resp.json();
            const results = Array.isArray(vids.results) ? vids.results : [];
            // prefer official YouTube trailers, then any YouTube trailer
            let chosen = results.find(r => r.site === 'YouTube' && /trailer/i.test(r.type) && /official/i.test(r.name))
              || results.find(r => r.site === 'YouTube' && /trailer/i.test(r.type))
              || results.find(r => r.site === 'YouTube');

            // store in cache (either chosen object or null for not found)
            trailerCache.set(cacheKey, chosen || null);

            if (!chosen) { showNotification('No trailer found'); trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer'; return; }

            showTrailerModal(chosen.key);
            trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer';
          } catch (err) {
            showNotification('Failed to load trailer');
            trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer';
          }
        });
      }
    } catch (e) { /* ignore trailer UI errors */ }

    // If TV: show a single button (before Stremio link) to "Play another episode".
    // Clicking it will fetch seasons, allow selecting season+episode, validate against the season endpoint,
    // and then update the existing streaming links in the details panel to point at the chosen S/E.
    if (Type === 'tv') {
      try {
        const stremioLinkDiv = detailsDiv.querySelector('a[href^="stremio://detail/"]')?.parentNode || null;
        const playAnotherBtn = document.createElement('button');
        playAnotherBtn.className = 'tmdb-btn ghost';
        playAnotherBtn.id = 'tmdb-play-another';
        playAnotherBtn.style.marginTop = '8px';
        playAnotherBtn.textContent = 'Play another episode';

        if (stremioLinkDiv) detailsDiv.insertBefore(playAnotherBtn, stremioLinkDiv);
        else detailsDiv.appendChild(playAnotherBtn);

        let controlsShown = false;
        let controlsAreaEl = null;

        playAnotherBtn.addEventListener('click', async () => {
          if (controlsShown) {
            // toggle hide/show
            if (controlsAreaEl) controlsAreaEl.style.display = controlsAreaEl.style.display === 'none' ? 'inline-block' : 'none';
            return;
          }
          playAnotherBtn.disabled = true; playAnotherBtn.textContent = 'Loading...';
          try {
            const apiKey = getNextApiKey();
            const resp = await fetch(`https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${apiKey}`);
            const tvJson = await resp.json();
            // exclude season 0 (specials) from the dropdown
            const seasons = Array.isArray(tvJson.seasons) ? tvJson.seasons.filter(s => typeof s.season_number === 'number' && s.season_number > 0) : [];

            if (seasons.length === 0) { showNotification('No season data available'); playAnotherBtn.disabled = false; playAnotherBtn.textContent = 'Play another episode'; return; }

            // build inline controls
            controlsAreaEl = document.createElement('span');
            controlsAreaEl.style.marginLeft = '8px';
            controlsAreaEl.id = 'tmdb-play-controls';

            const seasonSelect = document.createElement('select');
            seasonSelect.id = 'tmdb-season-select';
            seasonSelect.style.marginRight = '8px';
            seasons.forEach(s => {
              const opt = document.createElement('option');
              opt.value = s.season_number;
              opt.text = `S${s.season_number} (${s.episode_count ?? 'N/A'} eps)`;
              opt.dataset.episodes = s.episode_count ?? '';
              seasonSelect.appendChild(opt);
            });

            const episodeSelect = document.createElement('select');
            episodeSelect.id = 'tmdb-episode-select';
            episodeSelect.style.marginRight = '8px';
            if (!SETTINGS.enableEpisodeSelection) {
              // hide episode selector visually but keep it for value storage
              episodeSelect.style.display = 'none';
            }

            const updateLinksBtn = document.createElement('button');
            updateLinksBtn.className = 'tmdb-btn primary';
            updateLinksBtn.textContent = 'Update player links';

            controlsAreaEl.appendChild(seasonSelect);
            controlsAreaEl.appendChild(episodeSelect);
            controlsAreaEl.appendChild(updateLinksBtn);

            function fillEpisodeOptions(count) {
              episodeSelect.innerHTML = '';
              const max = Number.isFinite(count) && count > 0 ? count : 1;
              for (let i = 1; i <= max; i++) { const o = document.createElement('option'); o.value = i; o.text = `Ep ${i}`; episodeSelect.appendChild(o); }
            }

            const firstOpt = seasonSelect.options[0];
            fillEpisodeOptions(parseInt(firstOpt.dataset.episodes) || 1);

            seasonSelect.addEventListener('change', () => {
              const epCount = parseInt(seasonSelect.selectedOptions[0].dataset.episodes) || 1;
              fillEpisodeOptions(epCount);
            });

            // On update: validate by fetching season details and then rewrite known streaming link patterns
            updateLinksBtn.addEventListener('click', async () => {
              const seasonNum = parseInt(seasonSelect.value, 10);
              const epNum = SETTINGS.enableEpisodeSelection ? parseInt(episodeSelect.value, 10) : 1;
              updateLinksBtn.disabled = true; updateLinksBtn.textContent = 'Validating...';
              try {
                const apiKey2 = getNextApiKey();
                const sResp = await fetch(`https://api.themoviedb.org/3/tv/${tmdbID}/season/${seasonNum}?api_key=${apiKey2}`);
                const sJson = await sResp.json();
                const episodes = Array.isArray(sJson.episodes) ? sJson.episodes.length : (sJson.episodes ? sJson.episodes.length : 0);
                const total = episodes || parseInt(seasonSelect.selectedOptions[0].dataset.episodes) || 0;
                if (total > 0 && (epNum < 1 || epNum > total)) { showNotification(`Selected episode out of range (1-${total})`); updateLinksBtn.disabled = false; updateLinksBtn.textContent = 'Update player links'; return; }

                // rewrite anchors in detailsDiv using original href templates so repeated updates work
                const s = seasonNum, e = epNum;
                const anchors = Array.from(detailsDiv.querySelectorAll('a[href]'));
                anchors.forEach(a => {
                  try {
                    let orig = a.dataset.originalHref;
                    if (!orig) { orig = a.getAttribute('href') || ''; a.dataset.originalHref = orig; }
                    if (!orig) return;
                    let newHref = orig;
                    newHref = newHref.replace('?s=1&e=1', `?s=${s}&e=${e}`);
                    newHref = newHref.replace('&s=1&e=1', `&s=${s}&e=${e}`);
                    newHref = newHref.replace(`${tmdbID}/1/1`, `${tmdbID}/${s}/${e}`);
                    if (query) newHref = newHref.replace(`${tmdbID}${query}`, `${tmdbID}/${s}/${e}`);
                    if (multiQuery) newHref = newHref.replace(`${tmdbID}${multiQuery}`, `${tmdbID}?s=${s}&e=${e}`);
                    if (smashQuery) newHref = newHref.replace(`${tmdbID}${smashQuery}`, `${tmdbID}?s=${s}&e=${e}`);
                    const tmdbPath = `/${tmdbID}`;
                    if (newHref.includes(tmdbPath) && !newHref.includes(`${tmdbPath}/`) && !newHref.includes('themoviedb.org')) {
                      newHref = newHref.replace(tmdbPath, `${tmdbPath}/${s}/${e}`);
                    }
                    a.setAttribute('href', newHref);
                  } catch (ex) { /* ignore individual anchor errors */ }
                });

                showNotification(`Player links updated to S${s} E${e}`);
                updateLinksBtn.textContent = 'Updated';
                setTimeout(() => { updateLinksBtn.textContent = 'Update player links'; updateLinksBtn.disabled = false; }, 1500);
              } catch (err) {
                showNotification('Failed to validate season details');
                updateLinksBtn.disabled = false; updateLinksBtn.textContent = 'Update player links';
              }
            });

            playAnotherBtn.parentNode.insertBefore(controlsAreaEl, playAnotherBtn.nextSibling);
            controlsShown = true;
            playAnotherBtn.disabled = false; playAnotherBtn.textContent = 'Play another episode';
          } catch (err) {
            showNotification('Failed to load TV details');
            playAnotherBtn.disabled = false; playAnotherBtn.textContent = 'Play another episode';
          }
        });
      } catch (e) { /* ignore DOM errors */ }
    }

    // Stremio deep-link fallback
    if (SETTINGS.enableStremioLink && imdb) {
      const stremioLink = container.querySelector('a[href^="stremio://detail/"]');
      stremioLink?.addEventListener('click', function (e) {
        e.preventDefault();
        const href = stremioLink.getAttribute('href');
        const hiddenIFrame = document.createElement('iframe');
        hiddenIFrame.style.display = 'none'; hiddenIFrame.src = href; document.body.appendChild(hiddenIFrame);
        let redirected = false;
        const timeout = setTimeout(() => { if (!redirected) window.location.href = 'https://www.stremio.com/downloads'; }, 7000);
        window.onblur = function () { clearTimeout(timeout); redirected = true; hiddenIFrame.remove(); };
      });
    }
  }

  /* ----------------------------------------------------
   * TMDb + YTS fetch
   * -------------------------------------------------- */
  function getNextApiKey() {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return key;
  }

  // simple in-memory cache for trailers to avoid repeated TMDb video requests
  const trailerCache = new Map(); // key -> { key: youtubeKey } or null if none

  // helper to open trailer modal by YouTube key
  function showTrailerModal(youtubeKey) {
    if (!youtubeKey) return;
    if (document.querySelector('.tmdb-trailer-modal')) return; // already open
    const overlay = document.createElement('div');
    overlay.className = 'tmdb-trailer-modal';
    overlay.tabIndex = -1;
    const content = document.createElement('div');
    content.className = 'tmdb-trailer-content';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tmdb-trailer-close';
    closeBtn.innerText = '✕';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => { overlay.remove(); });

    const iframe = document.createElement('iframe');
    // Build src with autoplay when enabled in settings. Adding mute=1 improves autoplay reliability
    const autoplayParam = SETTINGS.enableTrailerAutoPlay ? '&autoplay=1&mute=0' : '';
    iframe.src = `https://www.youtube.com/embed/${youtubeKey}?rel=0${autoplayParam}`;
    // include autoplay in allow so browsers that respect the attribute may permit it
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;

    content.appendChild(closeBtn);
    content.appendChild(iframe);
    overlay.appendChild(content);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // Process a single TMDb search result: fetch IMDb id, optional YTS torrents, then render
  async function processSearchResult(result, specifiedSeason = null, specifiedEpisode = null) {
    const tmdbURL = `https://api.themoviedb.org/3/`;
    const ytsAPI = `https://yts.mx/api/v2/list_movies.json?query_term=`;
    try {
      // remove any existing info card before rendering the new one
      const existing = parent.querySelector('.tmdb-info-card');
      if (existing) existing.remove();

      const apiKey = getNextApiKey();
      let imdbId = null;
      // if on IMDb page, extract directly from URL
      if (isImdb) {
        imdbId = location.pathname.match(/title\/(tt\d+)/)?.[1];
      }
      let imdb_id = null;
      if (imdbId) { imdb_id = imdbId; }
      else {
        // fetch from TMDb external_ids endpoint
        const imdbResp = await fetch(`${tmdbURL}${result.media_type}/${result.id}/external_ids?api_key=${apiKey}`);
        imdb_id = (await imdbResp.json()).imdb_id;
      }

      if (result.media_type === 'movie') {
        if (SETTINGS.enableYtsTorrents) {
          try {
            const magnet = await fetch(`${ytsAPI}${imdb_id}`);
            const magnetData = await magnet.json();
            if (magnetData.status === 'ok' && magnetData.data.movie_count > 0) {
              renderInfoBox(result, magnetData.data.movies[0].torrents, imdb_id, specifiedSeason, specifiedEpisode, magnetData.data.movies[0].language);
            } else {
              renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null);
            }
          } catch { renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null); }
        } else {
          renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null);
        }
      } else {
        renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null);
      }

      if (SETTINGS.showCertifications) addCertificationAsync(result.id, result.media_type);
    } catch (err) {
      showNotification('Failed to process selected result');
    }
  }

  async function fetchWithFallback(title, maxRetries = apiKeys.length) {
    let attempts = 0;
    while (attempts < maxRetries) {
      const apiKey = getNextApiKey();
      const tmdbURL = `https://api.themoviedb.org/3/`;
      const url = `${tmdbURL}search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Always process the first result automatically
          const res = data.results[0];
          await processSearchResult(res);

          // If there are multiple results, show a "Change result" button on the details card
          if (data.results.length > 1 && SETTINGS.enableChangeResultButton) {
            try {
              // only allow movies and tv shows in the change-result selector (exclude person entries)
              const results = (data.results || []).filter(r => r && (r.media_type === 'movie' || r.media_type === 'tv'));
              if (!results || results.length === 0) { /* nothing to show */ return; }

              // helper: attach a change-result button to the current info card (if present)
              function attachChangeButtonToCurrentCard() {
                try {
                  const infoCard = parent.querySelector('.tmdb-info-card');
                  if (!infoCard) return;
                  const detailsDiv = infoCard.querySelector('#tmdb-details');
                  if (!detailsDiv) return;
                  // don't duplicate button
                  if (detailsDiv.querySelector('#tmdb-change-result-btn')) return;

                  const changeBtn = document.createElement('button');
                  changeBtn.id = 'tmdb-change-result-btn';
                  changeBtn.className = 'tmdb-btn ghost';
                  changeBtn.style.marginTop = '8px';
                  changeBtn.style.marginLeft = '5px';
                  changeBtn.textContent = 'Change result';

                  const stremioWrapper = detailsDiv.querySelector('a[href^="stremio://detail/"]')?.parentNode || null;
                  if (stremioWrapper) detailsDiv.insertBefore(changeBtn, stremioWrapper);
                  else detailsDiv.appendChild(changeBtn);

                  // show an in-card selector when clicked
                  changeBtn.addEventListener('click', () => {
                    // toggle existing selector inside this details div
                    const existingSel = detailsDiv.querySelector('.tmdb-result-selector');
                    if (existingSel) { existingSel.remove(); return; }

                    const selWrap = document.createElement('div');
                    selWrap.className = 'tmdb-result-selector';
                    selWrap.style.padding = '10px';
                    selWrap.innerHTML = `<div style="font-weight:bold;margin-bottom:6px">Select a different TMDb result</div>`;

                    const sel = document.createElement('select');
                    sel.style.width = '100%';
                    sel.style.marginBottom = '8px';
                    results.forEach((r, idx) => {
                      const opt = document.createElement('option');
                      const year = (r.release_date || r.first_air_date || '').slice(0, 4) || '----';
                      opt.value = idx;
                      opt.text = `${(r.media_type || '').toUpperCase()} — ${r.title || r.name} (${year})`;
                      sel.appendChild(opt);
                    });

                    sel.addEventListener('change', async () => {
                      const idx = parseInt(sel.value, 10);
                      const chosen = results[idx];
                      selWrap.remove();
                      await processSearchResult(chosen);
                      // after re-rendering, attach the change button again into the new card
                      attachChangeButtonToCurrentCard();
                    });

                    selWrap.appendChild(sel);
                    detailsDiv.insertBefore(selWrap, changeBtn.nextSibling);
                  });
                } catch (innerErr) { /* ignore attach errors */ }
              }

              // initial attach into the currently rendered card
              attachChangeButtonToCurrentCard();
            } catch (e) { /* ignore selector injection errors */ }
          }
          return;
        } else {
          showNotification('No results found. Rotating API key...');
          attempts++;
        }
      } catch (err) {
        showNotification(`Fetch error: ${err.message}`);
        attempts++;
      }
    }
    showNotification('TMDb API failed or no results. Try refining your search?');
    return null;
  }

  function buildTorrentLinks(torrents, title_long) {
    const torrentLinks = [];
    const trackers = [
      'udp://glotorrents.pw:6969/announce',
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://torrent.gresille.org:80/announce',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://tracker.leechers-paradise.org:6969',
      'udp://p4p.arenabg.ch:1337',
      'udp://tracker.internetwarriors.net:1337',
    ];
    if (torrents && Array.isArray(torrents)) {
      torrents.forEach(torrent => {
        const hash = torrent.hash;
        const name = encodeURIComponent(title_long);
        const tr = trackers.map(tr => `&tr=${encodeURIComponent(tr)}`).join('');
        const magnet = `magnet:?xt=urn:btih:${hash}&dn=${name}${tr}`;
        torrentLinks.push({
          quality: torrent.quality,
          type: torrent.type,
          size: torrent.size,
          video: torrent.video_codec,
          audio: torrent.audio_channels,
          seeds: torrent.seeds,
          peers: torrent.peers,
          magnet
        });
      });
    }
    return torrentLinks;
  }

  async function addCertificationAsync(id, type) {
    const apiKey = getNextApiKey();
    let cert = '';
    try {
      if (isImdb) {
        try {
          const certLink = document.querySelector('a[href*="/parentalguide"][href*="#certificates"]');
          if (certLink) {
            const certText = certLink.textContent.trim();
            if (certText && certText.length <= 8) {
              console.log(`IMDb rating found: ${certText}`);
              cert = certText;
            }
          } else {
            // fallback: IMDb sometimes hides it in storyline section or metadata list
            const alt = Array.from(document.querySelectorAll('li, div, span'))
              .find(el => /TV-|PG-|R\b|G\b|NC-17|Unrated/i.test(el.textContent));
            if (alt) {
              const match = alt.textContent.match(/TV-[A-Z0-9+-]+|PG-[0-9]+|R|G|NC-17|Unrated/i);
              if (match) cert = match[0];
            }
          }
        } catch (err) {
          console.warn('Failed to extract IMDb certification', err);
        }
      } else if (type === 'movie' && cert === '') {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${apiKey}`);
        const json = await res.json();
        const us = json.results?.find(r => r.iso_3166_1 === 'US');
        cert = us?.release_dates?.[0]?.certification || '';
        if (!cert) { const tr = json.results?.find(r => r.iso_3166_1 === 'TR'); cert = tr?.rating || ''; }
      } else if (type === 'tv' && cert === '') {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/content_ratings?api_key=${apiKey}`);
        const json = await res.json();
        const us = json.results?.find(r => r.iso_3166_1 === 'US');
        cert = us?.rating || '';
        if (!cert) { const tr = json.results?.find(r => r.iso_3166_1 === 'TR'); cert = tr?.rating || ''; }
      }
      if (cert) {
        const titleElem = document.querySelector('.tmdb-title');
        if (titleElem) titleElem.innerHTML += ` <span style="color:gray;font-size:14px;">[${cert}]</span>`;
      }
    } catch (err) { showNotification('Failed to fetch certification'); }
  }

  function hideButton() {
    const btn = document.getElementById('tmdb-button');
    if (btn) btn.style.display = 'none';
  }

  /* ----------------------------------------------------
  * IMDb Page Handler (Play Overlay)
  * -------------------------------------------------- */

  // Simple cache for IMDb→TMDb lookups
  const imdbCache = new Map();

  async function imdbHandler() {
    const imdbId = location.pathname.match(/title\/(tt\d+)/)?.[1];
    if (!imdbId) return showNotification("Couldn't detect IMDb ID on this page.");

    // Try to insert play button reliably
    function tryInsertButton(attempt = 0) {
      const target = document.querySelector('[data-testid="tm-box-wl-button"]')?.parentElement
        || document.querySelector('.ipc-btn__text')?.closest('.ipc-button')?.parentElement
        || document.querySelector('[data-testid="hero-title-block__buttons"]')
        || document.querySelector('header'); // fallback spot

      if (!target && attempt < 15) {
        setTimeout(() => tryInsertButton(attempt + 1), 500);
        return;
      }

      if (!target) {
        console.warn('IMDb: failed to find injection target for play button.');
        showNotification('Failed to insert Play button on IMDb page. You can use Shift+P to trigger the overlay manually.', 8000);
        return;
      }

      // Prevent duplicate button
      if (document.getElementById('tmdb-bttn-overlay')) return;

      const bttn = document.createElement('button');
      bttn.id = 'tmdb-bttn-overlay';
      bttn.textContent = '▶ Play';
      bttn.style.cssText = `
      margin-top:10px;
      cursor:pointer;
      padding:8px 12px;
      background:#f5c518;
      color:#000;
      border:none;
      border-radius:24px;
      font-weight:bold;
      font-size:18px;
      transition:all 0.2s ease;
      width:100%;
      max-width:100%;
      height:3rem;
      text-align:left;
    `;
      bttn.onmouseenter = () => bttn.style.background = '#e2b616';
      bttn.onmouseleave = () => bttn.style.background = '#f5c518';

      // Insert the Play button between the "Add to Watchlist" block and the "Mark as watched" button
      try {
        // look for a nearby "watched" button (robust selectors)
        const watchedBtn = (target.parentElement && target.parentElement.querySelector('button[data-testid^="watched-button"], button[aria-label*="watched"]'))
          || document.querySelector('button[data-testid^="watched-button"], button[aria-label*="watched"]');
        if (watchedBtn && watchedBtn.parentElement === target.parentElement) {
          // place before the watched button so layout becomes: (watchlist) (play) (watched)
          target.parentElement.insertBefore(bttn, watchedBtn);
        } else if (target.nextSibling) {
          // fallback: insert immediately after the watchlist block
          target.parentElement.insertBefore(bttn, target.nextSibling);
        } else {
          // final fallback: append to target's parent
          target.parentElement.appendChild(bttn);
        }
      } catch (insErr) {
        // if anything goes wrong, append as before
        target.appendChild(bttn);
      }

      bttn.addEventListener('click', () => triggerOverlay(imdbId));
    }

    tryInsertButton();

    // Fallback keybind (Shift+P)
    document.addEventListener('keydown', e => {
      if (e.shiftKey && e.key.toLowerCase() === 'p') {
        triggerOverlay(imdbId);
      }
    });

    // Core overlay logic
    async function triggerOverlay(imdbId) {
      const bttn = document.getElementById('tmdb-bttn-overlay');
      if (bttn) { bttn.disabled = true; bttn.textContent = 'Loading...'; }

      try {
        // check cache first
        if (imdbCache.has(imdbId)) {
          console.log(`Using cached TMDb data for ${imdbId}`);
          const cached = imdbCache.get(imdbId);
          return renderOverlayFromCache(cached);
        }

        const apiKey = getNextApiKey();
        const res = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`);
        const json = await res.json();
        const data = json.movie_results?.[0] || json.tv_results?.[0];

        if (!data) {
          showNotification('TMDb match not found for this IMDb ID.');
          if (bttn) { bttn.disabled = false; bttn.textContent = '▶ Play'; }
          return;
        }

        // cache it for next time
        imdbCache.set(imdbId, data);

        renderOverlayFromCache(data);
      } catch (err) {
        console.error('IMDb overlay error:', err);
        showNotification('Failed to fetch TMDb info.');
      } finally {
        if (bttn) { bttn.disabled = false; bttn.textContent = '▶ Play'; }
      }
    }

    // helper to render overlay either from cache or fresh data
    async function renderOverlayFromCache(data) {
      // remove any old overlay
      document.querySelector('.tmdb-overlay')?.remove();

      const overlay = document.createElement('div');
      overlay.className = 'tmdb-overlay';
      overlay.innerHTML = `<div class="tmdb-overlay-inner" id="tmdb-overlay-inner"></div>`;
      document.body.appendChild(overlay);

      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
      });

      // use your existing logic to render info card
      await processSearchResult(data);

      const infoCard = document.querySelector('.tmdb-info-card');
      if (infoCard) {
        overlay.querySelector('#tmdb-overlay-inner').appendChild(infoCard);
      } else {
        overlay.remove();
        showNotification('Failed to display info box.');
      }
    }
  }

  GM_addStyle(`
    .tmdb-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .tmdb-overlay-inner {
      background: rgb(3,37,65);
      color: #e9f1f7;
      border-radius: 12px;
      padding: 20px;
      width: min(90vw, 950px);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 0 40px rgba(0,0,0,0.5);
    }
  `);

  /* ----------------------------------------------------
  * Trakt Page Handler
  * -------------------------------------------------- */

  // simple cache for Trakt→TMDb lookups
  const traktCache = new Map();

  function traktHandler() {
    let watchBtn = document.querySelector('a.btn-watch-now');
    if (!watchBtn) {
      console.warn('Trakt: Watch Now button not found.');
    }

    // capture optional season/episode if present in the TMDb URL
    const tmdbHref = document.querySelector('a[href*="themoviedb.org/"]')?.href || '';
    // support both /tv/123/5/11 and /tv/123/season/5/episode/11 forms
    const tmdbMatch = tmdbHref.match(/\/(movie|tv)\/(\d+)(?:\/(?:(\d+)\/(\d+))|\/season\/(\d+)\/episode\/(\d+))?/);
    const imdb = document.querySelector('a[href*="imdb.com/title/"]')?.href.match(/tt\d+/)?.[0] || null;
    const type = tmdbMatch ? tmdbMatch[1] : null;
    const tmdb = tmdbMatch ? tmdbMatch[2] : null;
    // pick the correct capturing groups (3/4 for simple form, 5/6 for 'season/episode' form)
    const tmdbSeason = tmdbMatch ? (tmdbMatch[3] ? parseInt(tmdbMatch[3], 10) : (tmdbMatch[5] ? parseInt(tmdbMatch[5], 10) : null)) : null;
    const tmdbEpisode = tmdbMatch ? (tmdbMatch[4] ? parseInt(tmdbMatch[4], 10) : (tmdbMatch[6] ? parseInt(tmdbMatch[6], 10) : null)) : null;

    if (!tmdb) {
      console.warn('Trakt: TMDb id missing.');
      return;
    }

    // Fallback keybind (Shift+P)
    document.addEventListener('keydown', e => {
      if (e.shiftKey && e.key.toLowerCase() === 'p') {
        triggerTraktOverlay({ imdb, tmdb, type, season: tmdbSeason, episode: tmdbEpisode });
      }
    });

    // Hijack Trakt modal trigger
    watchBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      triggerTraktOverlay({ imdb, tmdb, type, season: tmdbSeason, episode: tmdbEpisode });
    }, true);
  }

  async function triggerTraktOverlay({ imdb, tmdb, type, season = null, episode = null }) {
    if (document.querySelector('.tmdb-overlay')) return;

    // cache key by TMDb id (include season/episode so different episode previews cache separately)
    const cacheKey = `${type}:${tmdb}${season ? `:s${season}` : ''}${episode ? `:e${episode}` : ''}`;
    if (traktCache.has(cacheKey)) {
      console.log('Using cached TMDb data for', cacheKey);
      return renderTraktOverlay(traktCache.get(cacheKey), season, episode);
    }

    const apiKey = getNextApiKey();
    const tmdbBase = 'https://api.themoviedb.org/3';
    try {
      // main details
      const res = await fetch(`${tmdbBase}/${type}/${tmdb}?api_key=${apiKey}`);
      const data = await res.json();

      // external ids (for imdb)
      let imdb_id = imdb;
      if (!imdb_id) {
        const extRes = await fetch(`${tmdbBase}/${type}/${tmdb}/external_ids?api_key=${apiKey}`);
        imdb_id = (await extRes.json()).imdb_id || null;
      }
      data.media_type = type;
      data.external_imdb = imdb_id;

      // cache it (store the TMDb data; season/episode passed separately)
      traktCache.set(cacheKey, data);
      renderTraktOverlay(data, season, episode);
    } catch (err) {
      console.error('Trakt overlay error:', err);
      showNotification('Failed to fetch TMDb info.');
    }
  }

  async function renderTraktOverlay(data, season = null, episode = null) {
    document.querySelector('.tmdb-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'tmdb-overlay';
    overlay.innerHTML = `<div class="tmdb-overlay-inner" id="tmdb-overlay-inner"></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    // Build a result-like object for processSearchResult
    const fakeResult = {
      id: data.id,
      media_type: data.media_type,
      title: data.title || data.name,
      release_date: data.release_date,
      first_air_date: data.first_air_date
    };

    // We already have IMDb id — pass it directly and include season/episode so links are built for them
    await processSearchResult(fakeResult, season, episode);
    const card = document.querySelector('.tmdb-info-card');
    if (card) overlay.querySelector('#tmdb-overlay-inner').appendChild(card);
    else overlay.remove();
  }

  /* ----------------------------------------------------
  * Trakt New UI Handler
  * -------------------------------------------------- */

  function newTraktHandler() {
    showNotification('TMDb Enhancer: Trakt new UI detected. Underdevelopment, please wait!', 8000);
  }


  /* ----------------------------------------------------
  * Action time
  * -------------------------------------------------- */
  if (isSearch()) {
    if (SETTINGS.autoDetectOnSERP && isMedia) {
      fetchWithFallback(cleanedQuery);
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Search TMDb Info';
      btn.id = 'tmdb-button';
      btn.onclick = () => fetchWithFallback(cleanedQuery);
      parent.prepend(btn);
    }
  } else if (isImdb && SETTINGS.enableOnImdbPage) {
    imdbHandler();
  } else if (isTrakt && SETTINGS.enableOnTraktPage) {
    if (!isNewTrakt) traktHandler();
    else newTraktHandler();
  }


  // Floating settings FAB (opens settings panel)
  try {
    const fab = document.createElement('button');
    fab.id = 'tmdb-fab-settings';
    fab.title = 'TMDb Script Settings (Shift+R)';
    fab.innerHTML = '⚙';
    fab.addEventListener('click', openSettingsPanel);
    document.body.appendChild(fab);
  } catch (e) { /* ignore if body not available */ }

})();
