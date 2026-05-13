// ==UserScript==
// @name         Movie/TV Shows Links Aggregator
// @namespace    http://tampermonkey.net/
// @version      1.8.1
// @description  Shows TMDb/IMDb IDs, optional streaming/torrent links, and includes a Shift+R settings panel to toggle features.
// @icon         https://raw.githubusercontent.com/saad1430/tampermonkey/refs/heads/main/icons/movies-tv-shows-search-100.png
// @author       Saad1430
// @license      MIT
// @updateURL    https://github.com/saad1430/tampermonkey/raw/main/movies-tv-series.user.js
// @downloadURL  https://github.com/saad1430/tampermonkey/raw/main/movies-tv-series.user.js
// @match        https://www.google.com/search*
// @match        https://google.com/search*
// @match        https://www.bing.com/search*
// @match        https://bing.com/search*
// @match        https://duckduckgo.com/*
// @match        https://noai.duckduckgo.com/*
// @match        https://search.brave.com/*
// @match        https://www.imdb.com/title/*
// @match        https://imdb.com/title/*
// @match        https://trakt.tv/movies/*
// @match        https://trakt.tv/shows/*
// @match        https://app.trakt.tv/*
// @match        https://simkl.com/*
// @match        https://www.simkl.com/*
// @match        https://themoviedb.org/movie/*
// @match        https://themoviedb.org/tv/*
// @match        https://yts.lt/movies/*
// @match        https://yts.bz/movies/*
// @match        https://yts.mx/movies/*
// @match        https://yts.ag/movies/*
// @match        https://yts.am/movies/*
// @match        https://yts.gg/movies/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      api.themoviedb.org
// @connect      api.jikan.moe
// @run-at       document-idle
// ==/UserScript==

