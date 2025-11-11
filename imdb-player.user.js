// ==UserScript==
// @name         IMDB Playable Links
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Minimal shell: notification queue + FAB to open links modal. Meant as a clean starting point.
// @match        https://www.imdb.com/title/*
// @match        https://imdb.com/title/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // Minimal CSS: notification and FAB
  GM_addStyle(`
    .imdb-notification{position:fixed;left:50%;top:20px;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#e2b616;padding:10px 14px;border-radius:6px;z-index:999999;opacity:0;transition:opacity .18s}
    .imdb-notification.show{opacity:1}
    #imdb-fab-links{position:fixed;right:14px;bottom:14px;width:44px;height:44px;border-radius:50%;background:#e2b616;color:#fff;border:none;box-shadow:0 8px 20px rgba(0,0,0,.35);z-index:1000000;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px}
    .imdb-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000001;display:flex;align-items:center;justify-content:center}
    .imdb-modal{background:#111;color:#e2b616;padding:16px;border-radius:10px;min-width:320px;max-width:92vw}
  `);

  // Notification queue (keeps behavior simple and reusable)
  const notificationQueue = [];
  let notificationActive = false;

  function showNotification(message, duration = 2500) {
    try { notificationQueue.push({ message: String(message), duration }); }
    catch (e) { /* ignore */ }
    if (!notificationActive) processQueue();
  }

  function processQueue() {
    if (notificationQueue.length === 0) { notificationActive = false; return; }
    notificationActive = true;
    const { message, duration } = notificationQueue.shift();
    const el = document.createElement('div');
    el.className = 'imdb-notification';
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); processQueue(); }, 200); }, duration);
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

  // Extract the page title from the H1 -> .hero__primary-text and verify textlength attr
  function getTitleFromPage() {
    // Prefer the H1 with data-testid "hero__pageTitle"
    const h1 = document.querySelector('h1[data-testid="hero__pageTitle"]') || document.querySelector('h1');
    if (!h1) return { title: '', textLengthAttr: null, matchesAttr: false };
    const span = h1.querySelector('span[data-testid="hero__primary-text"]') || h1.querySelector('span');
    const title = span ? String(span.textContent || '').trim() : String(h1.textContent || '').trim();
    const textLengthAttrRaw = h1.getAttribute('textlength');
    const textLengthAttr = textLengthAttrRaw != null ? parseInt(textLengthAttrRaw, 10) : null;
    const matchesAttr = (typeof textLengthAttr === 'number' && !isNaN(textLengthAttr)) ? (title.length === textLengthAttr) : false;
    return { title, textLengthAttr, matchesAttr };
  }

  // Detect whether the page represents a TV series or a movie
  function detectType() {
    // IMDb shows "TV Series" in an inline list for series; look for that text
    const inlineItems = Array.from(document.querySelectorAll('ul.ipc-inline-list li'))
      .map(n => (n.textContent || '').trim());
    const isTv = inlineItems.some(t => /\bTV\b|TV Series|Series/i.test(t) && /TV/i.test(t));
    return isTv ? 'tv' : 'movie';
  }

  // Modal stub (links will be added by you later)
  function openLinksModal() {
    if (document.querySelector('#imdb-links-modal')) { closeLinksModal(); return; }
    // gather title + type to show for now
    const titleInfo = getTitleFromPage();
    const type = detectType();

    const overlay = document.createElement('div');
    overlay.className = 'imdb-overlay';
    overlay.id = 'imdb-links-modal';
    overlay.innerHTML = `
      <div class="imdb-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${titleInfo.title || '(not found)'} - ${type === 'tv' ? 'TV Series' : 'Movies'}</strong>
          <button id="imdb-links-close" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer">✕</button>
        </div>
        <div id="imdb-links-container">
          <div><em>Add your links here (use the IMDb id or the extracted title).</em></div>
          <div>API key: <strong>${apiKeys}</strong></div>
        </div>
      </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLinksModal(); });
    document.body.appendChild(overlay);
    document.getElementById('imdb-links-close').onclick = closeLinksModal;
  }
  function closeLinksModal() { const ov = document.querySelector('#imdb-links-modal'); if (ov) ov.remove(); }

  /* ----------------------------------------------------
  * TMDb + YTS fetch
  * -------------------------------------------------- */
  function getNextApiKey() {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return key;
  }

  // create FAB to open the modal
  try {
    const playFab = document.createElement('button');
    playFab.id = 'imdb-fab-links';
    playFab.title = 'Open Links (Shift+P)';
    playFab.innerHTML = '▶';
    playFab.addEventListener('click', openLinksModal);
    document.body.appendChild(playFab);
  } catch (e) { /* ignore */ }

  // keybinding for convenience
  document.addEventListener('keydown', (e) => { if (e.shiftKey && e.key && e.key.toLowerCase() === 'p') openLinksModal(); });

})();
