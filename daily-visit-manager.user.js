// ==UserScript==
// @name         Daily Visit Manager
// @namespace    http://github.com/saad1430/tampermonkey
// @version      1.1.1
// @description  Automatically opens configured sites once per day on first interaction. Manage sites via the floating UI panel.
// @updateURL    https://github.com/saad1430/tampermonkey/raw/main/daily-visit-manager.user.js
// @downloadURL  https://github.com/saad1430/tampermonkey/raw/main/daily-visit-manager.user.js
// @icon         https://raw.githubusercontent.com/saad1430/tampermonkey/refs/heads/main/icons/daily-visit-manager-100.png
// @author       Saad1430
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────

    const FONT = "'DM Mono', monospace";
    const C = {
        bg:          '#0f1117',
        surface:     '#1a1d27',
        border:      '#2a2d3a',
        accent:      '#7c6af7',
        accentHover: '#9585ff',
        danger:      '#e05c6a',
        dangerHover: '#ff7080',
        text:        '#e2e4f0',
        muted:       '#7a7d8f',
        success:     '#4ecb8d',
        warn:        '#f0a855',
        tag:         '#252836',
    };

    const KEY_SITES       = 'dvm_sites';
    const KEY_FAB_POS     = 'dvm_fab_pos';
    const KEY_FAB_HIDDEN  = 'dvm_fab_hidden';
    const KEY_HINT_DATE   = 'dvm_hint_date';
    const KEY_PAUSE_UNTIL = 'dvm_pause_until';

    let editingSiteId = null;

    // ─── Storage Helpers ──────────────────────────────────────────────────────

    function getSites() {
        try { return JSON.parse(GM_getValue(KEY_SITES, '[]')); } catch { return []; }
    }
    function saveSites(s) { GM_setValue(KEY_SITES, JSON.stringify(s)); }

    function getTodayStringLocal() {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    }

    // If site.resetAtUtcMinutes is set (0..1439), "day" starts at that UTC time.
    // Example: 00:00 UTC => resetAtUtcMinutes = 0
    function getTodayStringUtcReset(resetAtUtcMinutes) {
        const t = Date.now() - (resetAtUtcMinutes * 60 * 1000);
        return new Date(t).toISOString().slice(0, 10);
    }

    function getSiteTodayString(site) {
        const m = site?.resetAtUtcMinutes;
        return Number.isFinite(m) ? getTodayStringUtcReset(m) : getTodayStringLocal();
    }

    function hasVisitedToday(site)  { return GM_getValue(`dvm_visited_${site.id}`, null) === getSiteTodayString(site); }
    function markVisitedToday(site) { GM_setValue(`dvm_visited_${site.id}`, getSiteTodayString(site)); }
    function generateId()         { return Math.random().toString(36).slice(2, 10); }

    // ─── Pause State ──────────────────────────────────────────────────────────

    function isPaused()   { return Date.now() < GM_getValue(KEY_PAUSE_UNTIL, 0); }
    function pauseUntil() { return GM_getValue(KEY_PAUSE_UNTIL, 0); }
    function setPaused(hours)  { GM_setValue(KEY_PAUSE_UNTIL, Date.now() + (hours * 60 * 60 * 1000)); }
    function clearPause() { GM_setValue(KEY_PAUSE_UNTIL, 0); }

    // ─── FAB Hidden State ─────────────────────────────────────────────────────

    function isFabHidden()   { return GM_getValue(KEY_FAB_HIDDEN, false); }
    function setFabHidden(v) { GM_setValue(KEY_FAB_HIDDEN, v); }

    // ─── Match Logic ──────────────────────────────────────────────────────────

    function currentPageMatchesSite(site) {
        try {
            if (site.matchType === 'domain') {
                return location.hostname.includes(new URL(site.url).hostname);
            }
            const norm = s => s.replace(/\/$/, '');
            return norm(location.href) === norm(site.url);
        } catch { return false; }
    }

    // ─── Daily Visit Logic ────────────────────────────────────────────────────

    function processDailyVisits() {
        if (isPaused()) return;

        const sites = getSites().filter(s => s.active);

        for (const site of sites) {
            if (currentPageMatchesSite(site) && !hasVisitedToday(site)) {
                markVisitedToday(site);
            }
        }

        const pending = sites.filter(s => !hasVisitedToday(s));
        if (pending.length === 0) return;

        let fired = false;
        function handleFirstInteraction() {
            if (fired || isPaused()) return;
            fired = true;
            document.removeEventListener('click',   handleFirstInteraction, true);
            document.removeEventListener('keydown', handleFirstInteraction, true);
            for (const site of pending) {
                if (!hasVisitedToday(site)) {
                    markVisitedToday(site);
                    window.open(site.url, '_blank');
                }
            }
        }

        document.addEventListener('click',   handleFirstInteraction, { capture: true, once: true });
        document.addEventListener('keydown', handleFirstInteraction, { capture: true, once: true });
    }

    // ─── Toast ────────────────────────────────────────────────────────────────

    function showToast(htmlMsg, duration = 3500, type = 'info') {
        document.getElementById('dvm-toast')?.remove();
        const bar = { info: C.accent, success: C.success, warn: C.warn, danger: C.danger }[type] || C.accent;

        const toast = document.createElement('div');
        toast.id = 'dvm-toast';
        toast.style.cssText = `
            position:fixed; bottom:28px; left:50%;
            transform:translateX(-50%) translateY(12px);
            z-index:2147483647;
            background:${C.surface}; border:1px solid ${C.border};
            border-left:3px solid ${bar}; border-radius:10px;
            padding:11px 18px; font-family:${FONT}; font-size:12px;
            color:${C.text}; line-height:1.75; white-space:pre-line;
            box-shadow:0 8px 32px rgba(0,0,0,0.5);
            opacity:0; transition:opacity 0.25s, transform 0.25s;
            max-width:340px; text-align:center; pointer-events:none;
        `;
        toast.innerHTML = htmlMsg;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(8px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ─── Daily hint toast when FAB is hidden ─────────────────────────────────

    function maybeShowHintToast() {
        if (!isFabHidden()) return;
        if (GM_getValue(KEY_HINT_DATE, null) === getTodayStringLocal()) return;
        GM_setValue(KEY_HINT_DATE, getTodayStringLocal());
        setTimeout(() => showToast(
            `⌨️ Daily Visit Manager is running\n<span style="color:${C.muted};font-size:11px">Ctrl+Alt+A — open &nbsp;·&nbsp; Ctrl+Alt+S — pause</span>`,
            6000, 'info'
        ), 2500);
    }

    // ─── Styles ───────────────────────────────────────────────────────────────

    function injectStyles() {
        if (document.getElementById('dvm-styles')) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.id = 'dvm-styles';
        style.textContent = `
            #dvm-fab {
                position:fixed; z-index:2147483646;
                width:44px; height:44px; border-radius:50%;
                background:${C.accent}; border:none; cursor:grab;
                display:flex; align-items:center; justify-content:center;
                box-shadow:0 4px 24px rgba(124,106,247,0.45);
                transition:background 0.2s, box-shadow 0.2s;
                font-family:${FONT}; user-select:none; touch-action:none;
            }
            #dvm-fab:hover  { background:${C.accentHover}; }
            #dvm-fab.paused { background:${C.warn}; box-shadow:0 4px 24px rgba(240,168,85,0.4); }
            #dvm-fab.dragging { cursor:grabbing; transform:scale(1.12); }
            #dvm-fab svg { pointer-events:none; }

            #dvm-panel {
                position:fixed; z-index:2147483647;
                width:380px; max-height:580px;
                background:${C.bg}; border:1px solid ${C.border};
                border-radius:14px; box-shadow:0 20px 60px rgba(0,0,0,0.6);
                font-family:${FONT}; font-size:13px; color:${C.text};
                display:none; flex-direction:column; overflow:hidden;
                animation:dvm-up 0.2s ease;
            }
            @keyframes dvm-up {
                from { opacity:0; transform:translateY(10px); }
                to   { opacity:1; transform:translateY(0); }
            }
            #dvm-panel.open { display:flex; }

            .dvm-header {
                padding:14px 16px 12px; border-bottom:1px solid ${C.border};
                display:flex; align-items:center; justify-content:space-between;
                flex-shrink:0; gap:8px;
            }
            .dvm-title {
                font-size:11px; font-weight:500; letter-spacing:0.09em;
                text-transform:uppercase; color:${C.muted}; white-space:nowrap;
            }
            .dvm-ver {
                font-size:10px;
                letter-spacing:0.06em;
                color:${C.muted};
                opacity:0.9;
                margin-left:6px;
            }
            .dvm-header-actions { display:flex; gap:6px; align-items:center; justify-content:flex-end; }

            .dvm-btn-close {
                background:transparent;
                color:${C.danger};
                border:1px solid transparent;
                padding:4px 8px;
                font-size:14px;
                border-radius:8px;
                cursor:pointer;
                line-height:1;
                font-family:${FONT};
            }
            .dvm-btn-close:hover { color:${C.dangerHover}; border-color:rgba(224,92,106,0.35); }

            #dvm-status-bar {
                padding:7px 16px; font-size:11px;
                display:flex; align-items:center; gap:8px;
                border-bottom:1px solid ${C.border};
                flex-shrink:0; background:${C.surface};
            }
            .dvm-dot { width:7px; height:7px; border-radius:50%; background:${C.success}; flex-shrink:0; }
            .dvm-dot.paused { background:${C.warn}; }
            .dvm-status-text { color:${C.muted}; flex:1; }
            .dvm-status-text span { color:${C.warn}; }
            .dvm-status-actions { display:flex; gap:8px; align-items:center; }

            .dvm-btn {
                font-family:${FONT}; font-size:11px; border:none; border-radius:6px;
                cursor:pointer; padding:5px 11px;
                transition:background 0.15s, color 0.15s, border-color 0.15s;
                font-weight:500; white-space:nowrap;
            }
            .dvm-btn-primary { background:${C.accent}; color:#fff; }
            .dvm-btn-primary:hover { background:${C.accentHover}; }
            .dvm-btn-ghost   { background:transparent; color:${C.muted}; border:1px solid ${C.border}; }
            .dvm-btn-ghost:hover { color:${C.text}; border-color:${C.muted}; }
            .dvm-btn-warn    { background:transparent; color:${C.warn}; border:1px solid ${C.border}; }
            .dvm-btn-warn:hover { border-color:${C.warn}; }
            .dvm-btn-danger  { background:transparent; color:${C.danger}; border:1px solid transparent; padding:4px 7px; }
            .dvm-btn-danger:hover { color:${C.dangerHover}; }
            .dvm-btn-icon { background:transparent; color:${C.muted}; border:1px solid transparent; padding:4px 7px; }
            .dvm-btn-icon:hover { color:${C.text}; }
            .dvm-btn-icon:disabled { opacity:0.5; cursor:not-allowed; }

            .dvm-list { overflow-y:auto; flex:1; padding:6px 0; }
            .dvm-list::-webkit-scrollbar { width:4px; }
            .dvm-list::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px; }

            .dvm-empty { padding:30px 18px; text-align:center; color:${C.muted}; font-size:12px; line-height:1.9; }

            .dvm-site-row {
                display:flex; align-items:center; padding:9px 14px;
                gap:10px; border-bottom:1px solid ${C.border};
                transition:background 0.1s;
            }
            .dvm-site-row:last-child { border-bottom:none; }
            .dvm-site-row:hover { background:rgba(255,255,255,0.02); }
            .dvm-site-row.inactive { opacity:0.42; }

            .dvm-site-info { flex:1; min-width:0; }
            .dvm-site-name { font-weight:500; font-size:13px; color:${C.text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .dvm-site-meta { display:flex; align-items:center; gap:5px; margin-top:3px; flex-wrap:wrap; }
            .dvm-site-url  { font-size:11px; color:${C.muted}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:170px; }
            .dvm-tag       { font-size:10px; background:${C.tag}; color:${C.muted}; border-radius:4px; padding:1px 5px; flex-shrink:0; }
            .dvm-tag-done  { color:${C.success}; background:rgba(78,203,141,0.1); }

            .dvm-toggle { position:relative; width:30px; height:17px; flex-shrink:0; }
            .dvm-toggle input { opacity:0; width:0; height:0; position:absolute; }
            .dvm-toggle-slider {
                position:absolute; inset:0; background:${C.border};
                border-radius:99px; cursor:pointer; transition:background 0.2s;
            }
            .dvm-toggle-slider::before {
                content:''; position:absolute; width:11px; height:11px;
                left:3px; top:3px; background:${C.muted}; border-radius:50%;
                transition:transform 0.2s, background 0.2s;
            }
            .dvm-toggle input:checked + .dvm-toggle-slider { background:rgba(124,106,247,0.22); }
            .dvm-toggle input:checked + .dvm-toggle-slider::before { transform:translateX(13px); background:${C.accent}; }

            .dvm-form {
                padding:14px 16px; border-top:1px solid ${C.border};
                display:none; flex-direction:column; gap:10px;
                background:${C.surface}; flex-shrink:0;
            }
            .dvm-form.open { display:flex; }
            .dvm-form-title { font-size:10px; text-transform:uppercase; letter-spacing:0.09em; color:${C.muted}; }
            .dvm-field { display:flex; flex-direction:column; gap:4px; }
            .dvm-label { font-size:10px; color:${C.muted}; text-transform:uppercase; letter-spacing:0.07em; }
            .dvm-input {
                font-family:${FONT}; font-size:12px; background:${C.bg};
                border:1px solid ${C.border}; border-radius:6px; color:${C.text};
                padding:7px 10px; outline:none; transition:border-color 0.15s;
            }
            .dvm-input:focus { border-color:${C.accent}; }
            .dvm-input:disabled { opacity:0.65; cursor:not-allowed; }

            .dvm-radio-group { display:flex; gap:7px; }
            .dvm-radio-option {
                display:flex; align-items:center; gap:5px; cursor:pointer;
                font-size:11px; color:${C.text}; padding:5px 10px;
                border:1px solid ${C.border}; border-radius:6px;
                transition:border-color 0.15s, background 0.15s;
                flex:1; justify-content:center;
            }
            .dvm-radio-option input { display:none; }
            .dvm-radio-option.selected { border-color:${C.accent}; background:rgba(124,106,247,0.1); color:${C.accent}; }

            .dvm-form-row { display:flex; gap:8px; align-items:center; justify-content:space-between; }
            .dvm-active-row { display:flex; align-items:center; gap:8px; font-size:12px; color:${C.muted}; }
            .dvm-error-msg { font-size:11px; color:${C.danger}; display:none; }
            .dvm-error-msg.show { display:block; }

            .dvm-footer {
                padding:8px 16px; border-top:1px solid ${C.border};
                display:flex; gap:12px; flex-shrink:0; background:${C.surface};
                flex-wrap:wrap; align-items:center;
            }
            .dvm-kbd-hint { font-size:10px; color:${C.muted}; display:flex; align-items:center; gap:4px; }
            .dvm-kbd {
                background:${C.tag}; border:1px solid ${C.border};
                border-radius:3px; padding:1px 5px; font-size:10px; color:${C.text};
            }
            #dvm-hide-fab-btn {
                margin-left:auto;
                white-space:nowrap;
                padding:5px 9px;
                max-width:220px;
                text-align:left;
            }

            #dvm-fab-menu {
                position:fixed;
                z-index:2147483647;
                min-width:190px;
                background:${C.surface};
                border:1px solid ${C.border};
                border-radius:12px;
                box-shadow:0 20px 60px rgba(0,0,0,0.65);
                padding:6px;
                display:none;
            }
            #dvm-fab-menu.open { display:block; }
            .dvm-menu-item {
                width:100%;
                text-align:left;
                background:transparent;
                border:1px solid transparent;
                color:${C.text};
                font-family:${FONT};
                font-size:12px;
                padding:8px 10px;
                border-radius:10px;
                cursor:pointer;
                display:flex;
                justify-content:space-between;
                gap:10px;
            }
            .dvm-menu-item:hover { background:rgba(255,255,255,0.04); border-color:${C.border}; }
            .dvm-menu-muted { color:${C.muted}; font-size:11px; }
            .dvm-menu-danger { color:${C.danger}; }
            .dvm-menu-danger:hover { background:rgba(224,92,106,0.08); border-color:rgba(224,92,106,0.25); }
        `;
        document.head.appendChild(style);
    }

    // ─── Panel Positioning ────────────────────────────────────────────────────

    function positionPanel(fab, panel) {
        const r = fab.getBoundingClientRect();
        const pw = 380, margin = 10;
        const ph = Math.min(580, window.innerHeight - 40);

        let left = r.left + r.width / 2 - pw / 2;
        let top  = r.top - ph - 12;
        if (top < margin) top = r.bottom + 12;
        left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
        top  = Math.max(margin, Math.min(top,  window.innerHeight - ph - margin));

        panel.style.left   = left + 'px';
        panel.style.top    = top  + 'px';
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
    }

    // ─── FAB Icon ─────────────────────────────────────────────────────────────

    function updateFabIcon(fab) {
        if (isPaused()) {
            fab.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
            fab.classList.add('paused');
        } else {
            fab.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
            fab.classList.remove('paused');
        }
    }

    // ─── Pause ────────────────────────────────────────────────────────────────

    function togglePause(fab, panel) {
        if (isPaused()) {
            clearPause();
            showToast('▶️ Script resumed', 2500, 'success');
        } else {
            const input = prompt('Pause for how many hours?', '1');
            if (input === null) return;
            const hours = Number(input);
            if (!Number.isFinite(hours) || hours <= 0 || hours > 72) {
                showToast('Invalid hours. Enter a number between 0.1 and 72.', 3500, 'danger');
                return;
            }
            setPaused(hours);
            showToast(`⏸ Script paused for ${hours} hour${hours === 1 ? '' : 's'}`, 2500, 'warn');
        }
        updateFabIcon(fab);
        if (panel.classList.contains('open')) syncStatusBar(panel);
    }

    function syncStatusBar(panel) {
        const dot    = panel.querySelector('#dvm-dot');
        const text   = panel.querySelector('#dvm-status-text');
        const btn    = panel.querySelector('#dvm-pause-btn');
        const paused = isPaused();

        dot.classList.toggle('paused', paused);

        if (paused) {
            const at = new Date(pauseUntil());
            const hh = String(at.getHours()).padStart(2,'0');
            const mm = String(at.getMinutes()).padStart(2,'0');
            text.innerHTML = `Paused — resumes at <span>${hh}:${mm}</span>`;
            btn.textContent = '▶ Resume';
            btn.className = 'dvm-btn dvm-btn-primary';
        } else {
            text.textContent = 'Running';
            btn.textContent = '⏸ Pause';
            btn.className = 'dvm-btn dvm-btn-warn';
        }
    }

    // ─── Hide / Show FAB ──────────────────────────────────────────────────────

    function hideFab(fab, panel) {
        setFabHidden(true);
        fab.style.display = 'none';
        panel.classList.remove('open');
        showToast(
            `👁 FAB hidden\n<span style="color:${C.muted};font-size:11px">Ctrl+Alt+A to reopen · daily reminder on</span>`,
            5000, 'info'
        );
    }

    function showFab(fab) {
        setFabHidden(false);
        fab.style.display = 'flex';
        showToast('👁 FAB visible again', 2000, 'success');
    }

    function syncHideFabBtn(fab, panel) {
        const btn = panel.querySelector('#dvm-hide-fab-btn');
        if (!btn) return;
        if (isFabHidden()) {
            btn.textContent = '👁 Show floating button';
            btn.onclick = () => { showFab(fab); syncHideFabBtn(fab, panel); };
        } else {
            btn.textContent = '🙈 Hide floating button';
            btn.onclick = () => hideFab(fab, panel);
        }
    }

    // ─── Panel Toggle ─────────────────────────────────────────────────────────

    function openPanel(fab, panel) {
        positionPanel(fab, panel);
        panel.classList.add('open');
        syncStatusBar(panel);
        syncHideFabBtn(fab, panel);
        renderList();
    }

    function closePanel(panel) {
        panel.classList.remove('open');
        closeForm();
    }

    function togglePanel(fab, panel) {
        if (panel.classList.contains('open')) closePanel(panel);
        else openPanel(fab, panel);
    }

    // ─── Draggable FAB ───────────────────────────────────────────────────────

    function makeDraggable(fab, panel) {
        let sx, sy, sl, st, dragged = false;

        function move(ex, ey) {
            const dx = ex - sx, dy = ey - sy;
            if (!dragged && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
            dragged = true;
            fab.classList.add('dragging');
            const m = 6, size = 44;
            const nl = Math.max(m, Math.min(sl + dx, window.innerWidth  - size - m));
            const nt = Math.max(m, Math.min(st + dy, window.innerHeight - size - m));
            fab.style.left = nl + 'px'; fab.style.top = nt + 'px';
            fab.style.right = 'auto'; fab.style.bottom = 'auto';
            if (panel.classList.contains('open')) positionPanel(fab, panel);
        }

        function up() {
            fab.classList.remove('dragging');
            document.removeEventListener('mousemove', onMM);
            document.removeEventListener('mouseup',   up);
            document.removeEventListener('touchmove', onTM);
            document.removeEventListener('touchend',  up);
            if (dragged) {
                const r = fab.getBoundingClientRect();
                GM_setValue(KEY_FAB_POS, JSON.stringify({ left: r.left, top: r.top }));
            }
        }

        function onMM(e) { move(e.clientX, e.clientY); }
        function onTM(e) { move(e.touches[0].clientX, e.touches[0].clientY); }

        fab.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            dragged = false;
            sx = e.clientX; sy = e.clientY;
            const r = fab.getBoundingClientRect(); sl = r.left; st = r.top;
            document.addEventListener('mousemove', onMM);
            document.addEventListener('mouseup',   up);
            e.preventDefault();
        });

        fab.addEventListener('touchstart', e => {
            dragged = false;
            sx = e.touches[0].clientX; sy = e.touches[0].clientY;
            const r = fab.getBoundingClientRect(); sl = r.left; st = r.top;
            document.addEventListener('touchmove', onTM, { passive: false });
            document.addEventListener('touchend',  up);
        }, { passive: true });

        // Block click if we actually dragged
        fab.addEventListener('click', e => { if (dragged) { e.stopImmediatePropagation(); dragged = false; } }, true);
    }

    // ─── Site List ────────────────────────────────────────────────────────────

    function renderList() {
        const list = document.getElementById('dvm-list');
        if (!list) return;
        const sites = getSites();

        if (sites.length === 0) {
            list.innerHTML = `<div class="dvm-empty">No sites yet.<br/>Click <strong>+ Add Site</strong> to get started.</div>`;
            return;
        }

        list.innerHTML = sites.map(site => `
            <div class="dvm-site-row ${site.active ? '' : 'inactive'}" data-id="${site.id}">
                <div class="dvm-site-info">
                    <div class="dvm-site-name">${escHtml(site.name)}</div>
                    <div class="dvm-site-meta">
                        <span class="dvm-site-url">${escHtml(site.url)}</span>
                        <span class="dvm-tag">${site.matchType === 'domain' ? 'domain' : 'full url'}</span>
                        <span class="dvm-tag">${formatResetTag(site)}</span>
                        ${hasVisitedToday(site) ? `<span class="dvm-tag dvm-tag-done">✓ visited</span>` : ''}
                    </div>
                </div>
                <label class="dvm-toggle">
                    <input type="checkbox" class="dvm-toggle-active" data-id="${site.id}" ${site.active ? 'checked' : ''} />
                    <span class="dvm-toggle-slider"></span>
                </label>
                <button class="dvm-btn dvm-btn-icon dvm-edit-btn" title="Edit URL / Reset time" data-id="${site.id}">✎</button>
                <button class="dvm-btn dvm-btn-danger dvm-delete-btn" data-id="${site.id}">✕</button>
            </div>
        `).join('');

        list.querySelectorAll('.dvm-toggle-active').forEach(el => {
            el.addEventListener('change', () => {
                const sites = getSites(), site = sites.find(s => s.id === el.dataset.id);
                if (site) { site.active = el.checked; saveSites(sites); el.closest('.dvm-site-row').classList.toggle('inactive', !el.checked); }
            });
        });

        list.querySelectorAll('.dvm-delete-btn').forEach(el => {
            el.addEventListener('click', () => {
                const sites = getSites(), target = sites.find(s => s.id === el.dataset.id);
                if (!target || !confirm(`Remove "${target.name}"?`)) return;
                saveSites(sites.filter(s => s.id !== el.dataset.id));
                renderList();
            });
        });

        list.querySelectorAll('.dvm-edit-btn').forEach(el => {
            el.addEventListener('click', () => openEditForm(el.dataset.id));
        });
    }

    // ─── Form ─────────────────────────────────────────────────────────────────

    function openForm() {
        editingSiteId = null;
        const form = document.getElementById('dvm-form');
        form.classList.add('open');
        document.querySelector('#dvm-form .dvm-form-title').textContent = 'New Site';
        document.getElementById('dvm-save-btn').textContent = 'Save';

        const defaultName = (document.title || location.hostname || '').trim().slice(0, 40);
        const nameEl = document.getElementById('dvm-f-name');
        const urlEl = document.getElementById('dvm-f-url');
        const resetEl = document.getElementById('dvm-f-reset-utc');
        const activeEl = document.getElementById('dvm-f-active');
        const domainEl = document.getElementById('dvm-r-domain');
        const fullEl = document.getElementById('dvm-r-full');

        nameEl.disabled = false;
        domainEl.disabled = false;
        fullEl.disabled = false;
        activeEl.disabled = false;

        nameEl.value = defaultName;
        urlEl.value  = location.href || '';
        document.getElementById('dvm-r-domain').checked = true;
        document.getElementById('dvm-r-domain-label').classList.add('selected');
        document.getElementById('dvm-r-full-label').classList.remove('selected');
        document.getElementById('dvm-f-active').checked = true;
        resetEl.value = '';
        hideError();
        document.getElementById('dvm-f-name').focus();
    }

    function openEditForm(id) {
        const sites = getSites();
        const site = sites.find(s => s.id === id);
        if (!site) return;

        editingSiteId = id;
        const form = document.getElementById('dvm-form');
        form.classList.add('open');
        document.querySelector('#dvm-form .dvm-form-title').textContent = 'Edit Site';
        document.getElementById('dvm-save-btn').textContent = 'Update';

        const nameEl = document.getElementById('dvm-f-name');
        const urlEl = document.getElementById('dvm-f-url');
        const resetEl = document.getElementById('dvm-f-reset-utc');
        const activeEl = document.getElementById('dvm-f-active');
        const domainEl = document.getElementById('dvm-r-domain');
        const fullEl = document.getElementById('dvm-r-full');

        // Only allow URL + reset time edits
        nameEl.value = site.name || '';
        nameEl.disabled = true;

        urlEl.value = site.url || '';
        urlEl.disabled = false;

        const m = site?.resetAtUtcMinutes;
        if (Number.isFinite(m)) {
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            resetEl.value = `${hh}:${mm}`;
        } else {
            resetEl.value = '';
        }
        resetEl.disabled = false;

        domainEl.checked = site.matchType === 'domain';
        fullEl.checked = site.matchType !== 'domain';
        domainEl.disabled = true;
        fullEl.disabled = true;
        document.getElementById('dvm-r-domain-label').classList.toggle('selected', domainEl.checked);
        document.getElementById('dvm-r-full-label').classList.toggle('selected', fullEl.checked);

        activeEl.checked = !!site.active;
        activeEl.disabled = true;

        hideError();
        urlEl.focus();
        urlEl.select();
    }

    function closeForm() {
        document.getElementById('dvm-form')?.classList.remove('open');
        editingSiteId = null;
        hideError();
    }

    function showError(msg) {
        const el = document.getElementById('dvm-error');
        el.textContent = msg; el.classList.add('show');
    }

    function hideError() {
        document.getElementById('dvm-error')?.classList.remove('show');
    }

    function handleSave() {
        hideError();
        const name      = document.getElementById('dvm-f-name').value.trim();
        const url       = document.getElementById('dvm-f-url').value.trim();
        const matchType = document.querySelector('input[name="dvm-match"]:checked').value;
        const active    = document.getElementById('dvm-f-active').checked;
        const resetUtc  = document.getElementById('dvm-f-reset-utc').value.trim();

        if (!url)  return showError('URL is required.');

        let parsedUrl;
        try { parsedUrl = new URL(url); } catch { return showError('Invalid URL — include https://'); }

        const sites = getSites();
        if (!editingSiteId) {
            if (!name) return showError('Name is required.');
            if (sites.find(s => s.name.toLowerCase() === name.toLowerCase())) return showError('Name already exists.');
        }
        if (sites.find(s => s.url === parsedUrl.href && s.id !== editingSiteId)) return showError('URL already registered.');

        let resetAtUtcMinutes = null;
        if (resetUtc) {
            const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(resetUtc);
            if (!m) return showError('Reset time must be HH:MM (UTC), e.g. 00:00');
            resetAtUtcMinutes = (parseInt(m[1], 10) * 60) + parseInt(m[2], 10);
        }

        if (editingSiteId) {
            const site = sites.find(s => s.id === editingSiteId);
            if (!site) return showError('Site not found.');
            site.url = parsedUrl.href;
            site.resetAtUtcMinutes = resetAtUtcMinutes;
            saveSites(sites);
        } else {
            sites.push({ id: generateId(), name, url: parsedUrl.href, matchType, active, resetAtUtcMinutes });
            saveSites(sites);
        }
        closeForm();
        renderList();
    }

    function escHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function formatResetTag(site) {
        const m = site?.resetAtUtcMinutes;
        if (!Number.isFinite(m)) return 'local reset';
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        return `reset ${hh}:${mm}Z`;
    }

    // ─── Build UI ─────────────────────────────────────────────────────────────

    function buildUI() {
        injectStyles();

        const scriptName = (typeof GM_info !== 'undefined' && GM_info?.script?.name) ? GM_info.script.name : 'Daily Visit Manager';
        const scriptVersion = (typeof GM_info !== 'undefined' && GM_info?.script?.version) ? GM_info.script.version : '';

        // FAB
        const fab = document.createElement('button');
        fab.id = 'dvm-fab';
        fab.title = 'Daily Visit Manager (Ctrl+Alt+A)';

        try {
            const p = JSON.parse(GM_getValue(KEY_FAB_POS, 'null'));
            if (p) { fab.style.left = p.left + 'px'; fab.style.top = p.top + 'px'; fab.style.right = 'auto'; fab.style.bottom = 'auto'; }
            else   { fab.style.right = '24px'; fab.style.bottom = '24px'; }
        } catch    { fab.style.right = '24px'; fab.style.bottom = '24px'; }

        updateFabIcon(fab);
        if (isFabHidden()) fab.style.display = 'none';

        // Panel
        const panel = document.createElement('div');
        panel.id = 'dvm-panel';
        panel.innerHTML = `
            <div class="dvm-header">
                <span class="dvm-title">${escHtml(scriptName)}${scriptVersion ? ` <span class="dvm-ver">(v${escHtml(String(scriptVersion))})</span>` : ''}</span>
                <div class="dvm-header-actions">
                    <button class="dvm-btn-close" id="dvm-close-btn" title="Close">✕</button>
                </div>
            </div>
            <div id="dvm-status-bar">
                <div class="dvm-dot" id="dvm-dot"></div>
                <div class="dvm-status-text" id="dvm-status-text">Running</div>
                <div class="dvm-status-actions">
                    <button class="dvm-btn dvm-btn-warn"    id="dvm-pause-btn">⏸ Pause</button>
                    <button class="dvm-btn dvm-btn-primary" id="dvm-add-btn">+ Add</button>
                </div>
            </div>
            <div class="dvm-list" id="dvm-list"></div>
            <div class="dvm-form" id="dvm-form">
                <div class="dvm-form-title">New Site</div>
                <div class="dvm-field">
                    <span class="dvm-label">Friendly Name</span>
                    <input class="dvm-input" id="dvm-f-name" placeholder="e.g. Simkl" maxlength="40" />
                </div>
                <div class="dvm-field">
                    <span class="dvm-label">URL</span>
                    <input class="dvm-input" id="dvm-f-url" placeholder="https://simkl.com/" />
                </div>
                <div class="dvm-field">
                    <span class="dvm-label">Reset time (UTC, optional)</span>
                    <input class="dvm-input" id="dvm-f-reset-utc" placeholder="00:00 (leave empty = local midnight)" />
                </div>
                <div class="dvm-field">
                    <span class="dvm-label">Match Type</span>
                    <div class="dvm-radio-group">
                        <label class="dvm-radio-option selected" id="dvm-r-domain-label">
                            <input type="radio" name="dvm-match" value="domain" checked id="dvm-r-domain" /> Domain
                        </label>
                        <label class="dvm-radio-option" id="dvm-r-full-label">
                            <input type="radio" name="dvm-match" value="full" id="dvm-r-full" /> Full URL
                        </label>
                    </div>
                </div>
                <div class="dvm-form-row">
                    <div class="dvm-active-row">
                        <label class="dvm-toggle">
                            <input type="checkbox" id="dvm-f-active" checked />
                            <span class="dvm-toggle-slider"></span>
                        </label>
                        <span>Active</span>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="dvm-btn dvm-btn-ghost"   id="dvm-cancel-btn">Cancel</button>
                        <button class="dvm-btn dvm-btn-primary" id="dvm-save-btn">Save</button>
                    </div>
                </div>
                <span class="dvm-error-msg" id="dvm-error"></span>
            </div>
            <div class="dvm-footer">
                <div class="dvm-kbd-hint"><span class="dvm-kbd">Ctrl+Alt+A</span> open</div>
                <div class="dvm-kbd-hint"><span class="dvm-kbd">Ctrl+Alt+S</span> pause</div>
                <div style="flex:1"></div>
                <button class="dvm-btn dvm-btn-ghost" id="dvm-hide-fab-btn">🙈 Hide floating button</button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        // FAB right-click menu
        const fabMenu = document.createElement('div');
        fabMenu.id = 'dvm-fab-menu';
        fabMenu.innerHTML = `
            <button class="dvm-menu-item" id="dvm-m-open"><span>Open configuration</span><span class="dvm-menu-muted">Ctrl+Alt+A</span></button>
            <button class="dvm-menu-item" id="dvm-m-pause"><span>Pause / Resume</span><span class="dvm-menu-muted">Ctrl+Alt+S</span></button>
            <button class="dvm-menu-item" id="dvm-m-add-current"><span>Add current site</span><span class="dvm-menu-muted">quick</span></button>
            <button class="dvm-menu-item" id="dvm-m-add-new"><span>Add new site</span><span class="dvm-menu-muted">form</span></button>
            <button class="dvm-menu-item dvm-menu-danger" id="dvm-m-hide"><span>Hide floating button</span><span class="dvm-menu-muted">✕</span></button>
        `;
        document.body.appendChild(fabMenu);

        makeDraggable(fab, panel);
        fab.addEventListener('click', () => togglePanel(fab, panel));

        function closeFabMenu() { fabMenu.classList.remove('open'); }
        function openFabMenu(x, y) {
            fabMenu.classList.add('open'); // show first
            const margin = 8;
            const mw = fabMenu.offsetWidth;  // now measurable
            const mh = fabMenu.offsetHeight;
            fabMenu.style.left = Math.max(margin, Math.min(x, window.innerWidth  - mw - margin)) + 'px';
            fabMenu.style.top  = Math.max(margin, Math.min(y, window.innerHeight - mh - margin)) + 'px';
        }

        function addCurrentSiteQuick() {
            const name = (document.title || location.hostname || 'New site').trim().slice(0, 40);
            const url = (location.href || '').trim();
            if (!url) return showToast('No URL detected for this page.', 2500, 'danger');
            let parsedUrl;
            try { parsedUrl = new URL(url); } catch { return showToast('Current page URL is invalid.', 2500, 'danger'); }

            const sites = getSites();
            if (sites.find(s => s.url === parsedUrl.href)) {
                showToast('This URL is already registered.', 2500, 'warn');
                return;
            }
            sites.push({ id: generateId(), name, url: parsedUrl.href, matchType: 'domain', active: true, resetAtUtcMinutes: null });
            saveSites(sites);
            renderList();
            showToast('✓ Added current site', 2000, 'success');
        }

        fab.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            syncHideFabBtn(fab, panel);
            syncStatusBar(panel);
            openFabMenu(e.clientX, e.clientY);
        });

        document.addEventListener('click', (e) => {
            if (!fabMenu.classList.contains('open')) return;
            if (fabMenu.contains(e.target)) return;
            closeFabMenu();
        }, true);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFabMenu(); }, true);
        window.addEventListener('resize', closeFabMenu, true);
        window.addEventListener('scroll', closeFabMenu, true);

        fabMenu.querySelector('#dvm-m-open').addEventListener('click', () => {
            closeFabMenu();
            if (isFabHidden()) showFab(fab);
            openPanel(fab, panel);
        });
        fabMenu.querySelector('#dvm-m-pause').addEventListener('click', () => {
            closeFabMenu();
            togglePause(fab, panel);
        });
        fabMenu.querySelector('#dvm-m-add-current').addEventListener('click', () => {
            closeFabMenu();
            addCurrentSiteQuick();
        });
        fabMenu.querySelector('#dvm-m-add-new').addEventListener('click', () => {
            closeFabMenu();
            if (isFabHidden()) showFab(fab);
            openPanel(fab, panel);
            openForm();
        });
        fabMenu.querySelector('#dvm-m-hide').addEventListener('click', () => {
            closeFabMenu();
            hideFab(fab, panel);
        });

        panel.querySelector('#dvm-close-btn').addEventListener('click',  () => closePanel(panel));
        panel.querySelector('#dvm-add-btn').addEventListener('click',     openForm);
        panel.querySelector('#dvm-cancel-btn').addEventListener('click',  closeForm);
        panel.querySelector('#dvm-save-btn').addEventListener('click',    handleSave);
        panel.querySelector('#dvm-pause-btn').addEventListener('click',   () => togglePause(fab, panel));
        syncHideFabBtn(fab, panel);

        ['dvm-r-domain','dvm-r-full'].forEach(id => {
            panel.querySelector('#' + id).addEventListener('change', () => {
                panel.querySelector('#dvm-r-domain-label').classList.toggle('selected', panel.querySelector('#dvm-r-domain').checked);
                panel.querySelector('#dvm-r-full-label').classList.toggle('selected',   panel.querySelector('#dvm-r-full').checked);
            });
        });

        syncStatusBar(panel);
        renderList();
    }

    // ─── Keybinds ─────────────────────────────────────────────────────────────

    function registerKeybinds(fab, panel) {
        document.addEventListener('keydown', e => {
            if (!e.ctrlKey || !e.altKey) return;

            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                if (isFabHidden()) showFab(fab);
                togglePanel(fab, panel);
            }

            if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                togglePause(fab, panel);
            }
        }, true);
    }

    // ─── Auto-resume Watcher ──────────────────────────────────────────────────

    function startPauseWatcher(fab, panel) {
        setInterval(() => {
            // Once pause expires naturally, refresh the icon silently
            if (!isPaused()) {
                updateFabIcon(fab);
                if (panel.classList.contains('open')) syncStatusBar(panel);
            }
        }, 30 * 1000); // check every 30s
    }

    // ─── Entry Point ──────────────────────────────────────────────────────────

    processDailyVisits();
    buildUI();

    const fab   = document.getElementById('dvm-fab');
    const panel = document.getElementById('dvm-panel');

    registerKeybinds(fab, panel);
    startPauseWatcher(fab, panel);
    maybeShowHintToast();

    GM_registerMenuCommand('Open Daily Visit Manager',  () => { if (isFabHidden()) showFab(fab); openPanel(fab, panel); });
    GM_registerMenuCommand('Pause / Resume',            () => togglePause(fab, panel));
    GM_registerMenuCommand('Hide / Show floating button', () => {
        if (isFabHidden()) showFab(fab);
        else hideFab(fab, panel);
        syncHideFabBtn(fab, panel);
    });

})();