(async function () {
  'use strict';

  /* Editable credits: display name → URL */
  const specialThanks = {
    'FMHY': 'https://fmhy.net',
    'Star the repo ⭐': 'https://github.com/saad1430/tampermonkey',
  };

  /* ----------------------------------------------------
   * Theme System
   * -------------------------------------------------- */

  /**
   * Each theme defines 5 color roles as space-separated RGB triplets.
   * This lets us use both rgb(var(--tm-accent)) and rgba(var(--tm-accent) / 0.45).
   *
   * Roles:
   *   --tm-bg        main dark background
   *   --tm-surface   card/panel surface (slightly lighter than bg)
   *   --tm-accent    primary brand accent (links, highlights)
   *   --tm-text      primary readable text
   *   --tm-border    border / separator color
   */
  const THEME_PALETTES = {
    tmdb: {
      label: 'TMDb (default)',
      bg:      '3 37 65',      // #032541 deep navy
      surface: '11 26 43',     // #0b1a2b dark surface
      accent:  '27 184 217',   // #1bb8d9 cyan
      text:    '233 241 247',  // #e9f1f7 near-white
      border:  '27 184 217',   // #1bb8d9 cyan border
    },
    imdb: {
      label: 'IMDb',
      bg:      '20 20 20',     // #141414 near-black
      surface: '30 30 30',     // #1e1e1e dark charcoal
      accent:  '245 197 24',   // #f5c518 IMDb yellow
      text:    '255 255 255',  // #ffffff white
      border:  '245 197 24',   // #f5c518 yellow border
    },
    trakt: {
      label: 'Trakt',
      bg:      '26 26 26',     // #1a1a1a almost black
      surface: '38 38 38',     // #262626 dark grey
      accent:  '237 95 36',    // #ed5f24 Trakt orange
      text:    '232 232 232',  // #e8e8e8 light grey text
      border:  '237 95 36',    // #ed5f24 orange border
    },
    traktv3: {
      label: 'Trakt V3',
      bg:      '26 26 26',     // #1a1a1a almost black
      surface: '34 36 40',     // #222428 dark grey
      accent:  '159 66 198',    // #9f42c6 Trakt orange
      text:    '229 229 230',  // #e5e5e6 light grey text
      border:  '159 66 198',    // #9f42c6 orange border
    },
    custom: {
      label: 'Custom',
      /* values are placeholders — real values come from SETTINGS.customTheme* */
      bg:      '14 16 55',
      surface: '20 24 80',
      accent:  '99 179 237',
      text:    '226 232 240',
      border:  '99 179 237',
    },
  };

  /* Inject (or update) a <style> block with theme CSS custom properties */
  function applyTheme(themeName) {
    const base = THEME_PALETTES[themeName] || THEME_PALETTES.tmdb;

    /* For the custom theme pull live values from settings */
    const palette = themeName === 'custom' ? {
      bg:      SETTINGS.customThemeBg      || base.bg,
      surface: SETTINGS.customThemeSurface || base.surface,
      accent:  SETTINGS.customThemeAccent  || base.accent,
      text:    SETTINGS.customThemeText    || base.text,
      border:  SETTINGS.customThemeBorder  || base.border,
    } : base;

    const styleId = 'tmdb-theme-vars';
    let el = document.getElementById(styleId);
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }

    el.textContent = `
      :root {
        --tm-bg:      ${palette.bg};
        --tm-surface: ${palette.surface};
        --tm-accent:  ${palette.accent};
        --tm-text:    ${palette.text};
        --tm-border:  ${palette.border};
      }
    `;
  }

  /* ----------------------------------------------------
   * Settings (persisted) + Styles
   * -------------------------------------------------- */
  const DEFAULT_SETTINGS = {
    autoDetectOnSERP: true,
    enableOnGooglePage: true,
    enableOnBingPage: true,
    enableOnBravePage: true,
    enableOnDuckDuckGoPage: true,
    enableOnImdbPage: true,
    enableOnTraktPage: true,
    enableOnSimklPage: true,
    enableOnTMDbPage: true,
    enableOnYTSPage: true,
    enableNotifications: true,
    debugNetworkRequests: false,
    enableStreamingLinks: true,
    enableFrontendLinks: true,
    enableTorrentSiteShortcuts: true,
    enableYtsTorrents: true,
    enableStremioLink: true,
    enableTraktLink: true,
    enableTraktSearchLink: true,
    enableSimklLink: true,
    enableEpisodeSelection: true,
    enableTrailerButton: true,
    enableTrailerAutoPlay: false,
    enableChangeResultButton: true,
    showCertifications: true,
    enableTransparencyMode: true,
    openLinksInNewTab: true,
    showSettingsButton: true,
    disabledLinks: false, // keep it disabled otherwise older/expired links will be shown

    /* ---- Theme ---- */
    activeTheme: 'tmdb',            // 'tmdb' | 'imdb' | 'trakt' | 'traktv3' | 'custom'
    /* Custom theme color values as space-separated RGB triplets */
    customThemeBg:      '20 20 20',
    customThemeSurface: '30 30 30',
    customThemeAccent:  '255 0 0',
    customThemeText:    '226 232 240',
    customThemeBorder:  '255 0 0',
  };

  const CUSTOM_THEME_FIELDS = [
    { key: 'customThemeBg',      label: 'Background' },
    { key: 'customThemeSurface', label: 'Surface' },
    { key: 'customThemeAccent',  label: 'Accent' },
    { key: 'customThemeText',    label: 'Text' },
    { key: 'customThemeBorder',  label: 'Border' },
  ];

  /* ----------------------------------------------------
  * Announcements (What's New)
  * -------------------------------------------------- */

  const SCRIPT_NAME = GM_info.script.name;
  const ANNOUNCEMENT_VERSION = GM_info.script.version;
  const ANNOUNCEMENT_MESSAGE = `
    <h2 style="margin:0 0 10px 0;">What's New in v${ANNOUNCEMENT_VERSION}</h2>
    <ul style="margin-left:20px; line-height:1.5;">
      <li>Updated Playback links</li>
      <li>Added new frontend links</li>
      <li>Updated Simkl support</li>
      <li>Minor UI/UX improvements</li>
    </ul>
  `;

  function maybeShowAnnouncement() {
    const seenVersion = GM_getValue("announcement_seen_version", null);
    if (seenVersion === ANNOUNCEMENT_VERSION) return;
    showAnnouncementModal(ANNOUNCEMENT_MESSAGE + `<p style="opacity:0.7;">(This message will only appear once. If you want to see it again, refer to settings panel and click show latest announcement)</p>`);
    GM_setValue("announcement_seen_version", ANNOUNCEMENT_VERSION);
  }

  function showAnnouncementModal(messageHTML) {
    document.querySelector('.tmdb-announcement-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'tmdb-announcement-overlay';
    overlay.innerHTML = `
    <div class="tmdb-announcement-box ${SETTINGS.enableTransparencyMode ? 'transparency' : 'no-transparency'}">
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
  let lastInfoCardRender = null; // { data, torrents, imdb, season, episode, ytsLanguage }
  let lastChangeResultCandidates = null; // array of TMDb search results for "Change result" dropdown

  /* Apply theme immediately on load */
  applyTheme(SETTINGS.activeTheme || 'tmdb');

  maybeShowAnnouncement();

  function linkTargetAttr() {
    return SETTINGS.openLinksInNewTab ? 'target="_blank" rel="noopener"' : '';
  }

  function linkExternalTabArrow() {
    return SETTINGS.openLinksInNewTab ? ' ↗' : '';
  }

  function rerenderInfoCardIfPresent() {
    const existing = document.querySelector('.tmdb-info-card');
    if (!existing || !lastInfoCardRender) return;
    try { existing.remove(); } catch (e) { /* ignore */ }
    try {
      renderInfoBox(
        lastInfoCardRender.data,
        lastInfoCardRender.torrents,
        lastInfoCardRender.imdb,
        lastInfoCardRender.season,
        lastInfoCardRender.episode,
        lastInfoCardRender.ytsLanguage,
        lastInfoCardRender.episodeDisplayName
      );
    } catch (e) { /* ignore */ }
    try { ensureChangeResultButton(); } catch (e) { /* ignore */ }
  }

  function ensureChangeResultButton() {
    // Only meaningful on search result pages (SERP). Prevent stale search candidates from showing on IMDb/Trakt/YTS.
    const infoCard = getMountTarget().querySelector('.tmdb-info-card');
    if (!infoCard) return;
    const detailsDiv = infoCard.querySelector('#tmdb-details');
    if (!detailsDiv) return;
    if (!(isGoogle || isBing)) {
      detailsDiv.querySelector('.tmdb-result-selector')?.remove();
      detailsDiv.querySelector('#tmdb-change-result-btn')?.remove();
      return;
    }

    const existingBtn = detailsDiv.querySelector('#tmdb-change-result-btn');
    const existingSel = detailsDiv.querySelector('.tmdb-result-selector');

    if (!SETTINGS.enableChangeResultButton || !Array.isArray(lastChangeResultCandidates) || lastChangeResultCandidates.length < 2) {
      existingSel?.remove();
      existingBtn?.remove();
      return;
    }
    if (existingBtn) return;

    const results = lastChangeResultCandidates;
    const changeBtn = document.createElement('button');
    changeBtn.id = 'tmdb-change-result-btn';
    changeBtn.className = 'tmdb-btn ghost';
    changeBtn.style.marginTop = '8px'; changeBtn.style.marginLeft = '5px';
    changeBtn.textContent = 'Change result';

    const stremioWrapper = detailsDiv.querySelector('a[href^="stremio://detail/"]')?.parentNode || null;
    if (stremioWrapper) detailsDiv.insertBefore(changeBtn, stremioWrapper);
    else detailsDiv.appendChild(changeBtn);

    changeBtn.addEventListener('click', () => {
      const existingSel2 = detailsDiv.querySelector('.tmdb-result-selector');
      if (existingSel2) { existingSel2.remove(); return; }

      const selWrap = document.createElement('div');
      selWrap.className = 'tmdb-result-selector';
      selWrap.style.padding = '10px';
      selWrap.innerHTML = `<div style="font-weight:bold;margin-bottom:6px">Select a different Search result</div>`;

      const sel = document.createElement('select');
      sel.style.width = '100%'; sel.style.marginBottom = '8px';
      results.forEach((r, idx) => {
        const opt = document.createElement('option');
        const year = (r.release_date || r.first_air_date || '').slice(0, 4) || '----';
        opt.value = idx;
        opt.text = `${(r.media_type || '').toUpperCase()} — ${r.title || r.name} (${year})`;
        sel.appendChild(opt);
      });

      sel.addEventListener('change', async () => {
        const idx = parseInt(sel.value, 10);
        selWrap.remove();
        await processSearchResult(results[idx]);
        ensureChangeResultButton();
      });

      selWrap.appendChild(sel);
      detailsDiv.appendChild(selWrap);
    });
  }

  function formatSpecialThanksHtml(forSettingsPanel) {
    const entries = Object.entries(specialThanks).filter(([, u]) => u && String(u).trim());
    if (!entries.length) return '';
    const parts = entries.map(([name, url]) => {
      const esc = String(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const safeUrl = String(url).replace(/"/g, '&quot;');
      return `<a href="${safeUrl}" ${linkTargetAttr()}>${esc}</a>`;
    });
    const inner = `Special Thanks to: ${parts.join(' · ')}`;
    if (forSettingsPanel) {
      return `<div class="full tmdb-special-thanks tmdb-special-thanks--settings">${inner}</div>`;
    }
    return `<div class="tmdb-special-thanks tmdb-special-thanks--card">${inner}</div>`;
  }

  /* ----------------------------------------------------
  * Styles
  * All colour references now go through CSS custom properties.
  * The five roles map to the active theme palette:
  *   rgb(var(--tm-bg))       dark background
  *   rgb(var(--tm-surface))  panel/card surface
  *   rgb(var(--tm-accent))   brand accent (links, highlights)
  *   rgb(var(--tm-text))     primary readable text
  *   rgb(var(--tm-border))   border / separator
  * -------------------------------------------------- */

  GM_addStyle(`
    /* ---- Themed base classes ---- */
    .transparency {
      background: rgba(var(--tm-surface) / 0.45);
      backdrop-filter: blur(7px);
      color: rgb(var(--tm-text));
    }
    .no-transparency {
      background: rgb(var(--tm-surface));
      color: rgb(var(--tm-text));
    }

    /* ---- Settings overlay ---- */
    .tmdb-settings-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 999999;
      display: flex; align-items: center; justify-content: center;
    }
    .tmdb-settings {
      width: clamp(50vw, 94vw, 560px);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgb(var(--tm-border));
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
    }
    .tmdb-settings header {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(var(--tm-border) / 0.35);
    }
    .tmdb-settings header h2 { margin: 0; font-size: 18px; }
    .tmdb-settings .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
      display: grid;
      /* At most ~3 columns: min track is max(160px, one-third of row minus gaps). Fewer columns on narrow widths. */
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(100%, max(160px, calc((100% - 24px) / 3))), 1fr)
      );
      gap: 12px;
      align-items: start;
      scrollbar-width: thin;
      scrollbar-color: rgba(var(--tm-accent) / 0.55) rgba(var(--tm-bg) / 0.4);
    }
    .tmdb-settings .body::-webkit-scrollbar {
      width: 10px;
    }
    .tmdb-settings .body::-webkit-scrollbar-track {
      background: rgba(var(--tm-bg) / 0.35);
      border-radius: 999px;
      margin: 4px 0;
    }
    .tmdb-settings .body::-webkit-scrollbar-thumb {
      background: rgba(var(--tm-accent) / 0.45);
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .tmdb-settings .body::-webkit-scrollbar-thumb:hover {
      background: rgba(var(--tm-accent) / 0.7);
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .tmdb-settings .body .full { grid-column: 1 / -1; }
    .tmdb-settings .body > label {
      min-width: 0;
      align-items: flex-start;
    }
    .tmdb-settings .body > label input[type="checkbox"] {
      flex-shrink: 0;
      margin-top: 3px;
    }

    /* ---- Theme picker row ---- */
    .tmdb-theme-row {
      grid-column: 1 / -1;
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 8px 10px;
      background: rgba(var(--tm-surface) / 0.5);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 8px;
    }
    .tmdb-theme-row label { font-weight: 600; white-space: nowrap; }
    .tmdb-theme-row select {
      flex: 1; min-width: 140px;
      background: rgba(var(--tm-bg) / 1);
      color: rgb(var(--tm-text));
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 6px; padding: 6px 8px; font-weight: 600;
    }
    /* Custom colour swatches */
    .tmdb-custom-colors {
      grid-column: 1 / -1;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;
      padding: 10px;
      background: rgba(var(--tm-surface) / 0.35);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 8px;
    }
    .tmdb-custom-colors label {
      display: flex; flex-direction: column; gap: 4px;
      padding: 0; background: none; border: none;
      font-weight: 600; font-size: 12px;
    }
    .tmdb-custom-colors input[type="color"] {
      width: 100%; height: 32px; border-radius: 6px; border: none; cursor: pointer;
      padding: 2px;
    }
    .tmdb-custom-colors .rgb-preview {
      font-size: 11px; opacity: 0.65; font-family: monospace;
    }
    .tmdb-custom-colors .tmdb-custom-theme-reset {
      grid-column: 1 / -1;
      display: flex; justify-content: flex-end;
      margin-top: 2px;
    }

    /* ---- Settings misc ---- */
    .tmdb-settings details.tmdb-keys-details {
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 8px; padding: 8px 10px;
      background: rgba(var(--tm-surface) / 0.35);
    }
    .tmdb-settings details.tmdb-keys-details summary {
      cursor: pointer; font-weight: 600;
      color: rgb(var(--tm-text)); padding: 4px 0; user-select: none;
    }
    .tmdb-settings .tmdb-keys-help {
      font-size: 12px; opacity: 0.75; margin: 0 0 10px; line-height: 1.45;
      color: rgb(var(--tm-text));
    }
    .tmdb-settings label {
      display: flex; gap: 8px; align-items: center;
      padding: 8px 10px;
      background: rgba(var(--tm-surface) / 0.5);
      backdrop-filter: blur(7px);
      cursor: pointer;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 8px;
      color: rgb(var(--tm-text)); font-weight: 600; user-select: none;
    }
    .tmdb-settings .row { display: flex; gap: 8px; align-items: center; }
    .tmdb-settings input[type="text"],
    .tmdb-settings textarea {
      width: 98%;
      background: rgb(var(--tm-bg));
      color: rgb(var(--tm-text));
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 8px; padding: 8px;
    }
    .tmdb-settings footer {
      flex-shrink: 0;
      display: flex; gap: 8px; justify-content: flex-end;
      padding: 14px 16px;
      border-top: 1px solid rgba(var(--tm-border) / 0.35);
    }

    /* ---- Buttons ---- */
    .tmdb-btn { cursor: pointer; border: none; border-radius: 8px; padding: 8px 12px; font-weight: 600; }
    .tmdb-btn.primary { background: rgb(var(--tm-accent)); color: rgb(var(--tm-bg)); }
    .tmdb-btn.ghost {
      background: transparent;
      color: rgb(var(--tm-accent));
      border: 1px solid rgb(var(--tm-accent));
    }

    /* ---- Toast ---- */
    .tmdb-notification {
      position: fixed; left: 50%; top: 50%; transform: translate(-50%,-50%);
      background: rgba(var(--tm-bg) / 0.95);
      color: rgb(var(--tm-accent));
      padding: 12px 16px; border-radius: 8px;
      z-index: 999998; box-shadow: 0 6px 20px rgba(0,0,0,.35);
      opacity: 0; transition: opacity .2s ease;
    }
    .tmdb-notification.show { opacity: 1; }

    /* ---- Info card ---- */
    .tmdb-info-card {
      padding: 10px;
      background: rgba(var(--tm-bg) / 0.1);
      border-left: 5px solid rgb(var(--tm-accent));
      margin-bottom: 12px; font-family: Arial;
      user-select: none; position: relative;
    }
    .tmdb-info-card .tmdb-title { font-size: 18px; font-weight: bold; }
    .tmdb-special-thanks--settings {
      font-size: 12px; opacity: 0.85; line-height: 1.5;
      color: rgb(var(--tm-text)); margin-top: 4px; padding: 8px 10px;
      background: rgba(var(--tm-surface) / 0.35);
      border-radius: 8px; border: 1px solid rgba(255,255,255,.06);
    }
    .tmdb-special-thanks--settings a { color: rgb(var(--tm-accent)); font-weight: 600; }
    .tmdb-special-thanks--card { font-size: 12px; opacity: 0.88; margin-top: 10px; line-height: 1.45; color: rgb(var(--tm-text)); }
    .tmdb-special-thanks--card a { color: rgb(var(--tm-accent)); font-weight: 600; }
    .tmdb-copy { cursor: pointer; }

    /* ---- Player controls ---- */
    #tmdb-play-controls select,
    .tmdb-play-controls select {
      background: rgb(var(--tm-bg));
      color: rgb(var(--tm-text));
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 6px; padding: 6px 8px; font-weight: 600;
    }
    #tmdb-play-controls button,
    .tmdb-play-controls button { vertical-align: middle; }

    /* ---- Search button ---- */
    #tmdb-button {
      margin: 10px 0; padding: 8px 12px;
      background: rgb(var(--tm-bg));
      color: rgb(var(--tm-accent));
      border: 1px solid rgb(var(--tm-accent));
      border-radius: 4px; cursor: pointer; font-weight: bold; user-select: none;
    }
    #tmdb-button:hover { background: rgb(var(--tm-accent)); color: rgb(var(--tm-bg)); border-color: rgb(var(--tm-bg)); }

    /* ---- Floating settings FAB ---- */
    #tmdb-fab-settings {
      position: fixed; right: 14px; bottom: 14px;
      width: 44px; height: 44px; border-radius: 50%;
      background: rgb(var(--tm-accent)); color: rgb(var(--tm-bg));
      border: none; box-shadow: 0 6px 18px rgba(0,0,0,.35);
      z-index: 1000000;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 20px;
    }
    #tmdb-fab-settings:hover { transform: scale(1.05); }

    /* ---- Trailer ---- */
    .tmdb-trailer-btn { margin-left: 8px; }
    .tmdb-trailer-modal {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.75);
      z-index: 1000001;
      display: flex; align-items: center; justify-content: center;
    }
    .tmdb-trailer-content {
      width: 80vw; max-width: 1900px;
      aspect-ratio: 16/9; height: auto; max-height: 95vh;
      background: #000; border-radius: 8px; overflow: hidden; position: relative;
    }
    .tmdb-trailer-content iframe { width: 100%; height: 100%; border: 0; background: #000; }
    .tmdb-trailer-close {
      position: absolute; right: 8px; top: 8px; z-index: 10;
      background: rgba(255,255,255,.06); border: none; color: #fff;
      border-radius: 6px; padding: 6px 8px; cursor: pointer;
    }

    /* ---- Announcement ---- */
    .tmdb-announcement-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.75);
      z-index: 9999999; display: flex; align-items: center; justify-content: center;
    }
    .tmdb-announcement-box {
      border-radius: 12px; padding: 20px 24px;
      width: min(90vw, 450px);
      box-shadow: 0 0 30px rgba(0,0,0,0.5);
      position: relative; animation: fadeIn 0.25s ease-out;
    }
    .tmdb-announcement-close {
      position: absolute; right: 10px; top: 8px;
      background: rgba(255,255,255,0.1); border: none; color: #fff;
      border-radius: 4px; padding: 4px 8px; cursor: pointer;
    }
    .tmdb-announcement-content { margin-top: 10px; font-size: 15px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    /* Trakt summary play: no layout overrides — classes + data-* mirror native .trakt-action-button */
  `);

  /* ----------------------------------------------------
   * Helper: convert hex colour string → "R G B" triplet
   * -------------------------------------------------- */
  function hexToRgbTriplet(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean;
    const num = parseInt(full, 16);
    if (isNaN(num)) return null;
    return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
  }

  /** Convert an "R G B" triplet to a #rrggbb hex string for colour pickers */
  function rgbTripletToHex(triplet) {
    const parts = String(triplet).trim().split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return '#000000';
    return '#' + parts.map(n => n.toString(16).padStart(2, '0')).join('');
  }

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

  function getGmXhr() {
    if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
    if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
      return (opts) => GM.xmlHttpRequest(opts);
    }
    return null;
  }

  function getCallerLineForDebug(skipFrames = 2) {
    try {
      const stack = String(new Error().stack || '');
      const lines = stack.split('\n').map(s => s.trim()).filter(Boolean);
      const candidates = lines.slice(skipFrames);
      for (const line of candidates) {
        // Chrome-style: "at fn (https://.../movies-tv-series.user.js:1234:56)"
        const m = line.match(/:(\d+):\d+\)?$/);
        if (m) return Number(m[1]);
      }
    } catch { /* ignore */ }
    return null;
  }

  function debugNetLog(kind, url, status, response, err = null) {
    if (!SETTINGS.debugNetworkRequests) return;
    const line = getCallerLineForDebug(3);
    const where = line ? `:${line}` : '';
    const tag = `[TMDb Debug] ${kind}${where}`;
    try {
      const group = console.groupCollapsed ? console.groupCollapsed : console.log;
      group(tag, { url, status });
      if (err) console.error('error', err);
      if (typeof response !== 'undefined') console.log('response', response);
      if (console.groupEnd) console.groupEnd();
    } catch { /* ignore */ }
  }

  function tmdbApiGetJson(url) {
    const xhr = getGmXhr();
    if (xhr) {
      return new Promise((resolve, reject) => {
        xhr({
          method: 'GET', url, timeout: 45000,
          onload(resp) {
            if (resp.status < 200 || resp.status >= 300) { reject(new Error(`TMDb HTTP ${resp.status}`)); return; }
            try {
              const json = JSON.parse(resp.responseText || '{}');
              debugNetLog('GM_xmlhttpRequest', url, resp.status, json);
              resolve(json);
            } catch (e) {
              debugNetLog('GM_xmlhttpRequest', url, resp.status, resp.responseText, e);
              reject(e);
            }
          },
          onerror(e) { debugNetLog('GM_xmlhttpRequest', url, resp?.status, undefined, e || new Error('TMDb network error')); reject(new Error('TMDb network error')); },
          ontimeout(e) { debugNetLog('GM_xmlhttpRequest', url, resp?.status, undefined, e || new Error('TMDb request timeout')); reject(new Error('TMDb request timeout')); },
        });
      });
    }
    return fetch(url).then(async (r) => {
      const status = r.status;
      if (!r.ok) {
        let text = '';
        try { text = await r.text(); } catch { /* ignore */ }
        debugNetLog('fetch', url, status, text);
        throw new Error(`TMDb HTTP ${status}`);
      }
      const json = await r.json();
      debugNetLog('fetch', url, status, json);
      return json;
    }).catch((e) => { debugNetLog('fetch', url, undefined, undefined, e); throw e; });
  }

  function jikanApiGetJson(url) {
    const xhr = getGmXhr();
    if (xhr) {
      return new Promise((resolve, reject) => {
        xhr({
          method: 'GET', url, timeout: 45000,
          onload(resp) {
            if (resp.status < 200 || resp.status >= 300) { reject(new Error(`Jikan HTTP ${resp.status}`)); return; }
            try {
              const json = JSON.parse(resp.responseText || '{}');
              debugNetLog('GM_xmlhttpRequest', url, resp.status, json);
              resolve(json);
            } catch (e) {
              debugNetLog('GM_xmlhttpRequest', url, resp.status, resp.responseText, e);
              reject(e);
            }
          },
          onerror() { reject(new Error('Jikan network error')); },
          ontimeout() { reject(new Error('Jikan request timeout')); },
        });
      });
    }
    return fetch(url).then(async (r) => {
      if (!r.ok) {
        let text = '';
        try { text = await r.text(); } catch { /* ignore */ }
        debugNetLog('fetch', url, r.status, text);
        throw new Error(`Jikan HTTP ${r.status}`);
      }
      const json = await r.json();
      debugNetLog('fetch', url, r.status, json);
      return json;
    }).catch((e) => { debugNetLog('fetch', url, undefined, undefined, e); throw e; });
  }

  /* ----------------------------------------------------
   * Env & Query Helpers
   * -------------------------------------------------- */
  const hostname = location.hostname;
  const isGoogle = hostname.includes('google.');
  const isBing = hostname.includes('bing.com');
  const isBrave = hostname.includes('search.brave.com');
  const isDuckDuckGo = hostname.includes('duckduckgo.com');
  const isImdb = hostname.includes('imdb.com');
  const isTrakt = hostname.includes('trakt.tv');
  const isSimkl = hostname.includes('simkl.com');
  const isYTS = hostname.includes('yts.') || hostname.includes('yts.mx') || hostname.includes('yts.bz') || hostname.includes('yts.lt') || hostname.includes('yts.ag') || hostname.includes('yts.am') || hostname.includes('yts.gg');

  /** First calendar year in Simkl’s year/network row (e.g. 1995–1996 → 1995). */
  function extractSimklPremiereYear() {
    const row = document.querySelector('.SimklTVAboutYearCountry');
    if (!row) return null;
    const links = row.querySelectorAll('a');
    for (let i = 0; i < links.length; i++) {
      const t = (links[i].textContent || '').trim();
      if (/^\d{4}$/.test(t)) return parseInt(t, 10);
    }
    const m = (row.textContent || '').match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  /**
   * English-friendly titles for TMDb search: Simkl keeps English in `itemprop="name"` or
   * `itemprop="alternateName"` depending on display mode (English / romaji / native).
   */
  function extractSimklEnglishTitleCandidates() {
    const h1 = document.querySelector('#bigtext-id0 h1[itemprop="name"]')?.textContent?.trim()
      || document.querySelector('.SimklTVAboutTitleText h1[itemprop="name"]')?.textContent?.trim()
      || '';
    const h2 = document.querySelector('#bigtext-id1 h2[itemprop="alternateName"]')?.textContent?.trim()
      || document.querySelector('.SimklTVAboutTitleText h2[itemprop="alternateName"]')?.textContent?.trim()
      || '';
    if (!h1 && !h2) return [];
    const cjk = /[\u3040-\u30FF\u3400-\u9FFF]/;
    const wc = (s) => (s ? s.split(/\s+/).filter(Boolean).length : 0);
    const uniq = [];
    const add = (s) => { const t = String(s).trim(); if (t && !uniq.some(u => u.toLowerCase() === t.toLowerCase())) uniq.push(t); };

    if (cjk.test(h1)) {
      if (h2) add(h2);
      add(h1);
      return uniq;
    }
    if (h1 && h2 && !cjk.test(h1) && !cjk.test(h2)) {
      if (wc(h2) > wc(h1)) { add(h2); add(h1); }
      else if (wc(h1) > wc(h2)) { add(h1); add(h2); }
      else { add(h1); add(h2); }
      return uniq;
    }
    add(h1);
    add(h2);
    return uniq;
  }

  async function resolveMalIdToTmdb(malId) {
    const apiKey = getNextApiKey();

    async function trySearchTv(titles, year) {
      const tried = new Set();
      for (let i = 0; i < titles.length; i++) {
        const trimmed = String(titles[i]).trim();
        if (!trimmed || tried.has(trimmed.toLowerCase())) continue;
        tried.add(trimmed.toLowerCase());
        let url = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(trimmed)}`;
        if (year != null) url += `&first_air_date_year=${year}`;
        try {
          const searchJson = await tmdbApiGetJson(url);
          const first = searchJson?.results?.[0];
          if (first?.id) return { tmdb: String(first.id), type: 'tv' };
        } catch (e) { /* try next title */ }
      }
      return null;
    }

    if (isSimkl && isSimklTitleDetailPage()) {
      const domYear = extractSimklPremiereYear();
      const domTitles = extractSimklEnglishTitleCandidates();
      if (domTitles.length) {
        const hit = await trySearchTv(domTitles, domYear);
        if (hit) return hit;
      }
    }

    try {
      const jikan = await jikanApiGetJson(`https://api.jikan.moe/v4/anime/${encodeURIComponent(malId)}`);
      const d = jikan?.data;
      if (!d) return null;
      const year = d.year || d.aired?.prop?.from?.year || null;
      const titles = [];
      if (d.title_english) titles.push(d.title_english);
      if (d.title) titles.push(d.title);
      if (d.title_japanese && !titles.includes(d.title_japanese)) titles.push(d.title_japanese);
      return await trySearchTv(titles, year);
    } catch (e) { console.error('MAL→TMDb resolve failed:', e); }
    return null;
  }

  function currentSerpEngineEnabled() {
    if (isGoogle) return SETTINGS.enableOnGooglePage;
    if (isBing) return SETTINGS.enableOnBingPage;
    if (isBrave) return SETTINGS.enableOnBravePage;
    if (isDuckDuckGo) return SETTINGS.enableOnDuckDuckGoPage;
    return false;
  }

  function isSearch() {
    if (isGoogle || isBing || isBrave || isDuckDuckGo) return true;
  }

  function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    if (isGoogle) return params.get('q');
    if (isBing) {
      const fromQs = params.get('q') || params.get('pq');
      if (fromQs && fromQs.trim()) return fromQs.trim();
      try {
        const hashQs = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hq = hashQs.get('q');
        if (hq && hq.trim()) return hq.trim();
      } catch (e) { /* ignore */ }
      const input = document.querySelector('input#sb_form_q, textarea#sb_form_q, input[name="q"], textarea[name="q"]');
      const fromDom = input?.value?.trim();
      if (fromDom) return fromDom;
      return null;
    }
    if (isBrave) return params.get('q') || params.get('query') || params.get('search') || null;
    if (isDuckDuckGo) {
      const fromQs = params.get('q');
      if (fromQs && fromQs.trim()) return fromQs.trim();
      const input = document.querySelector('#searchbox_input, input[name="q"], textarea[name="q"]');
      const fromDom = input?.value?.trim();
      if (fromDom) return fromDom;
      return null;
    }
    return null;
  }

  /** DuckDuckGo React SERP: insert inside mainline section so the card sits under filter chips and above result rows. */
  function getDuckDuckGoMountPoint() {
    const mainline = document.querySelector('section[data-testid="mainline"], section[data-area="mainline"]');
    if (mainline?.isConnected) return mainline;
    const ol = document.querySelector('ol.react-results--main');
    if (ol?.parentElement?.isConnected) return ol.parentElement;
    const vertical = document.querySelector('[data-testid="web-vertical"]');
    if (vertical?.isConnected) return vertical;
    return document.querySelector('.results--main') || document.body;
  }

  function getInsertionPoint() {
    if (isGoogle) {
      return document.getElementById('search')
        || document.querySelector('form[role="search"]')?.closest('div')
        || document.body;
    }
    if (isBing) {
      return document.getElementById('b_content')
        || document.querySelector('#b_content')
        || document.querySelector('main[role="main"]')
        || document.querySelector('#b_results')?.parentElement
        || document.querySelector('#b_results')
        || document.body;
    }
    if (isBrave) return document.getElementById('results') || document.body;
    if (isDuckDuckGo) return getDuckDuckGoMountPoint();
    return document.body;
  }

  const parent = getInsertionPoint();
  let cleanedQuery = null;

  function getMountTarget() {
    if (!isSearch()) return parent?.isConnected ? parent : document.body;
    if (isBing) {
      const u = document.getElementById('b_content')
        || document.querySelector('#b_content')
        || document.querySelector('main[role="main"]')
        || document.querySelector('#b_results')?.parentElement
        || document.querySelector('#b_results')
        || (parent?.isConnected ? parent : null)
        || document.body;
      return u?.isConnected ? u : document.body;
    }
    if (isGoogle) {
      const u = document.getElementById('search')
        || document.querySelector('form[role="search"]')?.closest('div')
        || (parent?.isConnected ? parent : null)
        || document.body;
      return u?.isConnected ? u : document.body;
    }
    if (isBrave) {
      const u = document.getElementById('results')
        || (parent?.isConnected ? parent : null)
        || document.body;
      return u?.isConnected ? u : document.body;
    }
    if (isDuckDuckGo) {
      const u = getDuckDuckGoMountPoint()
        || (parent?.isConnected ? parent : null)
        || document.body;
      return u?.isConnected ? u : document.body;
    }
    return document.body;
  }

  if (isSearch()) {
    if (!parent) return;
    const queryRaw = getSearchQuery();
    if (!queryRaw) return;
    cleanedQuery = queryRaw.replace(/(watch|online|cast|movie|movies|tv|stream|showtimes|series|episodes|trakt|tmdb|imdb)/gi, '').replace(/\s+/g, ' ').trim();
  }

  /* ----------------------------------------------------
   * Notifications
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

  const GM_KEY_FAB_HIDDEN_HINT = 'tmdb_fab_hidden_hint_shown';

  function applySettingsFab(opts = {}) {
    const suppressHiddenHint = !!opts.suppressHiddenHint;
    const existing = document.getElementById('tmdb-fab-settings');
    if (SETTINGS.showSettingsButton) {
      if (existing) {
        existing.style.display = '';
        return;
      }
      const fab = document.createElement('button');
      fab.id = 'tmdb-fab-settings';
      fab.title = 'Movie/TV Shows Links Aggregator Script Settings (Shift+R)';
      fab.innerHTML = '⚙';
      fab.addEventListener('click', openSettingsPanel);
      document.body.appendChild(fab);
    } else {
      existing?.remove();
      if (!suppressHiddenHint && !GM_getValue(GM_KEY_FAB_HIDDEN_HINT, false)) {
        showNotification('Settings button is hidden. Open settings with Shift+R or use the userscript menu to toggle it back on.');
        GM_setValue(GM_KEY_FAB_HIDDEN_HINT, true);
      }
    }
  }

  function registerFabMenuCommands() {
    const reg =
      typeof GM_registerMenuCommand === 'function'
        ? (caption, fn) => { GM_registerMenuCommand(caption, fn); }
        : typeof GM !== 'undefined' && typeof GM.registerMenuCommand === 'function'
          ? (caption, fn) => { GM.registerMenuCommand(caption, fn); }
          : null;
    if (!reg) return;
    reg('Show/hide settings button', () => {
      const next = !SETTINGS.showSettingsButton;
      SETTINGS = { ...SETTINGS, showSettingsButton: next };
      saveSettings(SETTINGS);
      applySettingsFab({ suppressHiddenHint: true });
      showNotification(
        next ? 'Settings button shown.' : 'Settings button hidden. Shift+R still opens settings.',
        next ? 3000 : 4000
      );
    });
  }

  /* ----------------------------------------------------
   * Settings Panel (Shift+R)
   * -------------------------------------------------- */
  function openSettingsPanel() {
    if (document.querySelector('.tmdb-settings-overlay')) { closeSettingsPanel(); return; }

    const keysStr = JSON.parse(GM_getValue('tmdb_api_keys') || '[]').join(', ');
    const curTheme = SETTINGS.activeTheme || 'tmdb';

    /* Build theme options */
    const themeOptions = Object.entries(THEME_PALETTES).map(([key, pal]) =>
      `<option value="${key}" ${curTheme === key ? 'selected' : ''}>${pal.label}</option>`
    ).join('');

    /* Build custom-colour inputs (hidden unless custom theme is active) */
    const customColorFields = CUSTOM_THEME_FIELDS.map(({ key, label }) => {
      const triplet = SETTINGS[key] || DEFAULT_SETTINGS[key];
      const hex = rgbTripletToHex(triplet);
      return `
        <label>
          <span>${label}</span>
          <input type="color" id="cc-${key}" value="${hex}" data-setting="${key}">
          <span class="rgb-preview" id="ccprev-${key}">${triplet}</span>
        </label>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'tmdb-settings-overlay';
    overlay.innerHTML = `
      <div class="tmdb-settings ${SETTINGS.enableTransparencyMode ? 'transparency' : 'no-transparency'}" role="dialog" aria-modal="true">
        <header>
          <h2>${SCRIPT_NAME} Settings <b>(v${ANNOUNCEMENT_VERSION})</b></h2>
          <button class="tmdb-btn ghost" id="tmdb-close">✕</button>
        </header>
        <div class="body">

          <!-- Theme picker -->
          <div class="tmdb-theme-row">
            <label for="tmdb-theme-select">Theme</label>
            <select id="tmdb-theme-select">${themeOptions}</select>
          </div>

          <!-- Custom colour swatches (shown only when custom is selected) -->
          <div class="tmdb-custom-colors full" id="tmdb-custom-colors-section" style="display:${curTheme === 'custom' ? 'grid' : 'none'};">
            ${customColorFields}
            <div class="tmdb-custom-theme-reset">
              <button type="button" class="tmdb-btn ghost" id="tmdb-reset-custom-theme">Reset custom colors to default</button>
            </div>
          </div>

          ${checkbox('autoDetectOnSERP', 'Auto-detect Movies/TV Shows', SETTINGS.autoDetectOnSERP)}
          ${checkbox('enableOnGooglePage', 'Google support', SETTINGS.enableOnGooglePage)}
          ${checkbox('enableOnBingPage', 'Bing support', SETTINGS.enableOnBingPage)}
          ${checkbox('enableOnBravePage', 'Brave support', SETTINGS.enableOnBravePage)}
          ${checkbox('enableOnDuckDuckGoPage', 'DuckDuckGo support', SETTINGS.enableOnDuckDuckGoPage)}
          ${checkbox('enableOnImdbPage', 'IMDB support', SETTINGS.enableOnImdbPage)}
          ${checkbox('enableOnTraktPage', 'Trakt support', SETTINGS.enableOnTraktPage)}
          ${checkbox('enableOnSimklPage', 'Simkl support', SETTINGS.enableOnSimklPage)}
          ${checkbox('enableOnYTSPage', 'YTS support', SETTINGS.enableOnYTSPage)}
          ${checkbox('enableNotifications', 'Notifications', SETTINGS.enableNotifications)}
          ${checkbox('enableStreamingLinks', 'Streaming links', SETTINGS.enableStreamingLinks)}
          ${checkbox('enableFrontendLinks', 'Frontend links', SETTINGS.enableFrontendLinks)}
          ${checkbox('enableTorrentSiteShortcuts', 'Torrent sites', SETTINGS.enableTorrentSiteShortcuts)}
          ${checkbox('openLinksInNewTab', 'Open links in new tab', SETTINGS.openLinksInNewTab)}
          ${checkbox('enableYtsTorrents', 'YTS Direct Magnets (Movies only)', SETTINGS.enableYtsTorrents)}
          ${checkbox('enableStremioLink', '"Open in Stremio" link', SETTINGS.enableStremioLink)}
          ${checkbox('enableTraktLink', 'Trakt link', SETTINGS.enableTraktLink)}
          ${checkbox('enableTraktSearchLink', 'Trakt search results link', SETTINGS.enableTraktSearchLink)}
          ${checkbox('enableSimklLink', 'Simkl link', SETTINGS.enableSimklLink)}
          ${checkbox('enableTrailerButton', 'Watch trailer button', SETTINGS.enableTrailerButton)}
          ${checkbox('enableChangeResultButton', 'Change result button', SETTINGS.enableChangeResultButton)}
          ${checkbox('enableEpisodeSelection', 'Allow changing episode number (TV only)', SETTINGS.enableEpisodeSelection, true)}
          ${checkbox('showCertifications', 'Certification', SETTINGS.showCertifications)}
          ${checkbox('enableTransparencyMode', 'Transparency/Glassy mode', SETTINGS.enableTransparencyMode)}
          ${checkbox('debugNetworkRequests', 'Debug network requests (console logs)', SETTINGS.debugNetworkRequests)}
          ${checkbox('enableTrailerAutoPlay', `Autoplay Trailer (beware of volume)<a href="https://www.mrfdev.com/enhancer-for-youtube" ${linkTargetAttr()}>[for constant volumes use this extension]</a>`, SETTINGS.enableTrailerAutoPlay, true)}
          ${checkbox('showSettingsButton', 'Show settings button (⚠️ Use with caution) [Shift+R still opens settings; userscript menu toggles this button]', SETTINGS.showSettingsButton, true)}

          ${formatSpecialThanksHtml(true)}

          <div class="full">
            <details class="tmdb-keys-details">
              <summary>TMDb API keys</summary>
              <p class="tmdb-keys-help">Enter multiple keys separated by commas. Using several keys lets the script rotate among them and reduces hitting TMDb rate limits compared to using a single key.</p>
              <label class="full" style="flex-direction:column;align-items:flex-start">
                <span style="opacity:.85;margin-bottom:6px">Comma-separated keys</span>
                <textarea id="tmdb-keys" rows="3" placeholder="key1, key2, key3">${keysStr}</textarea>
              </label>
            </details>
          </div>
        </div>
        <footer>
          <div class="full">
            <button class="tmdb-btn ghost" id="tmdb-show-announcement">
              Show latest announcement
            </button>
          </div>
          <button class="tmdb-btn primary" id="tmdb-save">Save &amp; Apply</button>
        </footer>
      </div>`;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSettingsPanel(); });
    document.body.appendChild(overlay);

    /* Live preview: show/hide custom colour section when theme changes */
    const themeSelect = overlay.querySelector('#tmdb-theme-select');
    const customSection = overlay.querySelector('#tmdb-custom-colors-section');
    themeSelect.addEventListener('change', () => {
      customSection.style.display = themeSelect.value === 'custom' ? 'grid' : 'none';
      /* Live-preview the selected preset theme immediately */
      applyTheme(themeSelect.value);
    });

    /* Live preview as colour pickers change */
    overlay.querySelectorAll('.tmdb-custom-colors input[type="color"]').forEach(picker => {
      picker.addEventListener('input', () => {
        const triplet = hexToRgbTriplet(picker.value);
        if (!triplet) return;
        const prevEl = overlay.querySelector(`#ccprev-${picker.dataset.setting}`);
        if (prevEl) prevEl.textContent = triplet;
        /* If custom is the currently-selected theme, live-preview */
        if (themeSelect.value === 'custom') {
          /* Temporarily write into SETTINGS for applyTheme to read */
          SETTINGS[picker.dataset.setting] = triplet;
          applyTheme('custom');
        }
      });
    });

    const resetCustomThemeBtn = overlay.querySelector('#tmdb-reset-custom-theme');
    if (resetCustomThemeBtn) {
      resetCustomThemeBtn.addEventListener('click', () => {
        CUSTOM_THEME_FIELDS.forEach(({ key }) => {
          const triplet = DEFAULT_SETTINGS[key];
          const picker = overlay.querySelector(`#cc-${key}`);
          const prevEl = overlay.querySelector(`#ccprev-${key}`);
          if (picker) picker.value = rgbTripletToHex(triplet);
          if (prevEl) prevEl.textContent = triplet;
          SETTINGS[key] = triplet;
        });
        if (themeSelect.value === 'custom') applyTheme('custom');
        showNotification('Custom theme colors reset to defaults (click Save to persist).', 4000);
      });
    }

    document.getElementById('tmdb-close').onclick = closeSettingsPanel;

    document.getElementById('tmdb-save').onclick = () => {
      const next = { ...SETTINGS };

      /* Checkboxes */
      Object.keys(DEFAULT_SETTINGS).forEach(k => {
        const el = overlay.querySelector(`#cb-${k}`);
        if (el) next[k] = !!el.checked;
      });

      /* Theme selection */
      next.activeTheme = themeSelect.value;

      /* Custom colour values */
      overlay.querySelectorAll('.tmdb-custom-colors input[type="color"]').forEach(picker => {
        const triplet = hexToRgbTriplet(picker.value);
        if (triplet) next[picker.dataset.setting] = triplet;
      });

      /* API keys */
      const newKeysRaw = overlay.querySelector('#tmdb-keys').value.trim();
      if (newKeysRaw.length) {
        const arr = newKeysRaw.split(',').map(s => s.trim()).filter(Boolean);
        GM_setValue('tmdb_api_keys', JSON.stringify(arr));
        apiKeys = arr; currentKeyIndex = 0;
      }

      SETTINGS = next;
      saveSettings(SETTINGS);
      applyTheme(SETTINGS.activeTheme);
      applySettingsFab({ suppressHiddenHint: true });
      rerenderInfoCardIfPresent();
      showNotification('Settings saved & applied.', 4500);
      closeSettingsPanel();
    };

    document.getElementById("tmdb-show-announcement").onclick = () => {
      closeSettingsPanel();
      showAnnouncementModal(ANNOUNCEMENT_MESSAGE);
    };
  }

  function closeSettingsPanel() {
    const ov = document.querySelector('.tmdb-settings-overlay');
    if (ov) ov.remove();
  }

  function checkbox(id, label, checked, fullRow) {
    const rowClass = fullRow ? ' class="full"' : '';
    return `<label${rowClass}><input id="cb-${id}" type="checkbox" ${checked ? 'checked' : ''}> ${label}</label>`;
  }

  /* Hotkey for settings panel (Shift+R) */
  document.addEventListener('keydown', (e) => { if (e.shiftKey && e.key.toLowerCase() === 'r') openSettingsPanel(); });

  /* ----------------------------------------------------
   * Smart media detection (SERP)
   * -------------------------------------------------- */
  function serpHasMovieTvJsonLd() {
    const typeMatches = (typ) => {
      if (!typ || typeof typ !== 'string') return false;
      /* Exclude VideoObject: Google embeds it for many non-film SERP videos (games, news, places). */
      return /Movie|TVSeries|TelevisionSeries|TVEpisode|CreativeWorkSeason/i.test(typ)
        || /schema\.org\/(Movie|TVSeries|TelevisionSeries|TVEpisode)/i.test(typ);
    };
    const walk = (node) => {
      if (!node || typeof node !== 'object') return false;
      if (Array.isArray(node)) return node.some(walk);
      if (node['@graph']) return walk(node['@graph']);
      const t = node['@type'];
      const types = (Array.isArray(t) ? t : [t]).filter(Boolean);
      if (types.some(typeMatches)) return true;
      if (node.mainEntity && walk(node.mainEntity)) return true;
      if (node.about && walk(node.about)) return true;
      return false;
    };
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      const raw = s.textContent?.trim();
      if (!raw) continue;
      try { if (walk(JSON.parse(raw))) return true; } catch (e) { /* malformed */ }
    }
    return false;
  }

  function serpHasSchemaMicrodata() {
    return !!document.querySelector('[itemtype*="schema.org/Movie"], [itemtype*="schema.org/TVSeries"], [itemtype*="schema.org/TelevisionSeries"]');
  }

  function serpRootsContainMediaSiteLinks(rootSelectors) {
    const anchorSel = [
      'a[href*="themoviedb.org/movie/"]', 'a[href*="themoviedb.org/tv/"]',
      'a[href*="rottentomatoes.com/m/"]', 'a[href*="rottentomatoes.com/tv/"]',
      'a[href*="metacritic.com/movie/"]', 'a[href*="metacritic.com/tv/"]',
      'a[href*="letterboxd.com/film/"]',
    ].join(', ');
    for (const sel of rootSelectors) {
      const root = document.querySelector(sel);
      if (root?.querySelector(anchorSel)) return true;
    }
    return false;
  }

  /** Obvious encyclopedic / geo queries — organic snippets often mention “release”, “cast”, etc. */
  function serpQueryLooksLikeNonMediaLookup(q) {
    const s = String(q || '').trim();
    if (!s) return false;
    return /\b(capital|population|president|prime minister|currency|gdp|official language)s?\s+of\b/i.test(s)
      || /\bwhat\s+is\s+the\s+(capital|population|currency|gdp|official language)\b/i.test(s)
      || /\bwhere\s+is\b.+\blocated\b/i.test(s)
      || /\bhow\s+(many|much)\s+people\b/i.test(s)
      || /\b(area|size|timezone)\s+of\b/i.test(s);
  }

  function scanGoogleForMediaHints() {
    if (!isGoogle || !SETTINGS.enableOnGooglePage) return false;
    if (serpQueryLooksLikeNonMediaLookup(getSearchQuery())) return false;
    if (serpHasMovieTvJsonLd()) return true;
    if (serpHasSchemaMicrodata()) return true;
    if (serpRootsContainMediaSiteLinks(['#search', '#rso', '#main', '#center_col', '#rhs', '#rhs_col'])) return true;
    /* Loose text: knowledge panel only — #center_col / #rso are full results and match people, games, etc. */
    /* No standalone \bMovie(s)\b — geo/topic panels use “Movies” for unrelated lists. */
    // Knowledge/infobox panels: only trigger on "movie/TV" specific fields.
    // Avoid generic entity fields that also exist on games/songs/people (e.g. "Original release", brand names).
    const knowledgePanelRe = /\bTV series\b|\bTV show\b|Run time|Running time|Where to watch|Watch on\b|Original network|Film series|\bSeasons?\s*\d|\bEpisodes?\b[^.\n]{0,80}\bSeason\b/i;
    for (const sel of ['#rhs', '#rhs_col']) {
      const el = document.querySelector(sel);
      if (el && knowledgePanelRe.test(el.innerText)) return true;
    }
    /* Organic + main: stricter — drop Metacritic text (games use Metacritic too) and vague “Original release”. */
    const organicStrictRe = /\bTV series\b|\bTV show\b|Running time|Where to watch|Film series|\bEpisodes?\b[^.\n]{0,120}\bSeason\b/i;
    for (const sel of ['#center_col', '#rso', '#main', '#search']) {
      const el = document.querySelector(sel);
      if (el && organicStrictRe.test(el.innerText)) return true;
    }
    return false;
  }

  function scanBingForMediaHints() {
    if (!isBing || !SETTINGS.enableOnBingPage) return false;
    if (serpQueryLooksLikeNonMediaLookup(getSearchQuery())) return false;
    if (serpHasMovieTvJsonLd()) return true;
    if (serpHasSchemaMicrodata()) return true;
    const bingRoots = ['#b_results', '#b_context', '#b_content', '#results', '#ajaxsrwrap', 'main[role="main"]', 'main', '[role="main"]'];
    if (serpRootsContainMediaSiteLinks(bingRoots)) return true;
    /* Entity / infobox cards only — avoid “Cast”, “Genre”, “Release date” matching whole SERP. */
    // Infobox/entity cards: require "movie/TV" specific fields (avoid triggering from brand names on games/songs/people).
    const entityPanelRe = /\bTV series\b|\bTV show\b|Run time|Running time|Where to watch|Watch on\b|Film series|\bSeasons?\s*\d|TV\s*program|Motion picture|\bEpisodes?\b[^.\n]{0,120}\bSeason\b/i;
    const panelSelectors = ['.b_entityTP', '.b_vList', '#b_context', '.b_ans', '.b_canvas', '.b_slideexp', '.scs_arw', '.rich_card', '.mcd', '.ec_item', '.entityContainer', '.b_antiSideBleed', '.b_wpt_sec'];
    for (const sel of panelSelectors) {
      const el = document.querySelector(sel);
      if (el && entityPanelRe.test(el.innerText)) return true;
    }
    const organicStrictRe = /\bTV series\b|\bTV show\b|Running time|Where to watch|Film series|\bEpisodes?\b[^.\n]{0,120}\bSeason\b|TV\s*program|Motion picture/i;
    for (const sel of ['#b_results', '#b_content', '#ajaxsrwrap', 'main']) {
      const el = document.querySelector(sel);
      if (el && organicStrictRe.test(el.innerText)) return true;
    }
    return false;
  }

  function scanBraveForMediaHints() {
    if (!isBrave || !SETTINGS.enableOnBravePage) return false;
    if (serpQueryLooksLikeNonMediaLookup(getSearchQuery())) return false;
    if (serpHasMovieTvJsonLd()) return true;
    if (serpHasSchemaMicrodata()) return true;

    const braveRoots = ['#results', 'main[role="main"]', 'main', '[role="main"]'];
    if (serpRootsContainMediaSiteLinks(braveRoots)) return true;

    const resultsRoot = document.getElementById('results') || document.querySelector('main') || document.body;
    // Knowledge/infobox panels: only trigger on "movie/TV" specific fields.
    const knowledgePanelRe = /\bTV series\b|\bTV show\b|Run time|Running time|Where to watch|Original network|Film series|\bSeasons?\s*\d|Watch on\b|\bEpisodes?\b[^.\n]{0,80}\bSeason\b/i;
    if (knowledgePanelRe.test(resultsRoot.innerText)) return true;

    const organicStrictRe = /\bTV series\b|\bTV show\b|Running time|Where to watch|Film series|\bEpisodes?\b[^.\n]{0,120}\bSeason\b/i;
    return organicStrictRe.test(resultsRoot.innerText);
  }

  function scanDuckDuckGoForMediaHints() {
    if (!isDuckDuckGo || !SETTINGS.enableOnDuckDuckGoPage) return false;
    if (serpQueryLooksLikeNonMediaLookup(getSearchQuery())) return false;
    if (serpHasMovieTvJsonLd()) return true;
    if (serpHasSchemaMicrodata()) return true;

    const ddgRoots = ['[data-testid="web-vertical"]', 'section[data-testid="mainline"]', 'section[data-area="mainline"]', 'ol.react-results--main', '[data-testid="sidebar"]', 'main'];
    if (serpRootsContainMediaSiteLinks(ddgRoots)) return true;

    const resultsRoot = document.querySelector('[data-testid="web-vertical"]')
      || document.querySelector('section[data-testid="mainline"]')
      || document.querySelector('ol.react-results--main')
      || document.body;
    const knowledgePanelRe = /\bTV series\b|\bTV show\b|Run time|Running time|Where to watch|Original network|Film series|\bSeasons?\s*\d|Watch on\b|\bEpisodes?\b[^.\n]{0,80}\bSeason\b/i;
    if (knowledgePanelRe.test(resultsRoot.innerText)) return true;

    const organicStrictRe = /\bTV series\b|\bTV show\b|Running time|Where to watch|Film series|\bEpisodes?\b[^.\n]{0,120}\bSeason\b/i;
    return organicStrictRe.test(resultsRoot.innerText);
  }

  function serpLooksLikeMedia() {
    if (isGoogle && SETTINGS.enableOnGooglePage) return scanGoogleForMediaHints();
    if (isBing && SETTINGS.enableOnBingPage) return scanBingForMediaHints();
    if (isBrave && SETTINGS.enableOnBravePage) return scanBraveForMediaHints();
    if (isDuckDuckGo && SETTINGS.enableOnDuckDuckGoPage) return scanDuckDuckGoForMediaHints();
    return false;
  }

  function rewritePlayerLinkHref(href, tmdbID, s, e) {
    if (!href || href.includes('themoviedb.org')) return href;
    const id = String(tmdbID);
    let h = href.replace(/\?\?+/g, '?');
    let u;
    try { u = new URL(h); } catch { return href; }
    if (u.protocol === 'stremio:') return href;
    const qs = u.searchParams;
    const sxe = `s${String(s).padStart(2, '0')}e${String(e).padStart(2, '0')}`;

    // Torrent sites that support season/episode filters
    if (/^ext\.to$/i.test(u.hostname)) {
      if (qs.has('name_filter')) {
        const curRaw = qs.get('name_filter') || '';
        let cur;
        try { cur = decodeURIComponent(curRaw); } catch { cur = curRaw; }
        // If filter is only the token, just swap it; otherwise, only replace a trailing "... sXXeYY"
        if (/^s\d{1,3}e\d{1,3}$/i.test(cur)) {
          qs.set('name_filter', sxe);
          return u.toString();
        }
        const tailRe = new RegExp(String.raw`^(.*?)(?:\s+)(s\d{1,3}e\d{1,3})$`, 'i');
        const m = cur.match(tailRe);
        if (m) {
          const next = `${m[1]} ${sxe}`;
          qs.set('name_filter', next);
          return u.toString();
        }
      }
    }
    if (/^knaben\.org$/i.test(u.hostname)) {
      // /search/<query>/<category>/1/seeders — update only if the query already includes an SxxExx token
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'search' && parts[1]) {
        const decoded = decodeURIComponent(parts[1]);
        // Replace ONLY the trailing "... sXXeYY" token we append (avoid touching titles containing similar patterns)
        const tailRe = new RegExp(String.raw`^(.*?)(?:\s+)(s\d{1,3}e\d{1,3})$`, 'i');
        const m = decoded.match(tailRe);
        if (m) {
          const nextDecoded = `${m[1]} ${sxe}`;
          parts[1] = encodeURIComponent(nextDecoded);
          u.pathname = `/${parts.join('/')}`;
          return u.toString();
        }
      }
    }

    if (qs.has('s') && qs.has('e')) { qs.set('s', String(s)); qs.set('e', String(e)); return u.toString(); }
    const idEsc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pathRe = new RegExp(`(/${idEsc})/(\\d+)/(\\d+)(?=(?:/|$))`);
    if (pathRe.test(u.pathname)) { u.pathname = u.pathname.replace(pathRe, `$1/${s}/${e}`); return u.toString(); }
    const suffix = `/${id}`;
    if (u.pathname.endsWith(suffix)) { u.pathname = `${u.pathname}/${s}/${e}`; return u.toString(); }
    return h;
  }

  /* ----------------------------------------------------
   * UI: Info Box Renderer
   * Inline link colours now reference CSS custom properties via inline style.
   * -------------------------------------------------- */
  function slugifyForTraktPath(str) {
    const s = String(str || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[:''.,!?&()[\]{}]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return s || 'title';
  }

  function buildTraktAppUrls(vidType, title, date, seasonNumber, episodeNumber = null) {
    const base = slugifyForTraktPath(title);
    const yearMatch = String(date).match(/^(\d{4})/);
    const year = yearMatch ? yearMatch[1] : '';
    const searchQ = `https://app.trakt.tv/search?q=${encodeURIComponent(title.trim() + (year ? ` ${year}` : ''))}`;
    if (vidType === 'movie') {
      const slug = year ? `${base}-${year}` : base;
      return { direct: `https://app.trakt.tv/movies/${slug}?mode=media`, search: searchQ + `&m=movie` };
    }
    const snRaw = Number(seasonNumber);
    const sn = Number.isFinite(snRaw) && snRaw >= 0 ? snRaw : 1;
    const enRaw = episodeNumber != null && episodeNumber !== '' ? Number(episodeNumber) : NaN;
    const en = Number.isFinite(enRaw) && enRaw > 0 ? enRaw : null;
    const direct = en != null
      ? `https://app.trakt.tv/shows/${base}/seasons/${sn}/episodes/${en}`
      : `https://app.trakt.tv/shows/${base}?season=${sn}&mode=media`;
    return { direct, search: searchQ + `&m=show` };
  }

  /** Stremio detail URL: episode-aware for TV when season & episode are known. */
  function buildStremioDetailHref(vidType, imdb, seasonNum, episodeNum) {
    if (!imdb) return '';
    if (vidType === 'tv') {
      const s = seasonNum != null && seasonNum !== '' ? Number(seasonNum) : NaN;
      const e = episodeNum != null && episodeNum !== '' ? Number(episodeNum) : NaN;
      if (Number.isFinite(s) && Number.isFinite(e) && s >= 0 && e > 0) {
        return `stremio://detail/series/${encodeURIComponent(`imdb:${imdb}:${s}:${e}`)}`;
      }
    }
    return `stremio://detail/${vidType}/${imdb}`;
  }

  function escapeHtmlText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Inline accent colour helper — used for links inside the info card HTML string */
  function accentStyle() { return 'style="color:rgb(var(--tm-accent));font-weight:bold;text-decoration:none;"'; }
  function accentStyleMuted() { return 'style="color:rgb(var(--tm-accent));font-weight:600;opacity:.88;font-size:13px;margin-left:4px;"'; }
  function imdbYellowStyle() { return 'style="color:rgb(245 197 24);font-weight:bold;"'; }
  function imdbBgStyle() { return 'style="color:black;background-color:rgb(245 197 24);"'; }
  function traktStyle() { return 'style="color:rgb(237 95 36);font-weight:bold;"'; }

  function renderInfoBox(data, torrents = null, imdb = null, specifiedSeason = null, specifiedEpisode = null, ytsLanguage = null, episodeDisplayName = null) {
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
    let knabenCategory = '';
    let extCategory = '';
    const seasonParsed = specifiedSeason != null && specifiedSeason !== '' ? Number(specifiedSeason) : NaN;
    const episodeParsed = specifiedEpisode != null && specifiedEpisode !== '' ? Number(specifiedEpisode) : NaN;
    let season_number = Number.isFinite(seasonParsed) ? seasonParsed : 1;
    let episode_number = Number.isFinite(episodeParsed) ? episodeParsed : 1;
    let sxe = '';
    let torrentLinks = [];

    if (Type === 'movie') {
      vidType = 'movie';
      vidType1337 = 'Movies';
      knabenCategory = '3000000';
      extCategory = '1';
      if (SETTINGS.enableYtsTorrents && torrents) {
        torrentLinks = buildTorrentLinks(torrents, title);
        if (torrentLinks?.length) {
          html = `<div style="margin-top:6px;"><strong>Torrents:</strong><br/>`;
          torrentLinks.forEach(link => {
            html += `<a href="${link.magnet}" rel="noopener" ${accentStyle()}>${link.quality} (${link.size}) - ${link.type} ${link.video} (Audio Channel: ${link.audio})${ytsLanguage ? ` - Lang: [${ytsLanguage.toUpperCase()}]` : ""} - Seeders:${link.seeds} Peers:${link.peers}</a><br/>`;
          });
          html += `</div>`;
        }
      }
    } else if (Type === 'tv') {
      vidType = 'tv'; vidType1337 = 'TV'; ET_cat = '2';
      knabenCategory = '2000000';
      extCategory = '2';
      query = `/${season_number}/${episode_number}`;
      smashQuery = `?s=${season_number}&e=${episode_number}`;
      multiQuery = `&s=${season_number}&e=${episode_number}`;
      sxe = `s${String(season_number).padStart(2, '0')}e${String(episode_number).padStart(2, '0')}`;
      if (SETTINGS.enableTorrentSiteShortcuts && imdb) {
        eztv = `<a href="https://eztvx.to/search/${imdb}" ${linkTargetAttr()} ${accentStyle()}>EZTVx.to${linkExternalTabArrow()}</a> - <a href="https://eztv1.xyz/search/${imdb}" ${linkTargetAttr()} ${accentStyle()}>Mirror 1${linkExternalTabArrow()}</a> - <a href="https://eztv.yt/search/${imdb}" ${linkTargetAttr()} ${accentStyle()}>Mirror 2${linkExternalTabArrow()}</a><br/>`;
      }
    } else {
      showNotification('No Results found!'); hideButton(); return;
    }

    const traktUrls = buildTraktAppUrls(vidType, title, date, season_number, episode_number);
    const stremioHref = buildStremioDetailHref(vidType, imdb, season_number, episode_number);
    lastInfoCardRender = {
      data, torrents, imdb, season: season_number, episode: episode_number, ytsLanguage, episodeDisplayName,
    };

    const episodeSub =
      Type === 'tv' && episodeDisplayName
        ? `<div class="tmdb-episode-sub" style="opacity:0.92;font-size:15px;margin-top:4px;font-weight:600;">S${season_number}E${episode_number} · ${escapeHtmlText(episodeDisplayName)}</div>`
        : '';

    const container = document.createElement('div');
    container.className = 'tmdb-info-card';
    container.innerHTML = `
      <div class="tmdb-title">${title} (${date})</div>
      ${episodeSub}
      <div id="tmdb-details">
        <div>
          <strong>TMDb ID:</strong>
          <span style="color:#1bb8d9;background-color:rgb(3,37,65);" class="tmdb-copy" id="tmdb-id" title="Click to copy">${tmdbID}</span>
          <a href="https://themoviedb.org/${vidType}/${tmdbID}" ${linkTargetAttr()} style="color:#1bb8d9;font-weight:bold;">(TMDb${linkExternalTabArrow()})</a>
        </div>
        <div>
          <strong>IMDb ID:</strong>
          <span style="color:black;background-color:rgb(226,182,22);" class="tmdb-copy" id="imdb-id" title="Click to copy">${imdb || ''}</span>
          ${imdb ? `<a href="https://www.imdb.com/title/${imdb}" ${linkTargetAttr()} style="color:rgb(226,182,22);font-weight:bold;">(IMDb${linkExternalTabArrow()})</a>
                    <a href="https://www.imdb.com/title/${imdb}/parentalguide" ${linkTargetAttr()} style="color:rgb(226,182,22);font-weight:bold;">(Parental Guide${linkExternalTabArrow()})</a>` : ''}
                    ${SETTINGS.enableTraktLink ? `<span style="margin-left:6px;"><a href="${traktUrls.direct}" ${linkTargetAttr()} style="color:#ff6f00;font-weight:bold;">(Trakt${linkExternalTabArrow()})</a>` : ''}
                    ${SETTINGS.enableTraktSearchLink ? `<a href="${traktUrls.search}" ${linkTargetAttr()} style="color:#ff6f00;font-weight:600;opacity:.88;font-size:13px;margin-left:4px;">(Trakt search)</a></span>` : ''}
                    ${SETTINGS.enableSimklLink ? `<a href="https://simkl.com/search?q=https://themoviedb.org/${vidType}/${tmdbID}" ${linkTargetAttr()} style="color:#fff;background-color:#000;font-weight:600;opacity:.88;font-size:13px;margin-left:4px;">(Simkl${linkExternalTabArrow()})</a></span>` : ''}
        </div>
        ${SETTINGS.enableStremioLink && imdb ? `<div style="margin-top:6px;"><a href="${stremioHref}" ${accentStyle()}>Open in Stremio${linkExternalTabArrow()}</a></div>` : ''}

        ${SETTINGS.enableStreamingLinks ? `
        <div style="margin-top:6px;">
          <a href="https://player.videasy.net/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on VidEasy.net (recommended)${linkExternalTabArrow()}</a><br/>
          <a href="https://cinemaos.tech/player/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on CinemaOS.tech (fastest)${linkExternalTabArrow()}</a><br/>
          <a href="https://cinesrc.st/embed/${vidType}/${tmdbID}${smashQuery}" ${linkTargetAttr()} ${accentStyle()}>Watch on CineSrc.st${linkExternalTabArrow()}</a> (Supports
          <a href="https://cinesrc.st/download/${vidType}/${tmdbID}${smashQuery}" ${linkTargetAttr()} ${accentStyle()}>Direct Download</a>)<br/>
          <a href="https://www.vidking.net/embed/${vidType}/${tmdbID}${query}?color=e50914" ${linkTargetAttr()} ${accentStyle()}>Watch on VidKing.net${linkExternalTabArrow()}</a><br/>
          <a href="https://vsembed.ru/embed/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on VsEmbed.ru${linkExternalTabArrow()}</a><br/>
          <a href="https://multiembed.mov/?video_id=${tmdbID}&tmdb=1${multiQuery}" ${linkTargetAttr()} ${accentStyle()}>Watch on MultiEmbed.mov${linkExternalTabArrow()}</a><br/>
          <a href="https://111movies.net/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on 111Movies.net${linkExternalTabArrow()}</a><br/>
          <a href="https://vidfast.pro/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on VidFast.pro${linkExternalTabArrow()}</a><br/>
          <a href="https://vidrock.net/${vidType}/${tmdbID}/${query}?autoplay=true" ${linkTargetAttr()} ${accentStyle()}>Watch on VidRock.net${linkExternalTabArrow()}</a><br/>
          <a href="https://vidlink.pro/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on VidLink.pro${linkExternalTabArrow()}</a><br/>
        </div>` : ''}

        ${SETTINGS.disabledLinks ? `
        <div style="margin-top:6px;">
          <strong>Disabled Links:</strong><br/>
          <a href="https://vidsrc.to/embed/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on VidSrc.to${linkExternalTabArrow()}</a><br/>
        </div>` : ''}

        ${SETTINGS.enableFrontendLinks ? `
        <div style="margin-top:6px;">
          <strong>Watch on frontends:</strong><br/>
          <a href="https://www.cineby.sc/${vidType}/${tmdbID}${query}?play=true" ${linkTargetAttr()} ${accentStyle()}>Watch on Cineby${linkExternalTabArrow()}</a>
          <a href="https://www.cineby.sc/${vidType}/${tmdbID}" ${linkTargetAttr()} ${accentStyle()}>(More Info)</a><br/>
          <a href="https://cinemaos.live/${vidType}/watch/${tmdbID}${smashQuery}" ${linkTargetAttr()} ${accentStyle()}>Watch on CinemaOS${linkExternalTabArrow()}</a>
          <a href="https://cinemaos.live/${vidType}/${tmdbID}" ${linkTargetAttr()} ${accentStyle()}>(More Info)</a><br/>
          <a href="https://xprime.su/watch/${tmdbID}/${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on XPrime${linkExternalTabArrow()}</a> <small>(Might have 4K)</small><br/>
          <a href="https://shuttletv.su/watch/${tmdbID}${smashQuery}" ${linkTargetAttr()} ${accentStyle()}>Watch on ShuttleTV${linkExternalTabArrow()}</a><br/>
          <a href="https://www.rivestream.app/watch?type=${vidType}&id=${tmdbID}${multiQuery}" ${linkTargetAttr()} ${accentStyle()}>Watch on RiveStream${linkExternalTabArrow()}</a><br/>
          <a href="https://hexa.su/watch/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on Hexa${linkExternalTabArrow()}</a>
          <a href="https://hexa.su/details/${vidType}/${tmdbID}/" ${linkTargetAttr()} ${accentStyle()}>(More Info)</a><br/>
          <a href="https://67movies.net/watch/${vidType}/${tmdbID}${query}" ${linkTargetAttr()} ${accentStyle()}>Watch on 67Movies${linkExternalTabArrow()}</a><br/>
          <a href="https://pstream.net/media/tmdb-${vidType}-${tmdbID}" ${linkTargetAttr()} ${accentStyle()}>Watch on PStream${linkExternalTabArrow()}</a> ${vidType === "tv" ? "(Auto Episode Not Available, Playback will start from first episode)" : "(4K possible)"}<br/>
        </div>` : ''}

        ${html}

        ${SETTINGS.enableTorrentSiteShortcuts ? `
        <div style="margin-top:6px;">
          <strong>Search on Torrent Sites:</strong><br/>
          <a href="https://1337x.to/category-search/${title}/${vidType1337}/1/" ${linkTargetAttr()} ${accentStyle()}>1337x.to${linkExternalTabArrow()}</a> -
          <a href="https://1337x.st/category-search/${title}/${vidType1337}/1/" ${linkTargetAttr()} ${accentStyle()}>Mirror 1${linkExternalTabArrow()}</a> -
          <a href="https://x1337x.cc/category-search/${title}/${vidType1337}/1/" ${linkTargetAttr()} ${accentStyle()}>Mirror 2${linkExternalTabArrow()}</a><br/>
          ${eztv}
          <a href="https://www.limetorrents.fun/search/${vidType1337}/${title}" ${linkTargetAttr()} ${accentStyle()}>LimeTorrents.fun${linkExternalTabArrow()}</a><br/>
          <a href="https://knaben.org/search/${encodeURIComponent(title)}/${knabenCategory}/1/seeders" ${linkTargetAttr()} ${accentStyle()}>Knaben.org${linkExternalTabArrow()}</a>${Type === "tv" ? ` - <a data-tm-sxe-link="1" href="https://knaben.org/search/${encodeURIComponent(`${title} ${sxe}`)}/${knabenCategory}/1/seeders" ${linkTargetAttr()} ${accentStyle()}>${sxe.toUpperCase()}${linkExternalTabArrow()}</a>` : ''}<br/>
          <a href="https://ext.to/browse/?with_adult=1&cat=${extCategory}${imdb ? `&imdb_id=${imdb}` : `&name_filter=${encodeURIComponent(title)}`}" ${linkTargetAttr()} ${accentStyle()}>Ext.to${linkExternalTabArrow()}</a>${Type === "tv" ? ` - <a data-tm-sxe-link="1" href="https://ext.to/browse/?with_adult=1&cat=${extCategory}${imdb ? `&imdb_id=${imdb}&name_filter=${sxe}` : `&name_filter=${encodeURIComponent(`${title} ${sxe}`)}`}" ${linkTargetAttr()} ${accentStyle()}>${sxe.toUpperCase()}${linkExternalTabArrow()}</a>` : ''}<br/>
          <a href="https://thepiratebay.org/search.php?q=${title}&video=on&search=Pirate+Search&page=0" ${linkTargetAttr()} ${accentStyle()}>ThePirateBay.org${linkExternalTabArrow()}</a><br/>
          <a href="https://extratorrent.st/search/?new=1&search=${title}&s_cat=${ET_cat}" ${linkTargetAttr()} ${accentStyle()}>ExtraTorrent.st${linkExternalTabArrow()}</a><br/>
          <a href="https://rutor.is/search/${title}" ${linkTargetAttr()} ${accentStyle()}>Rutor.is${linkExternalTabArrow()}</a><br/>
        </div>` : ''}
        ${formatSpecialThanksHtml(false)}
      </div>`;

    getMountTarget().prepend(container);
    hideButton();

    const detailsDiv = container.querySelector('#tmdb-details');
    const tmdb_id = container.querySelector('#tmdb-id');
    const imdb_id = container.querySelector('#imdb-id');

    tmdb_id?.addEventListener('click', () => { GM_setClipboard(tmdbID, 'text'); showNotification('TMDB id copied to clipboard'); });
    imdb_id?.addEventListener('click', () => { if (imdb) { GM_setClipboard(imdb, 'text'); showNotification('IMDB id copied to clipboard'); } });

    /* Watch Trailer button */
    try {
      const tmdbLink = container.querySelector(`#tmdb-details a[href*="themoviedb.org/${vidType}/${tmdbID}"]`);
      if (tmdbLink && SETTINGS.enableTrailerButton) {
        const trailerBtn = document.createElement('button');
        trailerBtn.className = 'tmdb-btn ghost tmdb-trailer-btn';
        trailerBtn.textContent = 'Watch trailer';
        trailerBtn.type = 'button';
        tmdbLink.parentNode.insertBefore(trailerBtn, tmdbLink.nextSibling);

        trailerBtn.addEventListener('click', async () => {
          document.querySelector('.tmdb-overlay')?.remove();
          if (document.querySelector('.tmdb-trailer-modal')) return;
          trailerBtn.disabled = true; trailerBtn.textContent = 'Loading...';
          try {
            const kind = (Type === 'tv') ? 'tv' : 'movie';
            const cacheKey = `${kind}:${tmdbID}`;
            if (trailerCache.has(cacheKey)) {
              const cached = trailerCache.get(cacheKey);
              if (!cached) { showNotification('No trailer found'); trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer'; return; }
              showTrailerModal(cached.key);
              trailerBtn.disabled = false; trailerBtn.textContent = 'Watch trailer';
              return;
            }
            const apiKey = getNextApiKey();
            const vids = await tmdbApiGetJson(`https://api.themoviedb.org/3/${kind}/${tmdbID}/videos?api_key=${apiKey}`);
            const results = Array.isArray(vids.results) ? vids.results : [];
            let chosen = results.find(r => r.site === 'YouTube' && /trailer/i.test(r.type) && /official/i.test(r.name))
              || results.find(r => r.site === 'YouTube' && /trailer/i.test(r.type))
              || results.find(r => r.site === 'YouTube');
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
    } catch (e) { /* ignore */ }

    /* Play another episode (TV only) */
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
            if (controlsAreaEl) controlsAreaEl.style.display = controlsAreaEl.style.display === 'none' ? 'inline-block' : 'none';
            return;
          }
          playAnotherBtn.disabled = true; playAnotherBtn.textContent = 'Loading...';
          try {
            const apiKey = getNextApiKey();
            const tvJson = await tmdbApiGetJson(`https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${apiKey}`);
            const seasons = Array.isArray(tvJson.seasons)
              ? tvJson.seasons.filter(s =>
                typeof s.season_number === 'number'
                && s.season_number > 0
                && Number.isFinite(Number(s.episode_count))
                && Number(s.episode_count) > 0
              )
              : [];
            if (seasons.length === 0) { showNotification('No season data available'); playAnotherBtn.disabled = false; playAnotherBtn.textContent = 'Play another episode'; return; }

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
            if (!SETTINGS.enableEpisodeSelection) episodeSelect.style.display = 'none';

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
            fillEpisodeOptions(parseInt(seasonSelect.options[0].dataset.episodes) || 1);
            seasonSelect.addEventListener('change', () => { fillEpisodeOptions(parseInt(seasonSelect.selectedOptions[0].dataset.episodes) || 1); });

            updateLinksBtn.addEventListener('click', async () => {
              const seasonNum = parseInt(seasonSelect.value, 10);
              const epNum = SETTINGS.enableEpisodeSelection ? parseInt(episodeSelect.value, 10) : 1;
              updateLinksBtn.disabled = true; updateLinksBtn.textContent = 'Validating...';
              try {
                const apiKey2 = getNextApiKey();
                const sJson = await tmdbApiGetJson(`https://api.themoviedb.org/3/tv/${tmdbID}/season/${seasonNum}?api_key=${apiKey2}`);
                const episodes = Array.isArray(sJson.episodes) ? sJson.episodes.length : 0;
                const total = episodes || parseInt(seasonSelect.selectedOptions[0].dataset.episodes) || 0;
                if (total > 0 && (epNum < 1 || epNum > total)) { showNotification(`Selected episode out of range (1-${total})`); updateLinksBtn.disabled = false; updateLinksBtn.textContent = 'Update player links'; return; }
                const s = seasonNum, e = epNum;
                const anchors = Array.from(detailsDiv.querySelectorAll('a[href]'));
                anchors.forEach(a => {
                  try {
                    let orig = a.dataset.originalHref;
                    if (!orig) { orig = a.getAttribute('href') || ''; a.dataset.originalHref = orig; }
                    if (!orig) return;
                    a.setAttribute('href', rewritePlayerLinkHref(orig, tmdbID, s, e));
                  } catch (ex) { /* ignore */ }
                });
                // Update visible SxxExx labels that are rendered as link text (torrent shortcuts)
                const sxeUpper = `S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}`;
                detailsDiv.querySelectorAll('a[data-tm-sxe-link="1"]').forEach(a => {
                  try {
                    // Preserve the external-tab arrow if present in HTML
                    const hadArrow = /↗|&nbsp;|<svg|external/i.test(a.innerHTML);
                    a.textContent = sxeUpper;
                    if (hadArrow) a.insertAdjacentHTML('beforeend', linkExternalTabArrow());
                  } catch (ex) { /* ignore */ }
                });
                if (lastInfoCardRender) { lastInfoCardRender.season = s; lastInfoCardRender.episode = e; }
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
      } catch (e) { /* ignore */ }
    }

    /* Stremio deep-link fallback */
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

  const trailerCache = new Map();
  /** `${media_type}:${id}` → imdb id or null (avoids repeat external_ids calls). */
  const tmdbExternalIdsCache = new Map();
  /** `${type}:${id}` → certification string or '' */
  const tmdbCertificationCache = new Map();
  /** `imdb_id` → YTS list_movies JSON (or null if cached miss). */
  const ytsMovieListCache = new Map();

  function showTrailerModal(youtubeKey) {
    if (!youtubeKey) return;
    if (document.querySelector('.tmdb-trailer-modal')) return;
    const overlay = document.createElement('div');
    overlay.className = 'tmdb-trailer-modal';
    overlay.tabIndex = -1;
    const content = document.createElement('div');
    content.className = 'tmdb-trailer-content';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tmdb-trailer-close';
    closeBtn.innerText = '✕'; closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => { overlay.remove(); });
    const iframe = document.createElement('iframe');
    const autoplayParam = SETTINGS.enableTrailerAutoPlay ? '&autoplay=1&mute=0' : '';
    iframe.src = `https://www.youtube.com/embed/${youtubeKey}?rel=0${autoplayParam}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    content.appendChild(closeBtn);
    content.appendChild(iframe);
    overlay.appendChild(content);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  async function processSearchResult(result, specifiedSeason = null, specifiedEpisode = null, episodeDisplayName = null, seriesImdbForLinks = null) {
    const tmdbURL = `https://api.themoviedb.org/3/`;
    const ytsAPI = `https://yts.bz/api/v2/list_movies.json?query_term=`;
    const ytsAltAPI = `https://movies-api.accel.li/api/v2/list_movies.json?query_term=`;
    try {
      const existing = getMountTarget().querySelector('.tmdb-info-card');
      if (existing) existing.remove();

      const apiKey = getNextApiKey();
      let imdbIdFromPage = null;
      if (isImdb) { imdbIdFromPage = location.pathname.match(/title\/(tt\d+)/)?.[1]; }
      let imdb_id = null;
      const seriesImdbNorm = seriesImdbForLinks && String(seriesImdbForLinks).trim() ? String(seriesImdbForLinks).trim() : null;
      if (seriesImdbNorm) {
        imdb_id = seriesImdbNorm.startsWith('tt') ? seriesImdbNorm : `tt${seriesImdbNorm}`;
      } else if (imdbIdFromPage) {
        imdb_id = imdbIdFromPage;
      } else if (result.external_imdb) {
        imdb_id = result.external_imdb;
      } else {
        const extKey = `${result.media_type}:${result.id}`;
        if (tmdbExternalIdsCache.has(extKey)) {
          imdb_id = tmdbExternalIdsCache.get(extKey);
        } else {
          const extJson = await tmdbApiGetJson(`${tmdbURL}${result.media_type}/${result.id}/external_ids?api_key=${apiKey}`);
          imdb_id = extJson.imdb_id || null;
          tmdbExternalIdsCache.set(extKey, imdb_id);
        }
      }
      if (result.media_type === 'movie') {
        if (SETTINGS.enableYtsTorrents) {
          try {
            const ytsUrl = `${ytsAPI}${imdb_id}`;
            let magnetData = imdb_id ? ytsMovieListCache.get(imdb_id) : null;
            if (!magnetData) {
              const magnet = await fetch(ytsUrl);
              magnetData = await magnet.json();
              debugNetLog('fetch', ytsUrl, magnet.status, magnetData);
              if (imdb_id) ytsMovieListCache.set(imdb_id, magnetData);
            }
            if (magnetData.status === 'ok' && magnetData.data.movie_count > 0) {
              renderInfoBox(result, magnetData.data.movies[0].torrents, imdb_id, specifiedSeason, specifiedEpisode, magnetData.data.movies[0].language, episodeDisplayName);
            } else { renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null, episodeDisplayName); }
          } catch { renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null, episodeDisplayName); }
        } else { renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null, episodeDisplayName); }
      } else { renderInfoBox(result, null, imdb_id, specifiedSeason, specifiedEpisode, null, episodeDisplayName); }

      if (SETTINGS.showCertifications) addCertificationAsync(result.id, result.media_type);
    } catch (err) { showNotification('Failed to process selected result'); }
  }

  async function fetchWithFallback(title, maxRetries = apiKeys.length) {
    const tryRender = async (candidate) => {
      try { await processSearchResult(candidate); return !!getMountTarget().querySelector('.tmdb-info-card'); }
      catch { return false; }
    };

    let attempts = 0;
    while (attempts < maxRetries) {
      const apiKey = getNextApiKey();
      const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
      try {
        const data = await tmdbApiGetJson(url);
        if (data.results && data.results.length > 0) {
          const mediaResults = (data.results || []).filter(r => r && (r.media_type === 'movie' || r.media_type === 'tv'));
          let rendered = await tryRender(data.results[0]);
          if (!rendered && mediaResults.length > 0) rendered = await tryRender(mediaResults[0]);
          if (!rendered) { showNotification('No movie/TV card for this search.'); return false; }

          lastChangeResultCandidates = mediaResults.length > 1 ? mediaResults : null;
          ensureChangeResultButton();
          return true;
        }
        showNotification('No results found. Rotating API key...');
        attempts++;
      } catch (err) {
        showNotification(`Fetch error: ${err.message}`);
        attempts++;
      }
    }
    showNotification('TMDb API failed or no results. Try refining your search?');
    return false;
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
        torrentLinks.push({ quality: torrent.quality, type: torrent.type, size: torrent.size, video: torrent.video_codec, audio: torrent.audio_channels, seeds: torrent.seeds, peers: torrent.peers, magnet });
      });
    }
    return torrentLinks;
  }

  async function addCertificationAsync(id, type) {
    const certKey = `${type}:${id}`;
    if (tmdbCertificationCache.has(certKey)) {
      const cached = tmdbCertificationCache.get(certKey);
      if (cached) {
        const titleElem = document.querySelector('.tmdb-title');
        if (titleElem && !titleElem.dataset.tmCertApplied) {
          titleElem.dataset.tmCertApplied = '1';
          titleElem.innerHTML += ` <span style="color:gray;font-size:14px;">[${cached}]</span>`;
        }
      }
      return;
    }
    const apiKey = getNextApiKey();
    let cert = '';
    try {
      if (isImdb) {
        try {
          const certLink = document.querySelector('a[href*="/parentalguide"][href*="#certificates"]');
          if (certLink) {
            const certText = certLink.textContent.trim();
            if (certText && certText.length <= 8) cert = certText;
          } else {
            const alt = Array.from(document.querySelectorAll('li, div, span'))
              .find(el => /TV-|PG-|R\b|G\b|NC-17|Unrated/i.test(el.textContent));
            if (alt) { const match = alt.textContent.match(/TV-[A-Z0-9+-]+|PG-[0-9]+|R|G|NC-17|Unrated/i); if (match) cert = match[0]; }
          }
        } catch (err) { console.warn('Failed to extract IMDb certification', err); }
      } else if (type === 'movie' && cert === '') {
        const json = await tmdbApiGetJson(`https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${apiKey}`);
        const us = json.results?.find(r => r.iso_3166_1 === 'US');
        cert = us?.release_dates?.[0]?.certification || '';
        if (!cert) { const tr = json.results?.find(r => r.iso_3166_1 === 'TR'); cert = tr?.rating || ''; }
      } else if (type === 'tv' && cert === '') {
        const json = await tmdbApiGetJson(`https://api.themoviedb.org/3/tv/${id}/content_ratings?api_key=${apiKey}`);
        const us = json.results?.find(r => r.iso_3166_1 === 'US');
        cert = us?.rating || '';
        if (!cert) { const tr = json.results?.find(r => r.iso_3166_1 === 'TR'); cert = tr?.rating || ''; }
      }
      tmdbCertificationCache.set(certKey, cert || '');
      if (cert) {
        const titleElem = document.querySelector('.tmdb-title');
        if (titleElem && !titleElem.dataset.tmCertApplied) {
          titleElem.dataset.tmCertApplied = '1';
          titleElem.innerHTML += ` <span style="color:gray;font-size:14px;">[${cert}]</span>`;
        }
      }
    } catch (err) { showNotification('Failed to fetch certification'); tmdbCertificationCache.set(certKey, ''); }
  }

  function hideButton() {
    const btn = document.getElementById('tmdb-button');
    if (btn) btn.style.display = 'none';
  }

  function ensureSerpManualButton() {
    if (isSearch() && !currentSerpEngineEnabled()) return;
    const mount = getMountTarget();
    if (!mount?.isConnected) return;
    if (mount.querySelector('.tmdb-info-card')) return;
    const existing = document.getElementById('tmdb-button');
    if (existing) {
      if (!existing.isConnected || existing.parentElement !== mount) mount.prepend(existing);
      existing.disabled = false;
      existing.style.display = 'block';
      if (isBing) { existing.style.position = 'relative'; existing.style.zIndex = '2147483000'; existing.style.margin = '12px 0'; }
      else if (isDuckDuckGo) { existing.style.position = 'relative'; existing.style.zIndex = ''; existing.style.margin = '12px 0'; }
      return;
    }
    const btn = document.createElement('button');
    btn.textContent = 'Search Movie/TV Info';
    btn.id = 'tmdb-button';
    btn.style.display = 'block';
    if (isBing) { btn.style.position = 'relative'; btn.style.zIndex = '2147483000'; btn.style.margin = '12px 0'; }
    else if (isDuckDuckGo) { btn.style.position = 'relative'; btn.style.margin = '12px 0'; }
    btn.onclick = () => {
      void (async () => {
        const ok = await fetchWithFallback(cleanedQuery);
        if (!ok) ensureSerpManualButton();
      })();
    };
    mount.prepend(btn);
  }

  /* ----------------------------------------------------
  * IMDb Page Handler
  * -------------------------------------------------- */
  const imdbCache = new Map();

  async function imdbHandler() {
    const imdbId = location.pathname.match(/title\/(tt\d+)/)?.[1];
    if (!imdbId) return showNotification("Couldn't detect IMDb ID on this page.");

    function tryInsertButton(attempt = 0) {
      const target = document.querySelector('[data-testid="tm-box-wl-button"]')?.parentElement
        || document.querySelector('.ipc-btn__text')?.closest('.ipc-button')?.parentElement
        || document.querySelector('[data-testid="hero-title-block__buttons"]')
        || document.querySelector('header');

      if (!target && attempt < 15) { setTimeout(() => tryInsertButton(attempt + 1), 500); return; }
      if (!target) { showNotification('Failed to insert Play button on IMDb page. You can use Shift+P to trigger the overlay manually.', 8000); return; }
      if (document.getElementById('tmdb-bttn-overlay')) return;

      const bttn = document.createElement('button');
      bttn.id = 'tmdb-bttn-overlay';
      bttn.textContent = '▶ Watch Now 😉';
      bttn.style.cssText = `margin-top:10px;cursor:pointer;padding:8px 12px;background:#f5c518;color:#000;border:none;border-radius:24px;font-weight:bold;font-size:18px;transition:all 0.2s ease;width:100%;max-width:100%;height:3rem;text-align:left;`;
      bttn.onmouseenter = () => bttn.style.background = '#e2b616';
      bttn.onmouseleave = () => bttn.style.background = '#f5c518';

      try {
        const watchedBtn = (target.parentElement && target.parentElement.querySelector('button[data-testid^="watched-button"], button[aria-label*="watched"]'))
          || document.querySelector('button[data-testid^="watched-button"], button[aria-label*="watched"]');
        if (watchedBtn && watchedBtn.parentElement === target.parentElement) target.parentElement.insertBefore(bttn, watchedBtn);
        else if (target.nextSibling) target.parentElement.insertBefore(bttn, target.nextSibling);
        else target.parentElement.appendChild(bttn);
      } catch (insErr) { target.appendChild(bttn); }

      bttn.addEventListener('click', () => triggerOverlay(imdbId));
    }

    tryInsertButton();
    document.addEventListener('keydown', e => { if (e.shiftKey && e.key.toLowerCase() === 'p') triggerOverlay(imdbId); });
  }

  async function triggerOverlay(imdbId) {
    const bttn = document.getElementById('tmdb-bttn-overlay');
    if (bttn) { bttn.disabled = true; bttn.textContent = 'Loading...'; }
    try {
      if (imdbCache.has(imdbId)) return renderOverlayFromCache(imdbCache.get(imdbId));
      const apiKey = getNextApiKey();
      const json = await tmdbApiGetJson(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`);
      const movie = json.movie_results?.[0];
      const tv = json.tv_results?.[0];
      const tvep = json.tv_episode_results?.[0];
      let result = movie || tv;
      let season = null;
      let episode = null;
      let episodeTitle = null;
      let seriesImdbId = null;
      if (!result && tvep != null && tvep.show_id != null) {
        result = await tmdbApiGetJson(`https://api.themoviedb.org/3/tv/${tvep.show_id}?api_key=${apiKey}`);
        result.media_type = 'tv';
        if (tvep.season_number != null) season = tvep.season_number;
        if (tvep.episode_number != null) episode = tvep.episode_number;
        if (typeof tvep.name === 'string' && tvep.name.trim()) episodeTitle = tvep.name.trim();
        const extJson = await tmdbApiGetJson(`https://api.themoviedb.org/3/tv/${tvep.show_id}/external_ids?api_key=${apiKey}`);
        const rawShowImdb = extJson.imdb_id || null;
        if (rawShowImdb) {
          seriesImdbId = rawShowImdb.startsWith('tt') ? rawShowImdb : `tt${rawShowImdb}`;
          tmdbExternalIdsCache.set(`tv:${tvep.show_id}`, seriesImdbId);
        }
      }
      if (!result) { showNotification('TMDb match not found for this IMDb ID.'); if (bttn) { bttn.disabled = false; bttn.textContent = '▶ Watch Now 😉'; } return; }
      const cached = { result, season, episode, episodeTitle, seriesImdbId };
      imdbCache.set(imdbId, cached);
      renderOverlayFromCache(cached);
    } catch (err) {
      console.error('IMDb overlay error:', err);
      showNotification('Failed to fetch TMDb info.');
    } finally {
      if (bttn) { bttn.disabled = false; bttn.textContent = '▶ Watch Now 😉'; }
    }
  }

  async function renderOverlayFromCache(cached) {
    const result = cached && typeof cached === 'object' && 'result' in cached ? cached.result : cached;
    const season = cached && typeof cached === 'object' && 'season' in cached ? cached.season : null;
    const episode = cached && typeof cached === 'object' && 'episode' in cached ? cached.episode : null;
    const episodeTitle = cached && typeof cached === 'object' && cached.episodeTitle ? cached.episodeTitle : null;
    const seriesImdbId = cached && typeof cached === 'object' && cached.seriesImdbId ? cached.seriesImdbId : null;
    document.querySelector('.tmdb-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'tmdb-overlay';
    overlay.innerHTML = `<div class="tmdb-overlay-inner ${SETTINGS.enableTransparencyMode ? 'transparency' : 'no-transparency'}" id="tmdb-overlay-inner"></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    await processSearchResult(result, season, episode, episodeTitle, seriesImdbId);
    const infoCard = document.querySelector('.tmdb-info-card');
    if (infoCard) overlay.querySelector('#tmdb-overlay-inner').appendChild(infoCard);
    else overlay.remove();
  }

  GM_addStyle(`
    .tmdb-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.2);
      z-index: 9999999;
      display: flex; align-items: center; justify-content: center;
    }
    .tmdb-overlay-inner {
      border-radius: 12px; padding: 20px;
      width: min(90vw, 950px); max-height: 90vh; overflow-y: auto;
      box-shadow: 0 0 40px rgba(0,0,0,0.5);
    }
  `);

  /* ----------------------------------------------------
  * Trakt Page Handler
  * -------------------------------------------------- */
  const traktCache = new Map();
  /** Bound overlay payload for the current Trakt URL (SPA updates this on navigation). */
  let traktOverlayPayloadRef = null;
  /** pathname+search we last successfully bound; reset when Trakt SPA navigates. */
  let lastTraktBindKey = '';
  let traktSpaHooksInstalled = false;
  let traktGlobalKeydownInstalled = false;

  function traktBindKey() {
    return `${location.pathname}${location.search}`;
  }

  function removeTraktInjections() {
    document.getElementById('tmdb-trakt-summary-play')?.remove();
    document.getElementById('tmdb-trakt-play')?.remove();
    document.querySelector('.tmdb-overlay')?.remove();
  }

  function installTraktGlobalKeydownOnce() {
    if (traktGlobalKeydownInstalled) return;
    traktGlobalKeydownInstalled = true;
    document.addEventListener('keydown', (e) => {
      if (!e.shiftKey || e.key.toLowerCase() !== 'p') return;
      if (!isTrakt || !SETTINGS.enableOnTraktPage) return;
      const ov = document.querySelector('.tmdb-overlay');
      if (ov) {
        ov.remove();
        return;
      }
      const ids = traktOverlayPayloadRef || extractTraktPageIds();
      if (ids.imdb || (ids.tmdb && ids.type)) void triggerTraktOverlay(ids);
      else showNotification('No IMDb title link on this Trakt page yet — wait for the page to finish loading.');
    });
  }

  /** Re-run Trakt binding after app.trakt.tv client-side navigation (no full reload). */
  function installTraktSpaNavigationHooks(scheduleRebind) {
    if (traktSpaHooksInstalled) return;
    traktSpaHooksInstalled = true;
    let rebindT = 0;
    const onNav = () => {
      if (rebindT) clearTimeout(rebindT);
      rebindT = setTimeout(() => {
        rebindT = 0;
        lastTraktBindKey = '';
        traktOverlayPayloadRef = null;
        removeTraktInjections();
        scheduleRebind();
      }, 150);
    };
    window.addEventListener('popstate', onNav);
    const wrap = (fn) =>
      function () {
        const ret = fn.apply(this, arguments);
        onNav();
        return ret;
      };
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
  }

  function scrapeTraktNextDataTmdb() {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el?.textContent) return null;
    try {
      const data = JSON.parse(el.textContent);
      const bag = [];
      const walk = (node, depth) => {
        if (depth > 30 || node === null || typeof node !== 'object') return;
        const ids = node.ids;
        if (ids && typeof ids.tmdb === 'number') {
          let ty = null;
          if (node.type === 'movie' || node.object_type === 'movie') ty = 'movie';
          else if (node.type === 'show' || node.type === 'series' || node.object_type === 'show') ty = 'tv';
          bag.push({ tmdb: String(ids.tmdb), type: ty });
        }
        if (Array.isArray(node)) { node.forEach(x => walk(x, depth + 1)); return; }
        for (const k of Object.keys(node)) walk(node[k], depth + 1);
      };
      walk(data, 0);
      if (!bag.length) return null;
      const moviePath = /\/movies\//.test(location.pathname);
      const showPath = /\/shows\//.test(location.pathname);
      if (moviePath) { const m = bag.find(x => x.type === 'movie') || bag[0]; return { tmdb: m.tmdb, type: 'movie' }; }
      if (showPath) { const t = bag.find(x => x.type === 'tv') || bag[0]; return { tmdb: t.tmdb, type: 'tv' }; }
      const x = bag.find(b => b.type) || bag[0];
      return { tmdb: x.tmdb, type: x.type || 'movie' };
    } catch (e) { return null; }
  }

  function resolveTraktAnchorHref(a) {
    if (!a || a.tagName !== 'A') return '';
    try { const prop = a.href; if (prop && /imdb\.com\/title\/tt\d+/i.test(prop)) return prop; } catch (e) { /* ignore */ }
    const attr = (a.getAttribute('href') || '').trim();
    if (!attr) return '';
    try { return new URL(attr, location.href).href; } catch (e) { return ''; }
  }

  function extractImdbFromTraktPage() {
    const skipRx = /\/fullcredits|\/parentalguide|\/reviews\/?(\?|$)|\/news\/|\/soundtrack|\/technical|\/quotes|\/goofs|\/faq/i;
    const fromHref = (href) => {
      if (!href || skipRx.test(href)) return null;
      const m = href.match(/imdb\.com\/title\/(tt\d+)/i);
      return m ? m[1] : null;
    };
    const selectorGroups = ['a.trakt-link[href*="imdb.com"]', '.trakt-summary-ratings a[href*="imdb.com"]', 'rating a[href*="imdb.com"]', 'a[href*="imdb.com/title/"]', 'a[href*="/title/tt"]'];
    const seen = new Set();
    for (const sel of selectorGroups) {
      let nodes; try { nodes = document.querySelectorAll(sel); } catch (e) { continue; }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (seen.has(a)) continue; seen.add(a);
        const href = resolveTraktAnchorHref(a);
        const id = fromHref(href);
        if (id) return id;
      }
    }
    for (const a of document.querySelectorAll('a.trakt-link, a[class*="trakt-link"]')) {
      const href = resolveTraktAnchorHref(a);
      const id = fromHref(href);
      if (id) return id;
    }
    const htmlHay = document.documentElement?.innerHTML || '';
    const hm = htmlHay.match(/imdb\.com\/title\/(tt\d+)/i);
    if (hm && !skipRx.test(hm[0])) return hm[1];
    return null;
  }

  function extractTraktPageIds() {
    const imdb = extractImdbFromTraktPage();
    let tmdbHref = '';
    for (const a of document.querySelectorAll('a[href*="themoviedb.org"]')) {
      const abs = a.href || '';
      if (/\/movie\/\d+|\/tv\/\d+/i.test(abs)) { tmdbHref = abs; break; }
    }
    const tmdbMatch = tmdbHref.match(/\/(movie|tv)\/(\d+)(?:\/(?:(\d+)\/(\d+))|\/season\/(\d+)\/episode\/(\d+))?/);
    let type = tmdbMatch ? tmdbMatch[1] : null;
    let tmdb = tmdbMatch ? tmdbMatch[2] : null;
    let tmdbSeason = tmdbMatch ? (tmdbMatch[3] ? parseInt(tmdbMatch[3], 10) : (tmdbMatch[5] ? parseInt(tmdbMatch[5], 10) : null)) : null;
    let tmdbEpisode = tmdbMatch ? (tmdbMatch[4] ? parseInt(tmdbMatch[4], 10) : (tmdbMatch[6] ? parseInt(tmdbMatch[6], 10) : null)) : null;

    if (type === 'tv' || (!type && /\/shows\//.test(location.pathname))) {
      const pm = location.pathname.match(/\/shows\/[^/]+\/seasons\/(\d+)(?:\/episodes\/(\d+))?/);
      if (pm) { if (tmdbSeason == null) tmdbSeason = parseInt(pm[1], 10); if (tmdbEpisode == null && pm[2]) tmdbEpisode = parseInt(pm[2], 10); }
    }

    if (!tmdb || !type) { const scraped = scrapeTraktNextDataTmdb(); if (scraped) { tmdb = scraped.tmdb; type = scraped.type; } }
    if (tmdb && !type) type = /\/movies\//.test(location.pathname) ? 'movie' : 'tv';
    if (type && !tmdb) type = null;

    return { imdb, tmdb, type, season: tmdbSeason, episode: tmdbEpisode };
  }

  function findTraktWatchTrigger() {
    const legacy = document.querySelector('a.btn-watch-now');
    if (legacy) return legacy;
    for (const a of document.querySelectorAll('a[href*="/watch"], a[href*="watchnow"], a[href*="watch-now"]')) {
      if (a.offsetParent !== null || a.getClientRects().length) return a;
    }
    for (const btn of document.querySelectorAll('button, [role="button"], a[class*="button"], a.Button')) {
      if (btn.id === 'tmdb-trakt-summary-play' || btn.id === 'tmdb-trakt-play') continue;
      const t = (btn.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (t === 'watch' || t === 'watch now' || t.startsWith('watch on')) return btn;
    }
    return null;
  }

  function traktStylePlaySvgHtml() {
    const trailer = document.querySelector('.trakt-summary-actions-bar a[aria-label="Trailer"]');
    const paths = trailer?.querySelectorAll('svg path');
    const playPath = paths?.length ? paths[paths.length - 1] : null;
    const d = playPath?.getAttribute('d');
    const inner = d && d.includes('17.5012') && d.includes('14.375') ? playPath.outerHTML : '<path d="M10.0013 14.375V5.625L17.5012 10L10.0013 14.375Z" fill="currentColor"></path>';
    return `<svg width="16" height="16" viewBox="10.0013 5.625 7.4999 8.75" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  }

  function traktSummaryActionReferenceButton(bar) {
    if (!bar) return null;
    return (
      bar.querySelector('.trakt-media-actions-popup-button button.trakt-action-button') ||
      bar.querySelector('button.trakt-action-button[data-style="ghost"]') ||
      bar.querySelector('trakt-track-action button.trakt-action-button')
    );
  }

  function mirrorTraktActionButtonEl(btn, refBtn) {
    const DATA_ATTRS = ['data-color', 'data-variant', 'data-size', 'data-style'];
    if (refBtn) {
      btn.className = `${refBtn.className} tmdb-trakt-summary-play`.trim();
      DATA_ATTRS.forEach((attr) => {
        if (refBtn.hasAttribute(attr)) btn.setAttribute(attr, refBtn.getAttribute(attr));
        else btn.removeAttribute(attr);
      });
      return;
    }
    btn.className = 'trakt-action-button trakt-button-link tmdb-trakt-summary-play';
    btn.setAttribute('data-color', 'default');
    btn.setAttribute('data-variant', 'primary');
    btn.setAttribute('data-size', 'normal');
    btn.setAttribute('data-style', 'ghost');
  }

  function syncTraktSummaryPlayButtonFromNative() {
    const btn = document.getElementById('tmdb-trakt-summary-play');
    const bar = document.querySelector('.trakt-summary-actions-bar');
    if (!btn || !bar) return;
    mirrorTraktActionButtonEl(btn, traktSummaryActionReferenceButton(bar));
  }

  function injectTraktSummaryPlayButton(onToggle) {
    const existing = document.getElementById('tmdb-trakt-summary-play');
    const bar = document.querySelector('.trakt-summary-actions-bar');
    const track = bar?.querySelector('trakt-track-action');
    if (existing) {
      if (bar && track) syncTraktSummaryPlayButtonFromNative();
      return true;
    }
    if (!bar || !track) return false;
    const refBtn = traktSummaryActionReferenceButton(bar);
    const btn = document.createElement('button');
    btn.id = 'tmdb-trakt-summary-play';
    btn.type = 'button';
    mirrorTraktActionButtonEl(btn, refBtn);
    btn.setAttribute('aria-label', 'TMDb streaming links (toggle)');
    btn.innerHTML = traktStylePlaySvgHtml();
    track.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }, true);
    return true;
  }

  /**
   * @param {(usedFallback: boolean) => void} [onInjectOutcome] — called once: `false` if `#tmdb-trakt-summary-play`
   *   was placed in the action bar, `true` if the header fallback `#tmdb-trakt-play` was used instead.
   */
  function scheduleTraktSummaryPlayButton(onToggle, onInjectOutcome) {
    let n = 0; const max = 80;
    let outcomeReported = false;
    const report = (usedFallback) => {
      if (outcomeReported) return;
      outcomeReported = true;
      if (typeof onInjectOutcome === 'function') onInjectOutcome(usedFallback);
    };
    const resyncPlayBtnTraktClasses = () => {
      syncTraktSummaryPlayButtonFromNative();
      setTimeout(syncTraktSummaryPlayButtonFromNative, 450);
      setTimeout(syncTraktSummaryPlayButtonFromNative, 1800);
    };
    const tick = () => {
      if (document.getElementById('tmdb-trakt-summary-play')) {
        resyncPlayBtnTraktClasses();
        report(false);
        return;
      }
      if (injectTraktSummaryPlayButton(onToggle)) {
        resyncPlayBtnTraktClasses();
        report(false);
        return;
      }
      if (++n >= max) {
        injectTraktFallbackPlayButton(onToggle);
        report(true);
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  }

  function injectTraktFallbackPlayButton(onToggle) {
    if (document.getElementById('tmdb-trakt-play')) return;
    const hdr = document.querySelector('header') || document.querySelector('main') || document.body;
    const b = document.createElement('button');
    b.id = 'tmdb-trakt-play'; b.type = 'button';
    b.textContent = '▶ Watch Now 😉'; b.className = 'tmdb-btn primary';
    b.style.cssText = 'margin:8px 12px;z-index:2147483000;position:relative;';
    hdr.insertAdjacentElement('afterbegin', b);
    b.addEventListener('click', (e) => { e.preventDefault(); onToggle(); });
  }

  function bindTraktOverlayToPage(ids) {
    const payload = { imdb: ids.imdb, tmdb: ids.tmdb, type: ids.type, season: ids.season, episode: ids.episode };
    traktOverlayPayloadRef = payload;
    installTraktGlobalKeydownOnce();

    const toggleOverlay = () => {
      const ov = document.querySelector('.tmdb-overlay');
      if (ov) { ov.remove(); return; }
      void triggerTraktOverlay(traktOverlayPayloadRef || payload);
    };

    const isAppTrakt = location.hostname.startsWith('app.');
    const watchBtnAtBind = findTraktWatchTrigger();

    scheduleTraktSummaryPlayButton(toggleOverlay, (usedFallback) => {
      if (!usedFallback) return;
      if (isAppTrakt) {
        showNotification('Action bar did not load in time — use the top "▶ Watch Now" button or Shift+P for TMDb streaming links.', 4500);
      } else if (findTraktWatchTrigger()) {
        showNotification('Streaming toggle is in the header — Trakt "Watch" also opens this overlay; Shift+P toggles it.', 4000);
      } else {
        showNotification('Use the top "Streaming links" button or Shift+P — the summary action bar did not load in time.', 4500);
      }
    });

    if (!isAppTrakt && watchBtnAtBind) {
      watchBtnAtBind.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); void triggerTraktOverlay(traktOverlayPayloadRef || payload); }, true);
    }
  }

  function traktPageHandler() {
    let traktMo = null;
    let moStopTimer = 0;
    let traktRebindGen = 0;
    const stopMo = () => {
      try { traktMo?.disconnect(); } catch (e) { /* ignore */ }
      traktMo = null;
      if (moStopTimer) { clearTimeout(moStopTimer); moStopTimer = 0; }
    };

    const armMutationObserver = (durationMs) => {
      stopMo();
      let traktMoRaf = 0;
      traktMo = new MutationObserver(() => {
        if (traktMoRaf) return;
        traktMoRaf = requestAnimationFrame(() => { traktMoRaf = 0; tryBind(); });
      });
      traktMo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
      moStopTimer = setTimeout(stopMo, durationMs);
    };

    const tryBind = () => {
      const key = traktBindKey();
      if (lastTraktBindKey === key) return true;
      const ids = extractTraktPageIds();
      if (!ids.imdb && (!ids.tmdb || !ids.type)) return false;
      if (lastTraktBindKey) removeTraktInjections();
      lastTraktBindKey = key;
      stopMo();
      bindTraktOverlayToPage(ids);
      return true;
    };

    const scheduleRebind = () => {
      const gen = ++traktRebindGen;
      lastTraktBindKey = '';
      traktOverlayPayloadRef = null;
      armMutationObserver(35000);
      let tries = 0;
      const maxTries = 45;
      const tick = () => {
        if (gen !== traktRebindGen) return;
        if (tryBind()) return;
        if (++tries >= maxTries) {
          if (gen !== traktRebindGen) return;
          stopMo();
          installTraktGlobalKeydownOnce();
          showNotification('TMDb Enhancer: Waiting for Trakt\'s IMDb link — try Shift+P shortly.', 5500);
          return;
        }
        setTimeout(tick, 400);
      };
      tick();
    };

    installTraktSpaNavigationHooks(scheduleRebind);
    scheduleRebind();
  }

  async function triggerTraktOverlay({ imdb, tmdb, type, season = null, episode = null, mal = null }) {
    if (document.querySelector('.tmdb-overlay')) return;
    const apiKey = getNextApiKey();
    const tmdbBase = 'https://api.themoviedb.org/3';
    let resolvedTmdb = tmdb, resolvedType = type, seasonUse = season, episodeUse = episode;

    if ((!resolvedTmdb || !resolvedType) && imdb) {
      try {
        const findJson = await tmdbApiGetJson(`${tmdbBase}/find/${encodeURIComponent(imdb)}?api_key=${apiKey}&external_source=imdb_id`);
        const movie = findJson.movie_results?.[0];
        const tv = findJson.tv_results?.[0];
        const tvep = findJson.tv_episode_results?.[0];
        if (movie) { resolvedType = 'movie'; resolvedTmdb = String(movie.id); }
        else if (tv) { resolvedType = 'tv'; resolvedTmdb = String(tv.id); }
        else if (tvep != null && tvep.show_id != null) {
          resolvedType = 'tv'; resolvedTmdb = String(tvep.show_id);
          if (seasonUse == null && tvep.season_number != null) seasonUse = tvep.season_number;
          if (episodeUse == null && tvep.episode_number != null) episodeUse = tvep.episode_number;
        } else { showNotification('TMDb find: no movie/show match for this IMDb id.'); return; }
      } catch (e) { console.error('Trakt IMDb→TMDb find failed:', e); showNotification('Failed to look up title on TMDb from IMDb.'); return; }
    }

    if ((!resolvedTmdb || !resolvedType) && mal) {
      const fromMal = await resolveMalIdToTmdb(mal);
      if (fromMal) { resolvedTmdb = fromMal.tmdb; resolvedType = fromMal.type; }
    }

    if (!resolvedTmdb || !resolvedType) {
      if (mal && !imdb) showNotification('Could not match this MyAnimeList entry on TMDb. Try again or use a page with IMDb/TMDb links.');
      else showNotification('Need an IMDb or TMDb id on the page, or a MyAnimeList anime link, to load data.');
      return;
    }

    const cacheKey = `${resolvedType}:${resolvedTmdb}${seasonUse != null ? `:s${seasonUse}` : ''}${episodeUse != null ? `:e${episodeUse}` : ''}`;
    if (traktCache.has(cacheKey)) return renderTraktOverlay(traktCache.get(cacheKey), seasonUse, episodeUse);

    try {
      const data = await tmdbApiGetJson(`${tmdbBase}/${resolvedType}/${resolvedTmdb}?api_key=${apiKey}`);
      let imdb_id = imdb;
      const extCacheKey = `${resolvedType}:${resolvedTmdb}`;
      if (!imdb_id) {
        if (tmdbExternalIdsCache.has(extCacheKey)) {
          imdb_id = tmdbExternalIdsCache.get(extCacheKey);
        } else {
          const extJson = await tmdbApiGetJson(`${tmdbBase}/${resolvedType}/${resolvedTmdb}/external_ids?api_key=${apiKey}`);
          imdb_id = extJson.imdb_id || null;
          tmdbExternalIdsCache.set(extCacheKey, imdb_id);
        }
      } else {
        tmdbExternalIdsCache.set(extCacheKey, imdb_id);
      }
      data.media_type = resolvedType; data.external_imdb = imdb_id;
      traktCache.set(cacheKey, data);
      renderTraktOverlay(data, seasonUse, episodeUse);
    } catch (err) { console.error('Trakt overlay error:', err); showNotification('Failed to fetch TMDb info.'); }
  }

  async function renderTraktOverlay(data, season = null, episode = null) {
    document.querySelector('.tmdb-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'tmdb-overlay';
    overlay.innerHTML = `<div class="tmdb-overlay-inner ${SETTINGS.enableTransparencyMode ? 'transparency' : 'no-transparency'}" id="tmdb-overlay-inner"></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    const fakeResult = {
      id: data.id,
      media_type: data.media_type,
      title: data.title || data.name,
      release_date: data.release_date,
      first_air_date: data.first_air_date,
      external_imdb: data.external_imdb || null,
    };
    await processSearchResult(fakeResult, season, episode);
    const card = document.querySelector('.tmdb-info-card');
    if (card) overlay.querySelector('#tmdb-overlay-inner').appendChild(card);
    else overlay.remove();
  }

  /* ----------------------------------------------------
  * Simkl Page Handler
  * -------------------------------------------------- */
  let simklOverlayPayloadRef = null;
  let lastSimklBindKey = '';
  let simklGlobalKeydownInstalled = false;
  let simklSpaHooksInstalled = false;
  let simklLastFallbackHintKey = '';
  let simklMo = null;
  let simklRebindGen = 0;

  /** Only movie / TV / anime **title** pages (`/movies/123/…`, `/tv/123/…`, `/anime/123/…`). */
  function isSimklTitleDetailPage() {
    return /^\/(anime|tv|movies)\/\d+/i.test(location.pathname);
  }

  function removeSimklInjections() {
    document.getElementById('tmdb-simkl-play')?.remove();
    document.querySelector('.tmdb-overlay')?.remove();
  }

  function parseSimklPathKind() {
    const m = location.pathname.match(/^\/(anime|tv|movies)\/(\d+)/);
    if (!m) return null;
    return { segment: m[1], simklId: m[2], mediaType: m[1] === 'movies' ? 'movie' : 'tv' };
  }

  /** Simkl shows JOIN SIMKL / `.openReg` in the header when the session is not logged in. */
  function isSimklGuestJoinCtaVisible() {
    const el = document.querySelector('.SimklHeaderMenuJoinButton.openReg');
    return !!(el && el.isConnected);
  }

  /**
   * Only the logged-in "Your next episode to watch" block (table.next-episode-to-watch + heading).
   * Logged-out pages show "Previously Aired Episode" with the same link shape — ignore that.
   */
  function extractSimklNextEpisodeToWatch() {
    if (isSimklGuestJoinCtaVisible()) return null;
    for (const table of document.querySelectorAll('table.next-episode-to-watch')) {
      const which = table.querySelector('td.SimklTVAboutBlockEpisodeWhich');
      const label = (which?.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/your\s+next\s+episode\s+to\s+watch/i.test(label)) continue;
      if (/previously\s+aired/i.test(label)) continue;
      for (const a of table.querySelectorAll('a[href]')) {
        const href = (a.getAttribute('href') || a.href || '').trim();
        const m = href.match(/\/season-(\d+)\/episode-(\d+)(?:\/|[?#]|$)/i);
        if (m) {
          const season = parseInt(m[1], 10);
          const episode = parseInt(m[2], 10);
          if (season > 0 && episode > 0) return { season, episode };
        }
      }
      const epSpan = table.querySelector('span.episode');
      if (epSpan) {
        const t = (epSpan.textContent || '').replace(/\s+/g, ' ').trim();
        const m = t.match(/season\s*(\d+)\s*:\s*episode\s*(\d+)/i) || t.match(/\bs\s*(\d+)\s*e\s*(\d+)\b/i);
        if (m) {
          const season = parseInt(m[1], 10);
          const episode = parseInt(m[2], 10);
          if (season > 0 && episode > 0) return { season, episode };
        }
      }
    }
    return null;
  }

  /** SPA / quick-switch: URL can lag behind DOM — bind identity includes visible title + external ids. */
  function simklContentFingerprint() {
    const path = parseSimklPathKind();
    const slugId = path?.simklId || '';
    const h1 = document.querySelector('#bigtext-id0 h1[itemprop="name"]')?.textContent?.trim()?.slice(0, 120) || '';
    let imdb = '';
    const ia = document.querySelector(
      'table.SimklTVAboutRatingsBlockTable td.imdb-rating a[href*="imdb.com"], td.imdb-rating a[href*="imdb.com"], .imdb-rating a[href*="imdb.com"]'
    );
    if (ia) {
      const h = (ia.getAttribute('href') || ia.href || '').trim();
      const m = h.match(/(tt\d+)/i);
      if (m) imdb = m[1];
    }
    let mal = '';
    const ma = document.querySelector(
      'table.SimklTVAboutRatingsBlockTable td.mal-rating a[href*="myanimelist"], td.mal-rating a[href*="myanimelist"], .mal-rating a[href*="myanimelist"]'
    );
    if (ma) {
      const h = (ma.getAttribute('href') || ma.href || '').trim();
      const mm = h.match(/myanimelist\.net\/anime\/(\d+)/i);
      if (mm) mal = mm[1];
    }
    const nextEp = extractSimklNextEpisodeToWatch();
    const nextKey = nextEp ? `s${nextEp.season}e${nextEp.episode}` : '';
    return `${slugId}|${h1}|${imdb}|${mal}|${nextKey}`;
  }

  function simklBindKey() {
    return `${location.pathname}${location.search}\u001e${simklContentFingerprint()}`;
  }

  function extractSimklPageIds() {
    const path = parseSimklPathKind();
    if (!path) return { imdb: null, tmdb: null, type: null, season: null, episode: null, mal: null };

    let imdb = null;
    const imdbA = document.querySelector(
      'table.SimklTVAboutRatingsBlockTable td.imdb-rating a[href*="imdb.com/title/"], td.imdb-rating a[href*="imdb.com/title/"], .imdb-rating a[href*="imdb.com/title/"]'
    );
    if (imdbA) {
      const href = (imdbA.getAttribute('href') || imdbA.href || '').trim();
      const hm = href.match(/\/title\/(tt\d+)/i);
      if (hm) imdb = hm[1];
    }
    if (!imdb) {
      const hay = document.documentElement?.innerHTML || '';
      const hm = hay.match(/imdb\.com\/title\/(tt\d+)/i);
      if (hm) imdb = hm[1];
    }

    let tmdb = null;
    let scrapedType = null;
    for (const a of document.querySelectorAll('a[href*="themoviedb.org"]')) {
      const abs = a.href || '';
      const tm = abs.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
      if (tm) {
        scrapedType = tm[1].toLowerCase();
        tmdb = tm[2];
        break;
      }
    }
    if (tmdb && scrapedType) {
      if (path.mediaType === 'movie' && scrapedType !== 'movie') { tmdb = null; scrapedType = null; }
      else if (path.mediaType === 'tv' && scrapedType === 'movie') { tmdb = null; scrapedType = null; }
    }
    if (!tmdb) {
      const hay = document.documentElement?.innerHTML || '';
      const mm = hay.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
      if (mm) {
        const ty = mm[1].toLowerCase();
        const id = mm[2];
        if (!(path.mediaType === 'movie' && ty !== 'movie') && !(path.mediaType === 'tv' && ty === 'movie')) {
          scrapedType = ty;
          tmdb = id;
        }
      }
    }

    let mal = null;
    const malA = document.querySelector(
      'table.SimklTVAboutRatingsBlockTable td.mal-rating a[href*="myanimelist.net/anime/"], td.mal-rating a[href*="myanimelist.net/anime/"], .mal-rating a[href*="myanimelist.net/anime/"]'
    );
    if (malA) {
      const href = (malA.getAttribute('href') || malA.href || '').trim();
      const mmal = href.match(/myanimelist\.net\/anime\/(\d+)/i);
      if (mmal) mal = mmal[1];
    }
    if (!mal) {
      const hayMal = document.documentElement?.innerHTML || '';
      const mmal = hayMal.match(/myanimelist\.net\/anime\/(\d+)/i);
      if (mmal) mal = mmal[1];
    }

    const resolvedType = tmdb && scrapedType ? scrapedType : path.mediaType;
    let season = null;
    let episode = null;
    if (resolvedType === 'tv' && path.mediaType === 'tv') {
      const next = extractSimklNextEpisodeToWatch();
      if (next) { season = next.season; episode = next.episode; }
    }
    return { imdb, tmdb, type: resolvedType, season, episode, mal };
  }

  function installSimklGlobalKeydownOnce() {
    if (simklGlobalKeydownInstalled) return;
    simklGlobalKeydownInstalled = true;
    document.addEventListener('keydown', (e) => {
      if (!e.shiftKey || e.key.toLowerCase() !== 'p') return;
      if (!isSimkl || !SETTINGS.enableOnSimklPage || !isSimklTitleDetailPage()) return;
      const ov = document.querySelector('.tmdb-overlay');
      if (ov) {
        ov.remove();
        return;
      }
      const ids = simklOverlayPayloadRef || extractSimklPageIds();
      if (ids.imdb || (ids.tmdb && ids.type) || ids.mal) void triggerTraktOverlay(ids);
      else showNotification('No IMDb / TMDb / MAL links in Simkl ratings yet — wait for the page to finish loading.');
    });
  }

  function injectSimklStreamingButton(onToggle) {
    if (document.getElementById('tmdb-simkl-play')) return true;
    const addUrl = document.querySelector('watch-now-button.settings.madripple')
      || document.querySelector('watch-now-button.settings')
      || Array.from(document.querySelectorAll('watch-now-button')).find(w => /add\s*url/i.test((w.textContent || '').replace(/\s+/g, ' ')))
      || document.querySelector('watch-now-button');

    const finish = (btn) => {
      btn.id = 'tmdb-simkl-play';
      btn.setAttribute('title', 'Watch now — TMDb links (toggle); Shift+P');
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }, true);
      if (addUrl?.parentElement) addUrl.insertAdjacentElement('afterend', btn);
      else (document.querySelector('.SimklMyTVShowAboutDiv') || document.body).appendChild(btn);
      return true;
    };

    const el = document.createElement('watch-now-button');
    el.className = 'settings madripple';
    el.innerHTML = `
      <watch-now-1-1>
        <watch-now-1-1-1></watch-now-1-1-1>
        <watch-now-1-1-2>Watch now 😉</watch-now-1-1-2>
        <watch-now-1-1-3></watch-now-1-1-3>
      </watch-now-1-1>`;
    return finish(el);
  }

  function scheduleSimklStreamingButton(onToggle, onSettled) {
    let n = 0;
    const max = 80;
    const settled = (usedFallbackBar) => {
      if (typeof onSettled === 'function') onSettled(!!usedFallbackBar);
    };
    const tick = () => {
      if (document.getElementById('tmdb-simkl-play')) {
        settled(n >= max);
        return;
      }
      if (injectSimklStreamingButton(onToggle)) {
        settled(false);
        return;
      }
      if (++n >= max) {
        if (!document.getElementById('tmdb-simkl-play')) {
          const b = document.createElement('button');
          b.id = 'tmdb-simkl-play';
          b.type = 'button';
          b.className = 'tmdb-btn primary';
          b.style.cssText = 'margin:8px 12px;z-index:2147483000;position:relative;display:inline-flex;align-items:center;gap:8px;';
          b.title = 'Watch now — Shift+P toggles overlay';
          b.innerHTML = `${traktStylePlaySvgHtml()} <span>Watch now 😉</span>`;
          b.addEventListener('click', (e) => { e.preventDefault(); onToggle(); });
          document.body.insertAdjacentElement('afterbegin', b);
        }
        settled(true);
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  }

  function bindSimklOverlayToPage(ids) {
    const payload = { imdb: ids.imdb, tmdb: ids.tmdb, type: ids.type, season: ids.season, episode: ids.episode, mal: ids.mal };
    simklOverlayPayloadRef = payload;
    installSimklGlobalKeydownOnce();

    const toggleOverlay = () => {
      const ov = document.querySelector('.tmdb-overlay');
      if (ov) {
        ov.remove();
        return;
      }
      void triggerTraktOverlay(simklOverlayPayloadRef || payload);
    };

    scheduleSimklStreamingButton(toggleOverlay, (usedFallbackBar) => {
      if (!usedFallbackBar || !SETTINGS.enableNotifications) return;
      const hintKey = simklBindKey();
      if (simklLastFallbackHintKey === hintKey) return;
      simklLastFallbackHintKey = hintKey;
      showNotification('Couldn’t attach Watch next to Add URL — use the control at the top of the page or press Shift+P.', 5200);
    });
  }

  function simklStopMutationObserver() {
    try { simklMo?.disconnect(); } catch (e) { /* ignore */ }
    simklMo = null;
  }

  function installSimklSpaHooksOnce() {
    if (simklSpaHooksInstalled) return;
    simklSpaHooksInstalled = true;
    let rebindT = 0;
    const onNav = () => {
      if (rebindT) clearTimeout(rebindT);
      rebindT = setTimeout(() => {
        rebindT = 0;
        lastSimklBindKey = '';
        simklOverlayPayloadRef = null;
        removeSimklInjections();
        if (isSimklTitleDetailPage()) simklScheduleTitleRebind();
        else simklStopMutationObserver();
      }, 150);
    };
    window.addEventListener('popstate', onNav);
    window.addEventListener('hashchange', onNav);
    const wrap = (fn) =>
      function () {
        const ret = fn.apply(this, arguments);
        onNav();
        return ret;
      };
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
  }

  function simklScheduleTitleRebind() {
    if (!isSimklTitleDetailPage() || !SETTINGS.enableOnSimklPage) {
      simklStopMutationObserver();
      return;
    }
    simklStopMutationObserver();
    const gen = ++simklRebindGen;
    lastSimklBindKey = '';
    simklOverlayPayloadRef = null;

    const simklTryBindTitle = () => {
      if (!isSimklTitleDetailPage()) return false;
      if (!parseSimklPathKind()) return false;
      const key = simklBindKey();
      if (lastSimklBindKey === key) return true;
      const ids = extractSimklPageIds();
      if (!ids.imdb && !ids.tmdb && !ids.mal) return false;
      if (lastSimklBindKey) removeSimklInjections();
      lastSimklBindKey = key;
      bindSimklOverlayToPage(ids);
      return true;
    };

    let simklMoRaf = 0;
    let lastMoFire = 0;
    const MO_DEBOUNCE_MS = 200;
    simklMo = new MutationObserver(() => {
      const t = Date.now();
      if (t - lastMoFire < MO_DEBOUNCE_MS) return;
      lastMoFire = t;
      if (simklMoRaf) return;
      simklMoRaf = requestAnimationFrame(() => {
        simklMoRaf = 0;
        if (!isSimklTitleDetailPage()) return;
        simklTryBindTitle();
      });
    });
    simklMo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'class', 'data-title', 'data-href'],
    });

    let tries = 0;
    const maxTries = 60;
    const tick = () => {
      if (gen !== simklRebindGen) return;
      if (!isSimklTitleDetailPage()) {
        simklStopMutationObserver();
        return;
      }
      if (simklTryBindTitle()) return;
      if (++tries >= maxTries) {
        if (gen !== simklRebindGen) return;
        if (!isSimklTitleDetailPage()) return;
        installSimklGlobalKeydownOnce();
        showNotification('TMDb Enhancer: Waiting for Simkl ratings (IMDb / TMDb / MAL) — try Shift+P shortly.', 5500);
        return;
      }
      setTimeout(tick, 400);
    };
    tick();
  }

  function simklPageHandler() {
    installSimklSpaHooksOnce();
    if (!isSimklTitleDetailPage()) return;
    simklScheduleTitleRebind();
  }

  /* ----------------------------------------------------
  * YTS Handler
  * -------------------------------------------------- */
  async function ytsHandler() {
    const imdbAnchor = document.querySelector('a[href*="imdb.com/title/tt"]');
    if (!imdbAnchor) return console.warn("YTS: IMDb ID not found on page");
    const imdbId = imdbAnchor.href.match(/tt\d+/)?.[0];
    if (!imdbId) return console.warn("YTS: Failed to parse IMDb ID");

    function insertPlayButton() {
      const original = document.querySelector('a.torrent-modal-download.button-green-download2-big.hidden-xs.hidden-sm');
      if (!original) { setTimeout(insertPlayButton, 500); return; }
      if (document.getElementById('tmdb-yts-play')) return;
      const playBtn = original.cloneNode(true);
      playBtn.id = "tmdb-yts-play";
      playBtn.className = "";
      playBtn.classList.add("button-green-download2-big", "hidden-xs", "hidden-sm");
      playBtn.innerHTML = `<span class="icon-play"></span> Watch Now 😉`;
      playBtn.href = "javascript:void(0);";
      playBtn.removeAttribute("data-target"); playBtn.removeAttribute("data-toggle");
      original.parentNode.insertBefore(playBtn, original.nextSibling);
      playBtn.addEventListener('click', () => { triggerOverlay(imdbId); });
    }

    insertPlayButton();
    document.addEventListener("keydown", (e) => { if (e.shiftKey && e.key.toLowerCase() === "p") triggerOverlay(imdbId); });
  }

  /* ----------------------------------------------------
  * Action time
  * -------------------------------------------------- */
  if (isSearch() && currentSerpEngineEnabled()) {
    let serpAutoFetchTriggered = false;
    async function runSerpAutoFetchOnce() {
      if (serpAutoFetchTriggered || !SETTINGS.autoDetectOnSERP) return;
      if (!serpLooksLikeMedia()) return;
      serpAutoFetchTriggered = true;
      const ok = await fetchWithFallback(cleanedQuery);
      if (!ok) ensureSerpManualButton();
    }

    if (SETTINGS.autoDetectOnSERP && serpLooksLikeMedia()) {
      // Brave / DuckDuckGo results can re-render after load; delay the fetch so the injected card survives.
      if (isBrave && SETTINGS.enableOnBravePage) {
        setTimeout(() => void runSerpAutoFetchOnce(), 2200);
      } else if (isDuckDuckGo && SETTINGS.enableOnDuckDuckGoPage) {
        setTimeout(() => void runSerpAutoFetchOnce(), 1800);
      } else {
        void runSerpAutoFetchOnce();
      }
    } else {
      ensureSerpManualButton();
    }

    if (SETTINGS.autoDetectOnSERP && !serpAutoFetchTriggered) {
      const isBingSerp = isBing && SETTINGS.enableOnBingPage;
      const isBraveSerp = isBrave && SETTINGS.enableOnBravePage;
      const isDdgSerp = isDuckDuckGo && SETTINGS.enableOnDuckDuckGoPage;
      const moRoot = isGoogle && SETTINGS.enableOnGooglePage
        ? (document.getElementById('main') || document.body)
        : isBingSerp ? document.body
          : isBraveSerp ? (document.getElementById('results') || document.body)
            : isDdgSerp ? (document.querySelector('[data-testid="web-vertical"]') || document.body)
              : null;
      if (moRoot) {
        let moRaf = 0;
        let braveDebounce = 0;
        let ddgDebounce = 0;
        const scheduleSerpTry = () => {
          if (isBraveSerp) {
            if (braveDebounce) clearTimeout(braveDebounce);
            // Wait for Brave's DOM to settle before injecting the card.
            braveDebounce = setTimeout(() => { braveDebounce = 0; void runSerpAutoFetchOnce(); }, 1700);
            return;
          }
          if (isDdgSerp) {
            if (ddgDebounce) clearTimeout(ddgDebounce);
            ddgDebounce = setTimeout(() => { ddgDebounce = 0; void runSerpAutoFetchOnce(); }, 1200);
            return;
          }
          if (moRaf) return;
          moRaf = requestAnimationFrame(() => { moRaf = 0; void runSerpAutoFetchOnce(); });
        };
        const mo = new MutationObserver(scheduleSerpTry);
        mo.observe(moRoot, { childList: true, subtree: true });
        const observeMs = isBingSerp ? 25000 : isBraveSerp ? 35000 : isDdgSerp ? 32000 : 15000;
        setTimeout(() => { try { mo.disconnect(); } catch (e) { /* ignore */ } }, observeMs);
        scheduleSerpTry();
        if (isBraveSerp) {
          setTimeout(() => void runSerpAutoFetchOnce(), 2600);
          setTimeout(() => void runSerpAutoFetchOnce(), 7500);
        } else if (isDdgSerp) {
          setTimeout(() => void runSerpAutoFetchOnce(), 600);
          setTimeout(() => void runSerpAutoFetchOnce(), 2400);
          setTimeout(() => void runSerpAutoFetchOnce(), 7200);
        } else {
          setTimeout(() => void runSerpAutoFetchOnce(), 400);
          setTimeout(() => void runSerpAutoFetchOnce(), 2000);
        }
        if (isBingSerp) {
          setTimeout(() => void runSerpAutoFetchOnce(), 5000);
          setTimeout(() => void runSerpAutoFetchOnce(), 9000);
        }
      }
    }

    if ((isBing && SETTINGS.enableOnBingPage) || (isBrave && SETTINGS.enableOnBravePage) || (isDuckDuckGo && SETTINGS.enableOnDuckDuckGoPage)) {
      if (isBrave && SETTINGS.enableOnBravePage) {
        setTimeout(() => ensureSerpManualButton(), 2800);
        setTimeout(() => ensureSerpManualButton(), 8000);
        setTimeout(() => ensureSerpManualButton(), 15000);
      } else if (isDuckDuckGo && SETTINGS.enableOnDuckDuckGoPage) {
        setTimeout(() => ensureSerpManualButton(), 400);
        setTimeout(() => ensureSerpManualButton(), 1800);
        setTimeout(() => ensureSerpManualButton(), 4500);
      } else {
        setTimeout(() => ensureSerpManualButton(), 150);
        setTimeout(() => ensureSerpManualButton(), 900);
        setTimeout(() => ensureSerpManualButton(), 2500);
      }
    }
  } else if (isImdb && SETTINGS.enableOnImdbPage) {
    imdbHandler();
  } else if (isTrakt && SETTINGS.enableOnTraktPage) {
    traktPageHandler();
  } else if (isSimkl && SETTINGS.enableOnSimklPage) {
    simklPageHandler();
  } else if (isYTS && SETTINGS.enableOnYTSPage) {
    ytsHandler();
  }

  /* Floating settings FAB + Tampermonkey menu toggles */
  try {
    registerFabMenuCommands();
    applySettingsFab();
  } catch (e) { /* ignore */ }

})();