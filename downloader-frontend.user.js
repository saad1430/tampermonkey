// ==UserScript==
// @name         Movie Downloader Frontend
// @namespace    https://github.com/saad1430/tampermonkey
// @version      1.0
// @description  Opens example.com#downloader, clears that page, and lists movie or TV episode download links from downloads.wing.st. Uses #downloader?type=&id=&s=&e=.
// @author       Saad1430
// @license      MIT
// @match        https://example.com/*
// @match        https://www.example.com/*
// @match        https://downloads.wing.st/*
// @connect      downloads.wing.st
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const DEFAULT_MOVIE_ID = '27205';
  const API_ORIGIN = 'https://downloads.wing.st';
  const PAGE_ORIGIN = 'https://example.com';

  const CSS = `
    :root {
      color-scheme: dark;
      --bg: #0c0e13;
      --elev: #151922;
      --elev-2: #1d2431;
      --line: rgba(255, 255, 255, 0.09);
      --text: #eef1f6;
      --muted: #9aa3b5;
      --accent: #7ee0c6;
      --accent-ink: #06281f;
      --danger: #ffb4b4;
      --shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--text); }
    body {
      font: 15px/1.45 "Segoe UI", system-ui, sans-serif;
      background:
        radial-gradient(1000px 420px at 0% -10%, rgba(126, 224, 198, 0.14), transparent 55%),
        radial-gradient(800px 380px at 100% 0%, rgba(142, 182, 255, 0.12), transparent 50%),
        var(--bg);
    }
    button, input, select { font: inherit; color: inherit; }
    button, a { -webkit-tap-highlight-color: transparent; }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .wrap { width: min(980px, calc(100% - 32px)); margin: 0 auto; }
    .hero { padding: 28px 0 8px; }
    .top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .kicker {
      margin: 0 0 8px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); line-height: 1.1; letter-spacing: -0.03em; }
    .meta { margin: 8px 0 0; color: var(--muted); }
    .endpoint { color: var(--muted); word-break: break-all; }
    .endpoint:hover { color: var(--text); }
    .id-form { display: flex; gap: 8px; align-items: end; flex-wrap: wrap; }
    .id-form label { display: grid; gap: 6px; color: var(--muted); font-size: 12px; font-weight: 650; }
    .id-form label[hidden] { display: none; }
    .id-form input { width: 8rem; }
    .id-form input.narrow { width: 4.75rem; }
    .id-form select { width: 6.5rem; min-width: 6.5rem; }
  input, select {
    background: var(--elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    color: var(--text);
    font-size: 15px;
    font-weight: 500;
  }
    input::placeholder { color: #71798a; }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 12px 0;
      background: rgba(12, 14, 19, 0.9);
      backdrop-filter: blur(16px);
    }
    .toolbar-row, .tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .toolbar-row { justify-content: space-between; }
    .tools { flex: 1 1 320px; justify-content: flex-end; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip, .btn {
      border-radius: 999px;
      border: 1px solid var(--line);
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      text-decoration: none;
    }
    .chip { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; }
    .chip.active { color: var(--text); background: rgba(126, 224, 198, 0.16); border-color: rgba(126, 224, 198, 0.5); }
    .count, .index, .size { font-variant-numeric: tabular-nums; }
    .search { flex: 1 1 220px; min-width: 180px; }
    select { min-width: 9.5rem; }
    .showing { margin: 10px 0 0; color: var(--muted); font-size: 13px; }
    main { padding-bottom: 64px; }
    .group { margin-top: 8px; }
    .group h2 { margin: 18px 0 10px; font-size: 13px; font-weight: 750; letter-spacing: 0.04em; color: var(--muted); }
    .stack { display: grid; gap: 12px; }
    .card {
      background: rgba(21, 25, 34, 0.92);
      border: 1px solid var(--line);
      border-left: 3px solid var(--q, var(--accent));
      border-radius: 16px;
      padding: 14px 16px 16px;
      box-shadow: var(--shadow);
    }
    .card[data-q="2160"] { --q: #c9a6ff; }
    .card[data-q="1080"] { --q: #8eb6ff; }
    .card[data-q="720"] { --q: #7ee0c6; }
    .card-top { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; }
    .badge, .source, .size {
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge { color: #100c16; background: var(--q, var(--accent)); }
    .source { color: var(--text); background: var(--elev-2); font-weight: 600; }
    .size { margin-left: auto; color: var(--text); background: transparent; padding-right: 0; }
    .index { color: #71798a; font-size: 12px; font-weight: 700; }
    h3 { margin: 10px 0 0; font-size: 16px; line-height: 1.35; overflow-wrap: anywhere; }
    .file { margin: 6px 0 0; color: var(--muted); overflow-wrap: anywhere; }
    .file-url {
      display: block;
      margin-top: 10px;
      color: #c9d4ea;
      font: 12px/1.45 ui-monospace, "Cascadia Mono", Consolas, monospace;
      overflow-wrap: anywhere;
    }
    .file-url:hover { color: white; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; font-weight: 700; }
    .btn svg { width: 16px; height: 16px; }
    .btn-primary { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
    .btn-primary:hover { filter: brightness(1.05); }
    .btn-ghost { color: var(--text); }
    .btn-ghost:hover { background: rgba(255, 255, 255, 0.05); }
    .status, .empty {
      margin: 24px 0;
      padding: 22px;
      border: 1px dashed var(--line);
      border-radius: 16px;
      color: var(--muted);
      background: rgba(21, 25, 34, 0.65);
    }
    .status strong, .empty strong { color: var(--text); }
    .status .btn { margin-top: 14px; }
    .error { color: var(--danger); }
    #dl-toast {
      position: fixed;
      left: 50%;
      bottom: 18px;
      transform: translate(-50%, 8px);
      opacity: 0;
      pointer-events: none;
      background: #eef1f6;
      color: #151922;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 650;
      transition: opacity .18s ease, transform .18s ease;
    }
    #dl-toast.show { opacity: 1; transform: translate(-50%, 0); }
    @media (max-width: 640px) {
      .size { margin-left: 0; }
      .tools { justify-content: stretch; }
      .search, select, .tools .btn { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      #dl-toast { transition: none; }
    }
  `;

  const state = {
    selection: { kind: 'movie', id: DEFAULT_MOVIE_ID, season: '1', episode: '1' },
    query: '',
    quality: 'all',
    sort: 'listed',
    links: [],
    loading: false,
  };

  const ui = {};
  let loadSeq = 0;
  let toastTimer = 0;
  let booted = false;

  function el(tag, attrs) {
    const node = document.createElement(tag);
    const options = attrs || {};
    Object.keys(options).forEach((key) => {
      const value = options[key];
      if (value == null || value === false) return;
      if (key === 'class') node.className = String(value);
      else if (key === 'text') node.textContent = String(value);
      else node.setAttribute(key, String(value));
    });
    for (let i = 2; i < arguments.length; i += 1) {
      if (arguments[i]) node.append(arguments[i]);
    }
    return node;
  }

  function svgIcon(pathD) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    return svg;
  }

  function isExampleHost(host) {
    return host === 'example.com' || host === 'www.example.com';
  }

  function defaultSelection() {
    return { kind: 'movie', id: DEFAULT_MOVIE_ID, season: '1', episode: '1' };
  }

  function normalizeSelection(selection) {
    const kind = selection && selection.kind === 'tv' ? 'tv' : 'movie';
    const id = selection && /^\d+$/.test(String(selection.id || '')) ? String(selection.id) : '';
    if (!id) return null;
    if (kind === 'tv') {
      const season = selection && /^\d+$/.test(String(selection.season || '')) ? String(Number(selection.season)) : '';
      const episode = selection && /^\d+$/.test(String(selection.episode || '')) ? String(Number(selection.episode)) : '';
      if (!season || !episode) return null;
      return { kind: 'tv', id, season, episode };
    }
    return { kind: 'movie', id, season: '1', episode: '1' };
  }

  function selectionFromPath(pathname) {
    const path = String(pathname || '');
    const movie = path.match(/\/movie\/(\d+)/);
    if (movie) return { kind: 'movie', id: movie[1], season: '1', episode: '1' };
    const tv = path.match(/\/tv\/(\d+)\/(\d+)\/(\d+)/);
    if (tv) return { kind: 'tv', id: tv[1], season: String(Number(tv[2])), episode: String(Number(tv[3])) };
    return null;
  }

  function selectionFromParams(raw) {
    const params = new URLSearchParams(String(raw || '').replace(/^\?/, ''));
    const type = String(params.get('type') || '').toLowerCase();
    const id = String(params.get('id') || '').trim();
    if (!/^\d+$/.test(id)) return null;
    if (type === 'tv') {
      const season = String(params.get('s') || '').trim();
      const episode = String(params.get('e') || '').trim();
      return normalizeSelection({ kind: 'tv', id, season, episode });
    }
    if (type === 'movie' || type === '') {
      return normalizeSelection({ kind: 'movie', id });
    }
    return null;
  }

  function selectionFromHash(hash) {
    const value = String(hash || '');
    const withQuery = value.match(/^#downloader(?:\?(.*))?$/);
    if (withQuery) return withQuery[1] ? selectionFromParams(withQuery[1]) : defaultSelection();
    const tv = value.match(/^#downloader\/tv\/(\d+)\/(\d+)\/(\d+)$/);
    if (tv) return { kind: 'tv', id: tv[1], season: String(Number(tv[2])), episode: String(Number(tv[3])) };
    const movie = value.match(/^#downloader\/(\d+)$/);
    if (movie) return { kind: 'movie', id: movie[1], season: '1', episode: '1' };
    return null;
  }

  function selectionFromLocation() {
    return selectionFromHash(location.hash)
      || selectionFromParams(location.search)
      || (location.hostname === 'downloads.wing.st' ? selectionFromPath(location.pathname) : null)
      || defaultSelection();
  }

  function queryString(selection) {
    const next = normalizeSelection(selection) || defaultSelection();
    const params = new URLSearchParams();
    params.set('type', next.kind);
    params.set('id', next.id);
    if (next.kind === 'tv') {
      params.set('s', next.season);
      params.set('e', next.episode);
    }
    return '?' + params.toString();
  }

  function downloaderHash(selection) {
    return '#downloader' + queryString(selection);
  }

  function pagePath(selection) {
    return '/' + downloaderHash(selection);
  }

  function pageUrl(selection) {
    return PAGE_ORIGIN + pagePath(selection);
  }

  function apiUrl(selection) {
    if (selection.kind === 'tv') return API_ORIGIN + '/tv/' + selection.id + '/' + selection.season + '/' + selection.episode;
    return API_ORIGIN + '/movie/' + selection.id;
  }

  function episodeCode(selection) {
    return 'S' + String(selection.season).padStart(2, '0') + 'E' + String(selection.episode).padStart(2, '0');
  }

  function sameSelection(a, b) {
    return !!a && !!b
      && a.kind === b.kind
      && a.id === b.id
      && (a.kind !== 'tv' || (a.season === b.season && a.episode === b.episode));
  }

  function isCanonicalDownloader(selection) {
    return (location.protocol === 'https:' || location.protocol === 'http:')
      && isExampleHost(location.hostname)
      && (location.pathname === '/' || location.pathname === '')
      && !location.search
      && location.hash === downloaderHash(selection || selectionFromLocation());
  }

  function httpUrl(value) {
    try {
      const url = new URL(String(value || ''));
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
      return url.href;
    } catch {
      return '';
    }
  }

  function qualityLabel(quality) {
    const n = Number(quality);
    return n ? n + 'p' : 'Other';
  }

  function sizeBytes(size) {
    const match = String(size || '').replace(/,/g, '').match(/([\d.]+)\s*(TB|GB|MB|KB|B)/i);
    if (!match) return 0;
    const unit = match[2].toUpperCase();
    const mult = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
    return Number(match[1]) * (mult[unit] || 1);
  }

  function sourceLabel(link) {
    const source = String(link.source || '').trim();
    const provider = String(link.provider || '').trim();
    if (!provider || source.toLowerCase() === provider.toLowerCase()) return source || provider || 'Unknown source';
    return source + ' · ' + provider;
  }

  function prettify(name) {
    return String(name || '').replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function prettyTitle(text) {
    const decoded = String(text || '').replace(/\+/g, ' ');
    let match = decoded.match(/([A-Za-z][\w'.]*(?:[ ._][A-Za-z0-9][\w'.]*)*)\s*\(((?:19|20)\d{2})\)/);
    if (match) return prettify(match[1]) + ' (' + match[2] + ')';
    match = decoded.match(/([A-Za-z][\w'.]*(?:[ ._][A-Za-z0-9][\w'.]*)*)[ ._\[]+S\d{1,3}E\d{1,3}\b/i);
    if (match) return prettify(match[1]);
    match = decoded.match(/([A-Za-z][\w'.]*(?:[ ._][A-Za-z0-9][\w'.]*)*)[ ._[\]]+((?:19|20)\d{2})/);
    if (match) return prettify(match[1]) + ' (' + match[2] + ')';
    return '';
  }

  function dispositionFilename(url) {
    try {
      const value = new URL(url).searchParams.get('response-content-disposition') || '';
      const encoded = value.match(/filename\*=(?:UTF-8''|utf-8'')([^;]+)/i);
      const quoted = value.match(/filename="([^"]+)"/i);
      const plain = value.match(/filename=([^;]+)/i);
      const raw = (encoded ? encoded[1] : quoted ? quoted[1] : plain ? plain[1] : '').trim().replace(/^"|"$/g, '');
      if (!raw) return '';
      try { return decodeURIComponent(raw); } catch { return raw; }
    } catch {
      return '';
    }
  }

  function linkTexts(link) {
    const texts = [];
    if (link.filename) texts.push(String(link.filename));
    const url = httpUrl(link.url);
    const disposition = url ? dispositionFilename(url) : '';
    if (disposition) texts.push(disposition);
    if (url) {
      try {
        const last = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '');
        if (last && last.indexOf('.') !== -1) texts.push(last);
      } catch { /* keep the other names */ }
    }
    if (link.name) texts.push(String(link.name));
    return texts;
  }

  function fileTitle(link) {
    const texts = linkTexts(link);
    for (let i = 0; i < texts.length; i += 1) {
      const title = prettyTitle(texts[i]);
      if (title) return title;
    }
    return '';
  }

  function releaseTitle(links, selection) {
    let fallback = '';
    for (let i = 0; i < links.length; i += 1) {
      const title = fileTitle(links[i]);
      if (!title) continue;
      if (/\(\d{4}\)$/.test(title)) return title;
      if (!fallback) fallback = title;
    }
    if (fallback) return fallback;
    return selection.kind === 'tv' ? 'Show ' + selection.id : 'Movie ' + selection.id;
  }

  function episodeChapter(links) {
    for (let i = 0; i < links.length; i += 1) {
      const texts = linkTexts(links[i]);
      for (let j = 0; j < texts.length; j += 1) {
        const match = texts[j].match(/S\d{1,3}E\d{1,3}\s*[-–:]\s*([^[\]]+?)(?:\s*[\[(]|$)/i);
        if (!match) continue;
        const chapter = prettify(match[1]);
        if (chapter) return chapter;
      }
    }
    return '';
  }

  function displayFilename(link) {
    if (link.filename) return String(link.filename);
    const url = httpUrl(link.url);
    return url ? dispositionFilename(url) : '';
  }

  function qualitiesIn(links) {
    const present = new Set(links.map((link) => String(Number(link.quality) || 0)));
    const preferred = ['2160', '1080', '720', '480'];
    const ordered = preferred.filter((quality) => present.has(quality));
    present.forEach((quality) => {
      if (quality !== '0' && ordered.indexOf(quality) === -1) ordered.push(quality);
    });
    ordered.sort((a, b) => Number(b) - Number(a));
    if (present.has('0')) ordered.push('0');
    return ordered;
  }

  function filteredLinks() {
    const query = state.query.trim().toLowerCase();
    return state.links.filter((link) => {
      if (state.quality !== 'all' && String(Number(link.quality) || 0) !== state.quality) return false;
      if (!query) return true;
      const haystack = [link.name, link.filename, link.source, link.provider, link.url, link.size, qualityLabel(link.quality)]
        .join(' ')
        .toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function sortGroup(items) {
    const copy = items.slice();
    if (state.sort === 'largest') copy.sort((a, b) => sizeBytes(b.size) - sizeBytes(a.size));
    else if (state.sort === 'smallest') copy.sort((a, b) => sizeBytes(a.size) - sizeBytes(b.size));
    return copy;
  }

  function displayGroups() {
    const groups = new Map();
    filteredLinks().forEach((link) => {
      const quality = Number(link.quality) || 0;
      if (!groups.has(quality)) groups.set(quality, []);
      groups.get(quality).push(link);
    });
    return [...groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([quality, items]) => [quality, sortGroup(items)]);
  }

  function displayList() {
    const flat = [];
    displayGroups().forEach((entry) => {
      entry[1].forEach((link) => flat.push(link));
    });
    return flat;
  }

  function toast(message) {
    let node = document.getElementById('dl-toast');
    if (!node) {
      node = el('div', { id: 'dl-toast', role: 'status' });
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 1800);
  }

  function copyText(text, message) {
    const done = () => toast(message || 'Link copied');
    const clipboard = navigator.clipboard;
    if (clipboard && clipboard.writeText) {
      clipboard.writeText(text).then(done).catch(() => {
        if (typeof GM_setClipboard === 'function') {
          GM_setClipboard(text, 'text');
          done();
          return;
        }
        toast('Could not copy');
      });
      return;
    }
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(text, 'text');
      done();
      return;
    }
    toast('Could not copy');
  }

  function requestJson(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        reject(new Error('Install this file in Tampermonkey so it can reach downloads.wing.st.'));
        return;
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: 30000,
        headers: { Accept: 'application/json' },
        onload(resp) {
          if (resp.status < 200 || resp.status >= 300) {
            reject(new Error('Could not load downloads (' + resp.status + ').'));
            return;
          }
          try {
            resolve(JSON.parse(resp.responseText));
          } catch {
            reject(new Error('The download service returned invalid JSON.'));
          }
        },
        onerror() { reject(new Error('Network error while loading downloads.')); },
        ontimeout() { reject(new Error('The download service timed out.')); },
      });
    });
  }

  function hideHostPage() {
    const style = document.createElement('style');
    style.id = 'dl-hide-host';
    style.textContent = 'html,body{background:#0c0e13!important}body>*{display:none!important}';
    (document.head || document.documentElement).appendChild(style);
  }

  function takeover() {
    try { window.stop(); } catch { /* the host page can keep loading only if stop is unavailable */ }
    const root = document.documentElement;
    root.replaceChildren();
    root.lang = 'en';
    const head = document.createElement('head');
    const body = document.createElement('body');
    root.append(head, body);

    const charset = document.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#0c0e13';
    const title = document.createElement('title');
    title.id = 'dl-title';
    title.textContent = 'Downloader';
    const style = document.createElement('style');
    style.textContent = CSS;
    head.append(charset, viewport, theme, title, style);

    const app = el('div', { id: 'dl-app' });
    body.append(app);
    const guard = new MutationObserver(() => {
      [...body.children].forEach((node) => {
        if (node !== app && node.id !== 'dl-toast') node.remove();
      });
    });
    guard.observe(body, { childList: true });
    return app;
  }

  function fillChips() {
    ui.chips.replaceChildren();
    const options = [{ id: 'all', label: 'All', count: state.links.length }];
    qualitiesIn(state.links).forEach((quality) => {
      const count = state.links.filter((link) => String(Number(link.quality) || 0) === quality).length;
      options.push({ id: quality, label: qualityLabel(quality), count });
    });
    if (!options.some((option) => option.id === state.quality)) state.quality = 'all';
    options.forEach((option) => {
      const active = option.id === state.quality;
      const button = el('button', {
        type: 'button',
        class: active ? 'chip active' : 'chip',
        'data-quality': option.id,
        'aria-pressed': active ? 'true' : 'false',
      });
      button.append(el('span', { text: option.label }), el('span', { class: 'count', text: String(option.count) }));
      button.addEventListener('click', () => {
        state.quality = option.id;
        fillChips();
        renderResults();
      });
      ui.chips.append(button);
    });
  }

  function renderCard(link, index) {
    const url = httpUrl(link.url);
    const card = el('article', { class: 'card', 'data-q': String(Number(link.quality) || 0), role: 'listitem' });
    const top = el('div', { class: 'card-top' });
    top.append(
      el('span', { class: 'index', text: String(index + 1).padStart(2, '0') }),
      el('span', { class: 'badge', text: qualityLabel(link.quality) }),
      el('span', { class: 'source', text: sourceLabel(link) }),
      el('span', { class: 'size', text: link.size || 'Unknown size' })
    );
    const filename = displayFilename(link);
    card.append(top, el('h3', { text: link.name || filename || 'Untitled file' }));
    if (filename && filename !== link.name) card.append(el('p', { class: 'file', text: filename }));
    if (!url) {
      card.append(el('p', { class: 'file', text: 'This release did not include a usable link.' }));
      return card;
    }
    const anchor = el('a', {
      class: 'file-url',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: url,
    });
    anchor.referrerPolicy = 'no-referrer';
    const actions = el('div', { class: 'actions' });
    const download = el('a', {
      class: 'btn btn-primary',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Download ' + (link.name || filename || 'file'),
    });
    download.referrerPolicy = 'no-referrer';
    if (filename) download.setAttribute('download', filename);
    download.append(svgIcon('M12 3v12m0 0 4-4m-4 4-4-4M5 21h14'), el('span', { text: 'Download' }));
    const copy = el('button', { class: 'btn btn-ghost', type: 'button' });
    copy.append(svgIcon('M8 8h11v11H8zM5 16V5h11'), el('span', { text: 'Copy link' }));
    copy.addEventListener('click', () => copyText(url, 'Link copied'));
    actions.append(download, copy);
    card.append(anchor, actions);
    return card;
  }

  function renderMessage(title, detail, retry) {
    const box = el('div', { class: retry ? 'status error' : 'status' });
    box.append(el('strong', { text: title }));
    if (detail) box.append(el('p', { text: detail }));
    if (retry) {
      const button = el('button', { class: 'btn btn-primary', type: 'button', text: 'Try again' });
      button.addEventListener('click', () => load(state.selection));
      box.append(button);
    }
    ui.results.replaceChildren(box);
  }

  function renderResults() {
    if (state.loading) return;
    const shown = displayList();
    ui.showing.textContent = state.links.length
      ? 'Showing ' + shown.length + ' of ' + state.links.length
      : '';
    if (!state.links.length) {
      ui.results.replaceChildren(el('p', { class: 'empty' }, el('strong', { text: 'No downloads were listed for this release.' })));
      return;
    }
    if (!shown.length) {
      ui.results.replaceChildren(el('p', { class: 'empty' }, el('strong', { text: 'No releases match this filter.' })));
      return;
    }
    const fragment = document.createDocumentFragment();
    let index = 0;
    displayGroups().forEach(([quality, items]) => {
      const section = el('section', { class: 'group' });
      section.append(el('h2', { text: qualityLabel(quality) + ' · ' + items.length }));
      const stack = el('div', { class: 'stack', role: 'list' });
      items.forEach((link) => {
        stack.append(renderCard(link, index));
        index += 1;
      });
      section.append(stack);
      fragment.append(section);
    });
    ui.results.replaceChildren(fragment);
  }

  function setHeading(title, selection) {
    ui.heading.textContent = title;
    const count = state.links.length + (state.links.length === 1 ? ' file' : ' files');
    const parts = [count];
    if (selection.kind === 'tv') {
      parts.push(episodeCode(selection));
      const chapter = episodeChapter(state.links);
      if (chapter) parts.push(chapter);
      parts.push('show ' + selection.id);
    } else {
      parts.push('movie ' + selection.id);
    }
    ui.meta.textContent = parts.join(' · ');
    const endpoint = apiUrl(selection);
    ui.endpoint.textContent = endpoint;
    ui.endpoint.href = endpoint;
    document.title = (selection.kind === 'tv' ? title + ' ' + episodeCode(selection) : title) + ' — Downloader';
  }

  async function load(selection) {
    const seq = ++loadSeq;
    state.selection = {
      kind: selection.kind === 'tv' ? 'tv' : 'movie',
      id: selection.id,
      season: selection.season,
      episode: selection.episode,
    };
    state.loading = true;
    state.links = [];
    const endpoint = apiUrl(state.selection);
    ui.heading.textContent = state.selection.kind === 'tv'
      ? 'Loading ' + episodeCode(state.selection)
      : 'Loading movie ' + state.selection.id;
    ui.meta.textContent = 'Fetching download links';
    ui.endpoint.textContent = endpoint;
    ui.endpoint.href = endpoint;
    ui.showing.textContent = '';
    ui.chips.replaceChildren();
    renderMessage('Loading downloads…', 'Reading ' + endpoint);
    try {
      const data = await requestJson(endpoint);
      if (seq !== loadSeq) return;
      state.links = Array.isArray(data && data.links) ? data.links.filter((link) => link && typeof link.url === 'string') : [];
      state.loading = false;
      setHeading(releaseTitle(state.links, state.selection), state.selection);
      fillChips();
      renderResults();
    } catch (error) {
      if (seq !== loadSeq) return;
      state.loading = false;
      ui.heading.textContent = state.selection.kind === 'tv'
        ? 'Show ' + state.selection.id + ' ' + episodeCode(state.selection)
        : 'Movie ' + state.selection.id;
      ui.meta.textContent = 'Downloads unavailable';
      ui.showing.textContent = '';
      renderMessage('Could not load these downloads', error && error.message ? error.message : 'Request failed.', true);
    }
  }

  function writeLocation(selection, replace) {
    const next = normalizeSelection(selection) || defaultSelection();
    const path = pagePath(next);
    const current = (location.pathname || '/') + location.search + location.hash;
    if (current === path || current === path.replace(/^\//, '')) return next;
    if (replace) history.replaceState(null, '', path);
    else history.pushState(null, '', path);
    return next;
  }

  function goToSelection(selection) {
    const kind = selection.kind === 'tv' ? 'tv' : 'movie';
    if (!/^\d+$/.test(selection.id)) {
      toast(kind === 'tv' ? 'Enter a numeric show id' : 'Enter a numeric movie id');
      return;
    }
    if (kind === 'tv' && (!/^\d+$/.test(selection.season) || !/^\d+$/.test(selection.episode))) {
      toast('Enter a season and episode number');
      return;
    }
    const next = normalizeSelection({
      kind,
      id: selection.id,
      season: selection.season,
      episode: selection.episode,
    });
    if (!next) {
      toast(kind === 'tv' ? 'Enter a season and episode number' : 'Enter a numeric movie id');
      return;
    }
    writeLocation(next, false);
    applySelectionToForm(next);
    load(next);
  }

  function onLocationChange() {
    const selection = selectionFromLocation();
    if (!isCanonicalDownloader(selection)) writeLocation(selection, true);
    applySelectionToForm(selection);
    if (!sameSelection(state.selection, selection) || !state.links.length) load(selection);
  }

  function syncKindFields() {
    const tv = ui.kind.value === 'tv';
    ui.seasonLabel.hidden = !tv;
    ui.episodeLabel.hidden = !tv;
    if (tv) {
      if (!ui.seasonInput.value.trim()) ui.seasonInput.value = '1';
      if (!ui.episodeInput.value.trim()) ui.episodeInput.value = '1';
    }
    ui.idCaption.textContent = tv ? 'Show ID' : 'Movie ID';
    ui.idInput.setAttribute('aria-label', tv ? 'Show id' : 'Movie id');
  }

  function applySelectionToForm(selection) {
    if (!ui.kind) return;
    ui.kind.value = selection.kind === 'tv' ? 'tv' : 'movie';
    ui.idInput.value = selection.id;
    ui.seasonInput.value = selection.season;
    ui.episodeInput.value = selection.episode;
    syncKindFields();
  }

  function readForm() {
    return {
      kind: ui.kind.value === 'tv' ? 'tv' : 'movie',
      id: ui.idInput.value.trim(),
      season: ui.seasonInput.value.trim(),
      episode: ui.episodeInput.value.trim(),
    };
  }

  function numberInput(id, label, value, narrow) {
    const input = el('input', {
      id,
      class: narrow ? 'narrow' : '',
      type: 'text',
      inputmode: 'numeric',
      spellcheck: 'false',
      autocomplete: 'off',
      value,
      'aria-label': label,
    });
    return input;
  }

  function buildShell(app, selection) {
    const hero = el('header', { class: 'hero' });
    const heroWrap = el('div', { class: 'wrap top' });
    const intro = el('div');
    ui.heading = el('h1', { text: 'Downloader' });
    ui.meta = el('p', { class: 'meta', text: 'Preparing the page' });
    ui.endpoint = el('a', { class: 'endpoint', target: '_blank', rel: 'noopener noreferrer', href: apiUrl(selection) });
    ui.endpoint.referrerPolicy = 'no-referrer';
    intro.append(el('p', { class: 'kicker', text: 'Downloader' }), ui.heading, ui.meta, ui.endpoint);

    ui.kind = el('select', { 'aria-label': 'Media type' });
    ui.kind.append(el('option', { value: 'movie', text: 'Movie' }), el('option', { value: 'tv', text: 'TV' }));
    ui.kind.addEventListener('change', syncKindFields);
    const kindLabel = el('label');
    kindLabel.append(el('span', { text: 'Type' }), ui.kind);

    ui.idInput = numberInput('dl-media-id', 'Movie id', selection.id, false);
    ui.idCaption = el('span', { text: 'Movie ID' });
    const idLabel = el('label');
    idLabel.append(ui.idCaption, ui.idInput);

    ui.seasonInput = numberInput('dl-season', 'Season', selection.season, true);
    ui.seasonLabel = el('label');
    ui.seasonLabel.append(el('span', { text: 'Season' }), ui.seasonInput);

    ui.episodeInput = numberInput('dl-episode', 'Episode', selection.episode, true);
    ui.episodeLabel = el('label');
    ui.episodeLabel.append(el('span', { text: 'Episode' }), ui.episodeInput);

    const loadButton = el('button', { class: 'btn btn-primary', type: 'submit', text: 'Load' });
    const form = el('form', { class: 'id-form' }, kindLabel, idLabel, ui.seasonLabel, ui.episodeLabel, loadButton);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      goToSelection(readForm());
    });
    applySelectionToForm(selection);
    heroWrap.append(intro, form);
    hero.append(heroWrap);

    const toolbar = el('div', { class: 'toolbar' });
    const bar = el('div', { class: 'wrap' });
    const row = el('div', { class: 'toolbar-row' });
    ui.chips = el('div', { class: 'chips', role: 'toolbar', 'aria-label': 'Quality' });
    ui.search = el('input', {
      class: 'search',
      type: 'search',
      placeholder: 'Filter by name, source, or URL',
      'aria-label': 'Filter releases',
    });
    ui.search.addEventListener('input', () => {
      state.query = ui.search.value;
      renderResults();
    });
    ui.sort = el('select', { 'aria-label': 'Sort releases' });
    [['listed', 'Listed order'], ['largest', 'Largest first'], ['smallest', 'Smallest first']].forEach(([value, label]) => {
      ui.sort.append(el('option', { value, text: label }));
    });
    ui.sort.addEventListener('change', () => {
      state.sort = ui.sort.value;
      renderResults();
    });
    ui.copyVisible = el('button', { class: 'btn btn-ghost', type: 'button', text: 'Copy visible links' });
    ui.copyVisible.addEventListener('click', () => {
      const urls = displayList().map((link) => httpUrl(link.url)).filter(Boolean);
      if (!urls.length) {
        toast('No links to copy');
        return;
      }
      copyText(urls.join('\n'), urls.length === 1 ? 'Link copied' : urls.length + ' links copied');
    });
    const tools = el('div', { class: 'tools' }, ui.search, ui.sort, ui.copyVisible);
    row.append(ui.chips, tools);
    ui.showing = el('p', { class: 'showing' });
    bar.append(row, ui.showing);
    toolbar.append(bar);

    ui.results = el('main', { class: 'wrap' });
    app.append(hero, toolbar, ui.results);
  }

  function mount(selection) {
    hideHostPage();
    const app = takeover();
    buildShell(app, selection);
    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('popstate', onLocationChange);
    load(selection);
  }

  function boot() {
    if (booted) return;
    try {
      if (window.top !== window) return;
    } catch {
      return;
    }

    if (location.hostname === 'downloads.wing.st') {
      const selection = selectionFromPath(location.pathname);
      if (!selection) return;
      location.replace(pageUrl(selection));
      return;
    }
    if (!isExampleHost(location.hostname)) return;

    booted = true;
    const selection = selectionFromLocation();
    if (!isCanonicalDownloader(selection)) {
      const target = pageUrl(selection);
      const canRewriteInPlace = (location.protocol === 'https:' || location.protocol === 'http:')
        && isExampleHost(location.hostname)
        && (location.pathname === '/' || location.pathname === '');
      if (!canRewriteInPlace) {
        location.replace(target);
        return;
      }
      history.replaceState(null, '', pagePath(selection));
    }
    mount(selectionFromLocation());
  }

  boot();
})();
