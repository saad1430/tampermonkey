// ==UserScript==
// @name         Smart Movie/Series Google Search (TMDb) + Settings Panel
// @namespace    http://tampermonkey.net/
// @version      1.1.4.1
// @description  Shows TMDb/IMDb IDs, optional streaming/torrent links, and includes a Shift+R settings panel to toggle features. Keys persist via GM storage.
// @author       Saad1430
// @match        https://www.google.com/search*
// @match        https://www.bing.com/search*
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
    enableNotifications: true,
    enableStreamingLinks: true,      // the big list of watch links
    enableFrontendLinks: true,       // cineby/flixer/velora/etc
    enableTorrentSiteShortcuts: true,// 1337x, EZTV, etc
    enableYtsTorrents: true,         // live torrents from YTS (movies only)
    enableStremioLink: true,         // stremio:// deep link
    enableTraktLink: true,           // show Trakt search link under IMDb
    enableEpisodeSelection: true,    // allow changing episode number when playing TV
    showCertifications: true         // fetch + display MPAA/TV rating
  };

  function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(GM_getValue('tmdb_settings', '{}')) || {}) }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings(s) { GM_setValue('tmdb_settings', JSON.stringify(s)); }

  let SETTINGS = loadSettings();

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
  if (!parent) return;

  const queryRaw = getSearchQuery();
  if (!queryRaw) return;
  const cleanedQuery = queryRaw.replace(/(watch|online|cast|movie|movies|tv|stream|showtimes|series|episodes|trakt|tmdb|imdb)/gi, '').replace(/\s+/g, ' ').trim();

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
          <h2>TMDb Script Settings</h2>
          <button class="tmdb-btn ghost" id="tmdb-close">✕</button>
        </header>
        <div class="body">
          ${checkbox('autoDetectOnSERP', 'Auto-detect Movies/TV Shows', SETTINGS.autoDetectOnSERP)}
          ${checkbox('enableNotifications', 'Enable notifications', SETTINGS.enableNotifications)}
          ${checkbox('enableStreamingLinks', 'Show streaming links', SETTINGS.enableStreamingLinks)}
          ${checkbox('enableFrontendLinks', 'Show frontend links', SETTINGS.enableFrontendLinks)}
          ${checkbox('enableTorrentSiteShortcuts', 'Show torrent sites', SETTINGS.enableTorrentSiteShortcuts)}
          ${checkbox('enableYtsTorrents', 'Fetch YTS torrents for movies', SETTINGS.enableYtsTorrents)}
          ${checkbox('enableStremioLink', 'Show “Open in Stremio” link', SETTINGS.enableStremioLink)}
          ${checkbox('enableTraktLink', 'Show Trakt link', SETTINGS.enableTraktLink)}
          ${checkbox('enableEpisodeSelection', 'Allow changing episode number when playing TV', SETTINGS.enableEpisodeSelection)}
          ${checkbox('showCertifications', 'Show certification', SETTINGS.showCertifications)}

          <div class="full">
            <label class="full" style="flex-direction:column;align-items:flex-start">
              <span style="opacity:.85;margin-bottom:6px">TMDb API Keys (comma separated)</span>
              <textarea id="tmdb-keys" rows="3" placeholder="key1, key2, key3">${keysStr}</textarea>
            </label>
          </div>
        </div>
        <footer>
          <button class="tmdb-btn ghost" id="tmdb-reset-keys">Reset Keys</button>
          <button class="tmdb-btn primary" id="tmdb-save">Save & Apply</button>
        </footer>
      </div>`;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSettingsPanel(); });
    document.body.appendChild(overlay);

    document.getElementById('tmdb-close').onclick = closeSettingsPanel;
    document.getElementById('tmdb-reset-keys').onclick = () => {
      if (confirm('Clear stored TMDb API keys?')) { GM_deleteValue('tmdb_api_keys'); showNotification('Keys cleared. Reload the page and re-enter keys.', 7000); }
    };
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
  if (isGoogle) {
    const rhsBlock = document.querySelector('#rhs');
    if (rhsBlock && /IMDb|TV series|Movie|Episodes|Run time/i.test(rhsBlock.innerText)) isMedia = true;
  } else if (isBing) {
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
  function renderInfoBox(data, torrents = null, imdb = null) {
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
    let season_number = 1;
    let episode_number = 1;
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
            html += `<a href="${link.magnet}" rel="noopener" style="color:#1bb8d9;font-weight:bold;">${link.quality} (${link.size}) - ${link.type} ${link.video} (Audio Channel: ${link.audio}) - Seeders:${link.seeds} Peers:${link.peers}</a><br/>`;
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
          <a href="https://vidsrc.to/embed/${vidType}/${tmdbID}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VidSrc.to ↗</a><br/>
          <a href="https://multiembed.mov/?video_id=${tmdbID}&tmdb=1${multiQuery}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on MultiEmbed.mov ↗</a><br/>
          <a href="https://spencerdevs.xyz/${vidType}/${tmdbID}?theme=ff0000${multiQuery}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on spencerdevs.xyz ↗</a><br/>
          <a href="https://111movies.com/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on 111Movies.com ↗</a><br/>
          <a href="https://vidora.su/${vidType}/${tmdbID}${query}" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on Vidora.su ↗</a><br/>
          <a href="https://www.vidking.net/embed/${vidType}/${tmdbID}${query}?color=e50914" target="_blank" style="color:#1bb8d9;font-weight:bold;">Watch on VidKing.net ↗</a><br/>
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
        const timeout = setTimeout(() => { if (!redirected) window.location.href = 'https://www.stremio.com/downloads'; }, 5000);
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

  // Process a single TMDb search result: fetch IMDb id, optional YTS torrents, then render
  async function processSearchResult(result) {
    const tmdbURL = `https://api.themoviedb.org/3/`;
    const ytsAPI = `https://yts.mx/api/v2/list_movies.json?query_term=`;
    try {
      // remove any existing info card before rendering the new one
      const existing = parent.querySelector('.tmdb-info-card');
      if (existing) existing.remove();

      const apiKey = getNextApiKey();
      const imdbResp = await fetch(`${tmdbURL}${result.media_type}/${result.id}/external_ids?api_key=${apiKey}`);
      const imdb_id = (await imdbResp.json()).imdb_id;

      if (result.media_type === 'movie') {
        if (SETTINGS.enableYtsTorrents) {
          try {
            const magnet = await fetch(`${ytsAPI}${imdb_id}`);
            const magnetData = await magnet.json();
            if (magnetData.status === 'ok' && magnetData.data.movie_count > 0) {
              renderInfoBox(result, magnetData.data.movies[0].torrents, imdb_id);
            } else {
              renderInfoBox(result, null, imdb_id);
            }
          } catch { renderInfoBox(result, null, imdb_id); }
        } else {
          renderInfoBox(result, null, imdb_id);
        }
      } else {
        renderInfoBox(result, null, imdb_id);
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
      const ytsAPI = `https://yts.mx/api/v2/list_movies.json?query_term=`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Always process the first result automatically
          const res = data.results[0];
          await processSearchResult(res);

          // If there are multiple results, show a "Change result" button on the details card
          if (data.results.length > 1) {
            try {
              // keep a stable reference to the results so re-attached buttons/selectors can use them
              const results = data.results;

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
                    selWrap.className = 'tmdb-info-card tmdb-play-controls tmdb-result-selector';
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
      if (type === 'movie') {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${apiKey}`);
        const json = await res.json();
        const us = json.results?.find(r => r.iso_3166_1 === 'US');
        cert = us?.release_dates?.[0]?.certification || '';
        if (!cert) { const tr = json.results?.find(r => r.iso_3166_1 === 'TR'); cert = tr?.rating || ''; }
      } else if (type === 'tv') {
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
   * Action time
   * -------------------------------------------------- */
  if (SETTINGS.autoDetectOnSERP && isMedia) {
    fetchWithFallback(cleanedQuery);
  } else {
    const btn = document.createElement('button');
    btn.textContent = 'Search TMDb Info';
    btn.id = 'tmdb-button';
    btn.onclick = () => fetchWithFallback(cleanedQuery);
    parent.prepend(btn);
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
